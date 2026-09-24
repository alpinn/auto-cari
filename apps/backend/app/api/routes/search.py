"""POST /api/search — the core recommendation pipeline.

Flow: sanitize -> rate limit -> cache -> intent -> (coming_soon/clarifying) ->
LLM candidates -> per-candidate Serper (+ Tavily) -> pick real listings -> rank ->
cache -> log -> return. No candidates/listings -> optimize -> raw-query Serper.
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.agents.intent_classifier import intent_classifier
from app.agents.product_agent import product_agent
from app.config import settings
from app.models.request import SearchRequest
from app.models.response import (
    ProductCard,
    SearchComingSoonResponse,
    SearchSuccessResponse,
)
from app.services.cache_service import cache_service
from app.services.db_service import db_service
from app.services.llm_service import LLMError, llm_service
from app.services.serper_service import serper_service
from app.services.tavily_service import tavily_service
from app.utils.http import ExternalServiceError
from app.utils.normalizer import (
    extract_budget_max,
    normalize_serper_products,
    pick_candidate_listing,
)
from app.utils.rate_limiter import check_rate_limit
from app.utils.sanitizer import InvalidQueryError, sanitize_query

logger = logging.getLogger("autocari.search")
router = APIRouter()

CANDIDATE_SERPER_NUM = 10  # listings per candidate; we only need the cheapest sane one


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _cache_key(query: str) -> str:
    digest = hashlib.md5(query.lower().strip().encode("utf-8")).hexdigest()
    return f"search:{digest}"


def _error(code: str, message: str, status: int) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"type": "error", "code": code, "message": message},
    )


@router.post("/search", summary="Cari rekomendasi produk")
async def search(req: SearchRequest, request: Request):
    started = time.perf_counter()

    # 1. Sanitize -----------------------------------------------------------
    try:
        clean_query = sanitize_query(req.query)
    except InvalidQueryError as exc:
        return _error("INVALID_QUERY", str(exc), 400)

    # Merge clarification (clarifying-question follow-up) into the query.
    effective_query = clean_query
    has_clarification = bool(req.clarification)
    if has_clarification:
        effective_query = f"{clean_query} {req.clarification}".strip()

    # 2. Rate limit ---------------------------------------------------------
    rl = await check_rate_limit(_client_ip(request))
    if not rl.allowed:
        return _error(
            "RATE_LIMITED",
            "Batas pencarian harian tercapai. Coba lagi besok.",
            429,
        )

    # 3. Cache --------------------------------------------------------------
    cache_key = _cache_key(effective_query)
    cached = await cache_service.get_json(cache_key)
    if cached:
        cached["cached"] = True
        return JSONResponse(content=cached)

    # 4. Intent classification (skipped when answering a clarification) -----
    category = "electronics"
    if not has_clarification:
        try:
            intent = await intent_classifier.classify(effective_query)
        except (LLMError, ExternalServiceError) as exc:
            logger.error("intent classification failed: %s", exc)
            return _error("LLM_TIMEOUT", "Terjadi gangguan sementara. Coba lagi.", 504)

        category = intent.category

        if category == "off_topic":
            _log_async(effective_query, "off_topic", False, started, 0, req.session_id)
            return _error(
                "OUT_OF_SCOPE",
                "Autocari khusus membantu pencarian & rekomendasi produk. Coba tanya soal produk yang ingin kamu cari, ya!",
                400,
            )

        if category == "coming_soon":
            label = intent_classifier.coming_soon_label(intent.detected_intent)
            resp = SearchComingSoonResponse(
                detected_category=intent.detected_intent or label,
                message=f"Kategori {label} sedang kami siapkan!",
            )
            _log_async(effective_query, "coming_soon", False, started, 0, req.session_id)
            return JSONResponse(content=resp.model_dump())

        if category == "ambiguous":
            clarifying = await intent_classifier.build_clarifying(effective_query)
            _log_async(effective_query, "clarifying", False, started, 0, req.session_id)
            return JSONResponse(content=clarifying.model_dump())

    budget_max = extract_budget_max(effective_query)

    # 5. Candidate generation: LLM names concrete products; Serper only validates
    #    price/availability per candidate (Shopping can't grasp "kamera terbaik").
    candidates = await llm_service.generate_candidates(effective_query)
    normalized: list[dict] = []
    reviews: list[dict] = []
    optimized = effective_query

    if candidates:
        logger.info("candidates: %s", candidates)
        serper_results = await asyncio.gather(
            *(serper_service.search_shopping(c, num=CANDIDATE_SERPER_NUM) for c in candidates),
            return_exceptions=True,
        )
        picked: list[str] = []
        for cand, raw in zip(candidates, serper_results):
            if isinstance(raw, Exception):
                logger.warning("serper failed for candidate %r: %s", cand, raw)
                continue
            pick = pick_candidate_listing(
                cand, normalize_serper_products(raw, cap=CANDIDATE_SERPER_NUM), budget_max
            )
            if pick:
                normalized.append(pick)
                picked.append(cand)
            else:
                logger.info("candidate %r dropped (not found / over budget)", cand)

        # Reviews per surviving product (a generic query returned off-topic articles).
        # Only survivors, 1 article each: saves Tavily credits and the LLM's token budget.
        review_results = await asyncio.gather(
            *(tavily_service.search_reviews(c, max_results=1) for c in picked),
            return_exceptions=True,
        )
        for cand, res in zip(picked, review_results):
            if isinstance(res, Exception):
                logger.warning("tavily failed for %r (continuing): %s", cand, res)
                continue
            reviews += [{**r, "title": f"[{cand}] {r['title']}"} for r in res]

    normalized = normalized[: settings.MAX_PRODUCTS_TO_LLM]

    # Fallback: candidate step failed or nothing survived -> old raw-query flow.
    if not normalized:
        optimized = await llm_service.optimize_query(effective_query)
        serper_raw, tavily_raw = await asyncio.gather(
            serper_service.search_shopping(optimized, num=40),
            tavily_service.search_reviews(optimized, max_results=3),
            return_exceptions=True,
        )
        if isinstance(serper_raw, Exception):
            logger.error("serper failed: %s", serper_raw)
            return _error("SEARCH_FAILED", "Terjadi gangguan sementara. Coba lagi dalam beberapa detik.", 503)
        if isinstance(tavily_raw, Exception):
            logger.warning("tavily failed (continuing without reviews): %s", tavily_raw)
        else:
            reviews = tavily_raw
        normalized = normalize_serper_products(
            serper_raw, cap=settings.MAX_PRODUCTS_TO_LLM, budget_max=budget_max
        )

    # Google Shopping's live ranking is non-deterministic — the same query can
    # occasionally come back with zero results from our 4 tracked marketplaces
    # even though relevant listings exist. One retry against the raw
    # (pre-optimization) query text gives a second, differently-ranked draw
    # before we give up and tell the user nothing matched.
    if not normalized and optimized != effective_query:
        logger.info("no marketplace matches for optimized query, retrying with raw query")
        try:
            retry_raw = await serper_service.search_shopping(effective_query, num=40)
            normalized = normalize_serper_products(
                retry_raw, cap=settings.MAX_PRODUCTS_TO_LLM, budget_max=budget_max
            )
        except ExternalServiceError as exc:
            logger.warning("raw-query retry failed, keeping empty result: %s", exc)

    if not normalized:
        # No results: a valid success response with an empty product list.
        empty = SearchSuccessResponse(
            summary="Maaf, kami tidak menemukan produk yang sesuai. Coba kata kunci lain.",
            products=[],
            sources=["Google Shopping"],
            cached=False,
        )
        _log_async(effective_query, "electronics", False, started, 0, req.session_id)
        return JSONResponse(content=empty.model_dump())

    # 8. AI ranking & reasoning --------------------------------------------
    review_text = tavily_service.to_prompt_text(reviews)
    try:
        summary, cards = await product_agent.rank(normalized, review_text, effective_query)
    except LLMError as exc:
        logger.error("ranking LLM error: %s", exc)
        return _error("LLM_TIMEOUT", "Terjadi gangguan sementara. Coba lagi.", 504)

    sources = ["Google Shopping"] + tavily_service.source_names(reviews)
    response = SearchSuccessResponse(
        summary=summary,
        products=cards,
        sources=sources,
        cached=False,
    )

    # 9. Cache + 10. log (non-blocking) ------------------------------------
    payload = response.model_dump()
    await cache_service.set_json(cache_key, payload, ttl=settings.SEARCH_CACHE_TTL)

    # Seed per-product cache so GET /api/product/{id} can serve detail later.
    for card in cards:
        asyncio.create_task(
            cache_service.set_json(
                f"product:{card.id}", card.model_dump(), ttl=settings.PRODUCT_CACHE_TTL
            )
        )
    _log_async(effective_query, "electronics", False, started, len(cards), req.session_id)

    # Best-effort trending tracker.
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    asyncio.create_task(cache_service.record_trending(clean_query, day))

    return JSONResponse(content=payload)


def _log_async(
    query: str,
    category: str,
    is_cached: bool,
    started: float,
    result_count: int,
    session_id: str | None,
) -> None:
    """Fire-and-forget analytics write — never blocks the response."""
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    asyncio.create_task(
        db_service.log_query(
            raw_query=query,
            category=category,
            is_cached=is_cached,
            response_time=elapsed_ms,
            result_count=result_count,
            session_id=session_id,
        )
    )

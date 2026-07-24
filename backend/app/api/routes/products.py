"""GET /api/product/{product_id}.

Phase 1 has no scraped spec database, so detail is built from the cached card
data written during search (key product:{id}). The richer fields (specs,
multi-marketplace prices, sentiment) are derived/placeholder where source data
isn't available, while staying schema-complete for the UI.
"""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.response import (
    FitReason,
    PriceEntry,
    ProductDetailResponse,
    SentimentScore,
)
from app.services.cache_service import cache_service

logger = logging.getLogger("autocari.products")
router = APIRouter()


@router.get("/product/{product_id}", summary="Detail produk")
async def product_detail(product_id: str):
    seed = await cache_service.get_json(f"product:{product_id}")
    if not seed:
        return JSONResponse(
            status_code=404,
            content={
                "type": "error",
                "code": "PRODUCT_NOT_FOUND",
                "message": "Produk tidak ditemukan atau sudah kedaluwarsa. Lakukan pencarian ulang.",
            },
        )

    price = int(seed.get("price", 0))
    badges: list[str] = []
    if seed.get("store_badge") == "official":
        badges.append("official_store")
    if seed.get("score", 0) and float(seed["score"]) >= 8.5:
        badges.append("high_performance")

    # Sentiment proxy derived from the marketplace rating (0-5 -> 0-10).
    sentiment: dict[str, SentimentScore] = {}
    rating = seed.get("rating")
    if rating:
        base = round(float(rating) * 2, 1)
        sentiment = {
            "overall_quality": SentimentScore(score=base, review_count=0),
        }

    fit_reasons = []
    for pro in (seed.get("pros") or [])[:3]:
        fit_reasons.append(FitReason(icon="check-circle", title=pro, description=pro))

    detail = ProductDetailResponse(
        id=product_id,
        name=seed.get("name", ""),
        description=seed.get("ai_reasoning", ""),
        images=[seed["image_url"]] if seed.get("image_url") else [],
        badges=badges,
        prices=[
            PriceEntry(
                marketplace=seed.get("marketplace", ""),
                price=price,
                price_formatted=seed.get("price_formatted", ""),
                url=seed.get("product_url", ""),
                is_lowest=True,
                note="Lowest Price",
            )
        ],
        why_this_fits=seed.get("ai_reasoning", ""),
        fit_reasons=fit_reasons,
        sentiment=sentiment,
        pros=seed.get("pros", []),
        cons=seed.get("cons", []),
        specifications={},
        sources=["Google Shopping", "Marketplace Reviews"],
    )
    return JSONResponse(content=detail.model_dump())

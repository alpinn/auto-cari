"""Product ranking & reasoning agent.

Takes normalized products + review text + the original query, asks the
reasoning-tier LLM to rank/score/explain them, then merges the AI output back
onto the normalized products to produce final ProductCard objects.
"""

import logging

from app.models.response import ProductCard, RankingResult
from app.services.llm_service import llm_service

logger = logging.getLogger("autocari.product")


class ProductAgent:
    async def rank(
        self, normalized: list[dict], review_text: str, query: str
    ) -> tuple[str, list[ProductCard]]:
        """Return (summary, ranked ProductCards) for the given inputs."""
        # Only the fields the LLM needs to reason — keep the prompt lean.
        llm_input = [
            {
                "index": i,
                "name": p["name"],
                "price": p["price"],
                "marketplace": p["marketplace"],
                "store_name": p.get("store_name"),
                "store_badge": p.get("store_badge"),
                "rating": p.get("rating"),
            }
            for i, p in enumerate(normalized)
        ]

        try:
            result: RankingResult = await llm_service.rank_and_reason(
                llm_input, review_text, query
            )
        except Exception as exc:
            logger.error("ranking failed, returning unranked cards: %s", exc)
            return _fallback(normalized, query)

        return self._merge(normalized, result)

    def _merge(
        self, normalized: list[dict], result: RankingResult
    ) -> tuple[str, list[ProductCard]]:
        by_index = {r.product_index: r for r in result.products}
        cards: list[ProductCard] = []
        editor_used = False

        # Preserve the LLM's ordering when present, else fall back to input order.
        order = [r.product_index for r in result.products] or list(range(len(normalized)))
        seen: set[int] = set()
        for idx in order:
            if idx in seen or idx < 0 or idx >= len(normalized):
                continue
            seen.add(idx)
            cards.append(self._to_card(normalized[idx], idx, by_index, editor_used))
            if cards[-1].is_editor_choice:
                editor_used = True

        summary = result.summary or "Berikut rekomendasi produk terbaik untuk Anda."
        return summary, cards

    @staticmethod
    def _to_card(p: dict, idx: int, by_index: dict, editor_used: bool) -> ProductCard:
        r = by_index.get(idx)
        is_editor = bool(r and r.is_editor_choice and not editor_used)
        return ProductCard(
            id=p["external_id"],
            name=p["name"],
            image_url=p.get("image_url"),
            price=p["price"],
            price_formatted=p["price_formatted"],
            marketplace=p["marketplace"],
            store_name=p.get("store_name"),
            store_badge=p.get("store_badge"),
            rating=p.get("rating"),
            score=round(float(r.score), 1) if r else 0.0,
            pros=r.pros if r else [],
            cons=r.cons if r else [],
            ai_reasoning=r.ai_reasoning if r else "",
            product_url=p["product_url"],
            is_editor_choice=is_editor,
        )


def _fallback(normalized: list[dict], query: str) -> tuple[str, list[ProductCard]]:
    cards = [
        ProductCard(
            id=p["external_id"],
            name=p["name"],
            image_url=p.get("image_url"),
            price=p["price"],
            price_formatted=p["price_formatted"],
            marketplace=p["marketplace"],
            store_name=p.get("store_name"),
            store_badge=p.get("store_badge"),
            rating=p.get("rating"),
            product_url=p["product_url"],
        )
        for p in normalized
    ]
    return "Berikut produk yang kami temukan untuk Anda.", cards


product_agent = ProductAgent()

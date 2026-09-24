"""Manual check for the candidate-generation step (no ranking, no Tavily).

    python -m scripts.try_candidates
    python -m scripts.try_candidates "monitor 4k buat desain budget 6 juta"

Prints LLM candidates -> real Serper listing picked (or DROPPED) per candidate.
"""

import asyncio
import sys

from app.services.llm_service import llm_service
from app.services.serper_service import serper_service
from app.utils.normalizer import extract_budget_max, normalize_serper_products, pick_candidate_listing

QUERIES = [
    "smartphone kamera terbaik budget 20 juta",
    "laptop buat coding dan editing video budget 15 juta",
    "monitor 4k buat desain grafis budget 6 juta",
]


async def run(query: str) -> None:
    budget = extract_budget_max(query)
    print(f"\n=== {query}  (budget={budget})")
    candidates = await llm_service.generate_candidates(query)
    raws = await asyncio.gather(
        *(serper_service.search_shopping(c, num=10) for c in candidates), return_exceptions=True
    )
    for cand, raw in zip(candidates, raws):
        if isinstance(raw, Exception):
            print(f"  ! {cand:32} serper error: {raw}")
            continue
        pick = pick_candidate_listing(cand, normalize_serper_products(raw, cap=10), budget)
        print(f"  {'✓' if pick else '✗'} {cand:32}", f"{pick['price_formatted']} | {pick['name'][:60]} ({pick['marketplace']})" if pick else "DROPPED")


async def main() -> None:
    for q in sys.argv[1:] or QUERIES:
        await run(q)
    await serper_service.close()
    await llm_service.close()


if __name__ == "__main__":
    asyncio.run(main())

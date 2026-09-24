"""Task 2: same fixture data + same RANK_SYSTEM prompt -> every configured model, side by side.

    python -m scripts.compare_models [scripts/fixtures/other.json]

No Serper/Tavily calls (data comes from scripts/fixtures/ranking_fixture.json). Only LLM calls, via the
real llm_service.rank_and_reason; models are switched by mutating `settings` the same way env config would.
If every model's output is equally generic, the bottleneck is the data (thin Tavily), not the model.
"""

import asyncio
import json
import shutil
import sys
import textwrap
from pathlib import Path

from app.config import settings
from app.services.llm_service import llm_service
from app.services.tavily_service import tavily_service

FIXTURE = Path(__file__).parent / "fixtures" / "ranking_fixture.json"


def _variants() -> list[tuple[str, str, str]]:
    """(label, provider, model) for every configured model that has an API key."""
    out = []
    if settings.GROQ_API_KEY:
        out += [(f"groq/{m}", "groq", m) for m in dict.fromkeys([settings.GROQ_REASONING_MODEL, settings.GROQ_CLASSIFIER_MODEL])]
    if settings.CLAUDE_API_KEY:
        out += [(f"claude/{m}", "claude", m) for m in dict.fromkeys([settings.CLAUDE_REASONING_MODEL, settings.CLAUDE_CLASSIFIER_MODEL])]
    return out


async def run_variant(provider: str, model: str, fx: dict, review_text: str):
    settings.LLM_PROVIDER = provider
    if provider == "groq":
        settings.GROQ_REASONING_MODEL = model
    else:
        settings.CLAUDE_REASONING_MODEL = model
    try:
        return await llm_service.rank_and_reason(fx["products"], review_text, fx["query"])
    except Exception as exc:  # one model failing shouldn't kill the comparison
        return exc


def _cell(res, idx: int, width: int) -> list[str]:
    if isinstance(res, Exception):
        return textwrap.wrap(f"ERROR: {res}", width)
    r = next((p for p in res.products if p.product_index == idx), None)
    if not r:
        return ["(tidak ada di output)"]
    text = f"score {r.score}{' ★' if r.is_editor_choice else ''}\n+ " + "\n+ ".join(r.pros) + "\n- " + "\n- ".join(r.cons) + f"\n» {r.ai_reasoning}"
    return [ln for para in text.split("\n") for ln in (textwrap.wrap(para, width) or [""])]


def print_side_by_side(fx: dict, labels: list[str], results: list) -> None:
    cols = len(labels)
    total = shutil.get_terminal_size((160, 20)).columns
    width = max(30, (total - 3 * (cols - 1)) // cols)
    for i, p in enumerate(fx["products"]):
        print("\n" + "=" * total)
        print(f"[{i}] {p['name'][:80]}  —  Rp {p['price']:,}".replace(",", "."))
        print("-" * total)
        cells = [[l[:width]] + ["·" * min(width, len(l))] + _cell(r, i, width) for l, r in zip(labels, results)]
        for row in range(max(map(len, cells))):
            print(" | ".join((c[row] if row < len(c) else "").ljust(width) for c in cells))
    print("\n" + "=" * total + "\nSUMMARY")
    for l, r in zip(labels, results):
        print(f"- {l}: {r if isinstance(r, Exception) else r.summary}")


async def main() -> None:
    fx = json.loads(Path(sys.argv[1] if len(sys.argv) > 1 else FIXTURE).read_text())
    review_text = tavily_service.to_prompt_text(fx["reviews"])
    print(f"Query: {fx['query']}\nProducts: {len(fx['products'])} | Tavily: {len(fx['reviews'])} artikel, "
          f"{sum(len(r['content']) for r in fx['reviews'])} chars total (makin tipis = makin generic reasoning)")
    variants = _variants()
    if not variants:
        raise SystemExit("Tidak ada API key (GROQ_API_KEY / CLAUDE_API_KEY) di .env")
    # ponytail: sequential, not gather — run_variant mutates global settings, so concurrent runs would race
    results = [await run_variant(p, m, fx, review_text) for _, p, m in variants]
    print_side_by_side(fx, [l for l, _, _ in variants], results)
    await llm_service.close()


if __name__ == "__main__":
    asyncio.run(main())

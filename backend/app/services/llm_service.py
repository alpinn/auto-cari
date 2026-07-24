"""LLM abstraction that switches between Groq (free) and Claude (prod).

Selected via the LLM_PROVIDER env var. Groq is OpenAI-compatible, so we use
`openai` async client with base_url override; Claude uses `anthropic` async client.
Every call requests strict JSON and is parsed defensively (one reparse retry, then hard
failure that the route turns into a graceful error).

Two model tiers:
- classifier  -> mixtral-8x7b-32768 / claude-haiku-4-5  (intent, optimize, clarify)
- reasoning   -> mixtral-8x7b-32768 / claude-sonnet-4    (ranking & reasoning)
"""

import asyncio
import json
import logging
import re

from app.config import settings
from app.models.response import IntentResult, RankingResult
from app.utils.http import with_retry

logger = logging.getLogger("autocari.llm")

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


class LLMError(Exception):
    """Raised when the LLM fails to produce usable output."""


# --------------------------------------------------------------------------- #
# Prompts
# --------------------------------------------------------------------------- #

INTENT_SYSTEM = """Kamu adalah intent classifier untuk platform rekomendasi PRODUK Indonesia (Autocari).
Autocari HANYA membantu mencari & merekomendasikan produk untuk dibeli — bukan asisten umum.

Klasifikasikan query berikut ke salah satu kategori:
- "electronics": produk elektronik, gadget, HP, laptop, monitor, earphone,
  keyboard, mouse, kamera, TV, AC, kulkas, mesin cuci, dll
- "coming_soon": saham, investasi, crypto, obat, suplemen, travel, hotel,
  tiket, kursus, buku, fashion, baju, sepatu, makanan, dll — kategori PRODUK
  yang belum kami dukung, tapi user tetap jelas mencari sebuah produk untuk dibeli
- "ambiguous": query terlalu vague, hanya 1-2 kata tanpa konteks,
  tapi user JELAS sedang mencari sebuah produk untuk dibeli
- "off_topic": query BUKAN pencarian produk sama sekali — pertanyaan pengetahuan umum,
  cara membuat/memasak sesuatu, minta terjemahan, pertanyaan faktual, coding/tugas,
  obrolan santai, atau apa pun yang tidak berkaitan dengan mencari produk untuk dibeli.
  Contoh: "cara buat nasi goreng", "apa itu machine learning", "siapa presiden indonesia",
  "tolong terjemahkan hello". Kalau ragu antara "ambiguous" dan "off_topic", tanyakan:
  apakah user sedang mencari PRODUK untuk dibeli? Kalau tidak, pilih "off_topic".

Respond ONLY in this exact JSON format, no preamble:
{
  "category": "electronics|coming_soon|ambiguous|off_topic",
  "confidence": 0.95,
  "detected_intent": "mencari laptop untuk coding",
  "needs_clarification": false,
  "clarification_reason": null
}"""

OPTIMIZE_SYSTEM = """Kamu mengoptimalkan query pencarian produk agar hasil Google Shopping lebih relevan.
Reformulasikan query user menjadi keyword pencarian produk yang singkat dan efektif.

PENTING: Google Shopping mencocokkan berdasarkan judul listing produk, bukan kalimat natural language.
- JANGAN sertakan angka budget/harga atau kata seperti "budget", "di bawah", "dibawah", "juta", "IDR".
  Budget tetap dipakai di tahap ranking selanjutnya, jadi aman dihilangkan di sini.
  Contoh: "hp buat edit video dibawah 10 juta" -> "handphone untuk edit video" (BUKAN "hp edit video di bawah 10 juta")
- Fokus ke jenis produk + kata kunci kebutuhan/spesifikasi (mis. "kamera bagus", "RAM besar", "gaming").
- Kata "hp" sering berarti ponsel/handphone, TAPI Google Shopping bisa salah mengartikannya sebagai
  merek laptop "HP" (Hewlett-Packard). Kalau user jelas maksudnya ponsel, ganti "hp" dengan "handphone",
  JANGAN dibiarkan sebagai "hp" saja.
- Boleh Bahasa Indonesia atau Inggris, mana yang lebih umum dipakai di judul listing produk.

Respond ONLY in this exact JSON format:
{ "optimized_query": "..." }"""

CLARIFY_SYSTEM = """User sedang mencari produk tapi querynya terlalu vague.
Generate 1 clarifying question dalam Bahasa Indonesia yang akan
membantu mempersempit pilihan produk.

Sertakan 2 opsi jawaban yang konkrit dan actionable.

Respond ONLY in this exact JSON format:
{
  "context": "ringkasan singkat konteks pencarian user",
  "question": "pertanyaan klarifikasi",
  "options": [
    { "id": "option_1", "label": "Label Singkat", "description": "Deskripsi 1 kalimat", "icon": "nama_icon" },
    { "id": "option_2", "label": "Label Singkat", "description": "Deskripsi 1 kalimat", "icon": "nama_icon" }
  ]
}"""

RANK_SYSTEM = """Kamu adalah AI advisor produk untuk pasar Indonesia bernama Autocari.
Tugasmu meranking dan menganalisis produk berdasarkan kebutuhan user.

Kriteria penilaian:
1. Relevansi dengan kebutuhan user (40%)
2. Value for money — harga vs kualitas (30%)
3. Reputasi toko dan rating produk (20%)
4. Insight dari review/artikel trusted (10%)

Rules:
- Maksimal 1 produk is_editor_choice = true (yang terbaik overall)
- Score antara 0.0 - 10.0
- pros: 2-3 poin singkat dalam Bahasa Indonesia
- cons: 1-2 poin singkat dalam Bahasa Indonesia
- ai_reasoning: 1-2 kalimat dalam Bahasa Indonesia, spesifik ke konteks user
- summary: 1 kalimat dalam Bahasa Indonesia

Respond ONLY in this exact JSON format, no preamble, no markdown:
{
  "summary": "ringkasan 1 kalimat",
  "products": [
    {
      "product_index": 0,
      "score": 8.5,
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1"],
      "ai_reasoning": "reasoning spesifik",
      "is_editor_choice": false
    }
  ]
}"""


def _extract_json(text: str) -> dict:
    """Best-effort JSON extraction from a model response."""
    if not text:
        raise LLMError("empty LLM response")
    cleaned = _JSON_FENCE_RE.sub("", text).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fall back to the first balanced {...} block.
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


class LLMService:
    def __init__(self) -> None:
        self._groq = None
        self._anthropic = None

    # ----- lazy clients -----
    def _get_groq(self):
        if self._groq is None:
            from openai import AsyncOpenAI

            self._groq = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url=settings.GROQ_BASE_URL,
            )
        return self._groq

    def _get_claude(self):
        if self._anthropic is None:
            from anthropic import AsyncAnthropic

            self._anthropic = AsyncAnthropic(api_key=settings.CLAUDE_API_KEY)
        return self._anthropic

    @property
    def configured(self) -> bool:
        if settings.is_groq:
            return bool(settings.GROQ_API_KEY)
        return bool(settings.CLAUDE_API_KEY)

    # ----- core completion -----
    async def _complete(self, system: str, user: str, *, tier: str) -> str:
        """Return raw text completion for a (system, user) pair on the given tier."""
        if settings.is_groq:
            model = (
                settings.GROQ_CLASSIFIER_MODEL
                if tier == "classifier"
                else settings.GROQ_REASONING_MODEL
            )

            async def _call() -> str:
                resp = await self._get_groq().chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    temperature=0.3,
                    timeout=settings.HTTP_TIMEOUT_SECONDS * 2,
                )
                return resp.choices[0].message.content or ""

        else:
            model = (
                settings.CLAUDE_CLASSIFIER_MODEL
                if tier == "classifier"
                else settings.CLAUDE_REASONING_MODEL
            )

            async def _call() -> str:
                resp = await self._get_claude().messages.create(
                    model=model,
                    max_tokens=2048,
                    system=system,
                    messages=[{"role": "user", "content": user}],
                    temperature=0.3,
                    timeout=settings.HTTP_TIMEOUT_SECONDS * 2,
                )
                return "".join(
                    block.text for block in resp.content if getattr(block, "type", "") == "text"
                )

        return await with_retry(_call, service="llm", max_attempts=2, base_delay=0.5)

    async def _complete_json(self, system: str, user: str, *, tier: str) -> dict:
        """Complete and parse JSON, with one reparse retry."""
        raw = await self._complete(system, user, tier=tier)
        try:
            return _extract_json(raw)
        except (json.JSONDecodeError, LLMError):
            logger.warning("LLM JSON parse failed, retrying once")
            raw = await self._complete(system, user, tier=tier)
            try:
                return _extract_json(raw)
            except (json.JSONDecodeError, LLMError) as exc:
                raise LLMError(f"could not parse LLM JSON: {exc}") from exc

    # ----- high-level operations -----
    async def classify_intent(self, query: str) -> IntentResult:
        data = await self._complete_json(INTENT_SYSTEM, f"Query: {query}", tier="classifier")
        return IntentResult(
            category=data.get("category", "ambiguous"),
            confidence=float(data.get("confidence", 0.0) or 0.0),
            detected_intent=data.get("detected_intent", "") or "",
            needs_clarification=bool(data.get("needs_clarification", False)),
            clarification_reason=data.get("clarification_reason"),
        )

    async def optimize_query(self, query: str) -> str:
        try:
            # "reasoning" tier (not "classifier"): the bigger model reliably handles
            # Indonesian slang/abbreviations (e.g. "casan" -> "charger", not dropped
            # or misread as a phone search) where the small classifier model doesn't.
            # ~+80ms measured — negligible next to the multi-second full pipeline.
            data = await self._complete_json(
                OPTIMIZE_SYSTEM, f"Query: {query}", tier="reasoning"
            )
            return (data.get("optimized_query") or query).strip() or query
        except Exception as exc:  # optimization is best-effort
            logger.warning("query optimization failed, using raw query: %s", exc)
            return query

    async def generate_clarifying(self, query: str) -> dict:
        return await self._complete_json(
            CLARIFY_SYSTEM, f"Query vague: {query}", tier="classifier"
        )

    async def rank_and_reason(self, products: list[dict], reviews: str, query: str) -> RankingResult:
        user = (
            f"Data produk (index 0 sampai {len(products) - 1}):\n"
            f"{json.dumps(products, ensure_ascii=False)}\n\n"
            f"Review & artikel terkait:\n{reviews}\n\n"
            f"Query user: {query}"
        )
        data = await self._complete_json(RANK_SYSTEM, user, tier="reasoning")
        return RankingResult.model_validate(data)

    async def close(self) -> None:
        # Async clients are cheap to drop; close underlying http if present.
        for client in (self._groq, self._anthropic):
            close = getattr(getattr(client, "_client", None), "aclose", None)
            if close:
                try:
                    await close()
                except Exception:
                    pass


llm_service = LLMService()

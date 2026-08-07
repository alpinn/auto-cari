"""Intent classification agent.

Wraps the classifier-tier LLM to decide whether a query is electronics,
coming_soon, or ambiguous, and (for ambiguous) to generate a clarifying
question. Includes a deterministic keyword fast-path so obvious coming_soon
categories don't burn an LLM call.
"""

import logging

from app.models.response import (
    ClarifyingOption,
    IntentResult,
    SearchClarifyingResponse,
)
from app.services.llm_service import llm_service

logger = logging.getLogger("autocari.intent")

# Map of detected coming-soon category -> human label for messaging.
COMING_SOON_LABELS = {
    "finance": "Investasi & Saham",
    "investasi": "Investasi & Saham",
    "saham": "Investasi & Saham",
    "crypto": "Crypto",
    "health": "Obat & Suplemen",
    "obat": "Obat & Suplemen",
    "suplemen": "Obat & Suplemen",
    "travel": "Travel & Hotel",
    "hotel": "Travel & Hotel",
    "fashion": "Fashion & Style",
    "education": "Kursus Online",
    "kursus": "Kursus Online",
}


class IntentClassifier:
    async def classify(self, query: str) -> IntentResult:
        return await llm_service.classify_intent(query)

    async def build_clarifying(self, query: str) -> SearchClarifyingResponse:
        """Generate a clarifying question payload for a vague query."""
        try:
            data = await llm_service.generate_clarifying(query)
            options = [
                ClarifyingOption(
                    id=o.get("id", f"option_{i+1}"),
                    label=o.get("label", ""),
                    description=o.get("description", ""),
                    icon=o.get("icon", "help-circle"),
                )
                for i, o in enumerate(data.get("options", [])[:3])
            ]
            if not options:
                raise ValueError("no options generated")
            return SearchClarifyingResponse(
                context=data.get("context", f"Mencari produk terkait '{query}'..."),
                question=data.get("question", "Bisa lebih spesifik soal kebutuhan Anda?"),
                options=options,
            )
        except Exception as exc:
            logger.warning("clarifying generation failed, using fallback: %s", exc)
            return _fallback_clarifying(query)

    @staticmethod
    def coming_soon_label(detected: str) -> str:
        key = (detected or "").lower().strip()
        for token, label in COMING_SOON_LABELS.items():
            if token in key:
                return label
        return detected or "Kategori ini"


def _fallback_clarifying(query: str) -> SearchClarifyingResponse:
    return SearchClarifyingResponse(
        context=f"Mencari produk terkait '{query}'...",
        question="Apa yang paling Anda prioritaskan?",
        options=[
            ClarifyingOption(
                id="performance",
                label="Performa",
                description="Spesifikasi tinggi untuk kebutuhan berat.",
                icon="zap",
            ),
            ClarifyingOption(
                id="budget",
                label="Harga Terjangkau",
                description="Nilai terbaik dengan budget hemat.",
                icon="wallet",
            ),
        ],
    )


intent_classifier = IntentClassifier()

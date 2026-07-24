"""Review/article search via Tavily.

Prioritizes Tier-1 Indonesian/global tech sources (tech blogs + YouTube) so the
ranking agent gets trustworthy editorial context, not marketplace fluff.
"""

import logging

import httpx

from app.config import settings
from app.utils.http import ExternalServiceError, with_retry

logger = logging.getLogger("autocari.tavily")

# Tier-1 review sources we prefer to surface for electronics.
TIER1_DOMAINS = [
    "jagatreview.com",
    "gadgetin.com",
    "youtube.com",
    "kompas.com",
    "gsmarena.com",
    "rtings.com",
    "notebookcheck.net",
    "theverge.com",
]


class TavilyService:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    @property
    def configured(self) -> bool:
        return bool(settings.TAVILY_API_KEY)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=settings.TAVILY_BASE_URL,
                timeout=settings.HTTP_TIMEOUT_SECONDS,
            )
        return self._client

    async def search_reviews(self, query: str, max_results: int = 3) -> list[dict]:
        """Return a list of {title, url, content} review snippets."""
        if not self.configured:
            raise ExternalServiceError("tavily", "TAVILY_API_KEY not set")

        async def _call() -> list[dict]:
            client = await self._get_client()
            resp = await client.post(
                "/search",
                json={
                    "api_key": settings.TAVILY_API_KEY,
                    "query": f"{query} review",
                    "search_depth": "basic",
                    "max_results": max_results,
                    "include_domains": TIER1_DOMAINS,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": (r.get("content") or "")[:1000],
                }
                for r in data.get("results", []) or []
            ]

        return await with_retry(
            _call, service="tavily", max_attempts=settings.HTTP_MAX_ATTEMPTS
        )

    @staticmethod
    def to_prompt_text(reviews: list[dict]) -> str:
        if not reviews:
            return "(Tidak ada artikel review tersedia.)"
        parts = []
        for i, r in enumerate(reviews, 1):
            parts.append(f"[{i}] {r['title']} ({r['url']})\n{r['content']}")
        return "\n\n".join(parts)

    @staticmethod
    def source_names(reviews: list[dict]) -> list[str]:
        names: list[str] = []
        for r in reviews:
            host = r.get("url", "").split("/")[2] if "://" in r.get("url", "") else ""
            if host and host not in names:
                names.append(host)
        return names

    async def health(self) -> bool:
        return self.configured

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None


tavily_service = TavilyService()

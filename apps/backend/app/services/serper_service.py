"""Google Shopping product search via Serper.dev."""

import logging

import httpx

from app.config import settings
from app.utils.http import ExternalServiceError, with_retry

logger = logging.getLogger("autocari.serper")


class SerperService:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    @property
    def configured(self) -> bool:
        return bool(settings.SERPER_API_KEY)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=settings.SERPER_BASE_URL,
                headers={
                    "X-API-KEY": settings.SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout=settings.HTTP_TIMEOUT_SECONDS,
            )
        return self._client

    async def search_shopping(self, query: str, num: int = 10) -> list[dict]:
        """Return raw Google Shopping items for `query` (Indonesia locale)."""
        if not self.configured:
            raise ExternalServiceError("serper", "SERPER_API_KEY not set")

        async def _call() -> list[dict]:
            client = await self._get_client()
            resp = await client.post(
                "/shopping",
                json={"q": query, "gl": "id", "hl": "id", "num": num},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("shopping", []) or []

        return await with_retry(
            _call, service="serper", max_attempts=settings.HTTP_MAX_ATTEMPTS
        )

    async def health(self) -> bool:
        return self.configured

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None


serper_service = SerperService()

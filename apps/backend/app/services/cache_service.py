"""Upstash Redis access over its REST API using httpx.

We talk to the Upstash REST endpoint directly (POST a JSON command array) so
the whole thing stays async and dependency-light. If Upstash isn't configured
the service degrades to a no-op (cache misses) rather than crashing — handy for
local dev without Redis credentials.
"""

import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger("autocari.cache")


class CacheService:
    def __init__(self) -> None:
        self._url = settings.UPSTASH_REDIS_URL.rstrip("/") if settings.UPSTASH_REDIS_URL else ""
        self._token = settings.UPSTASH_REDIS_TOKEN
        self._client: httpx.AsyncClient | None = None

    @property
    def enabled(self) -> bool:
        return bool(self._url and self._token)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._url,
                headers={"Authorization": f"Bearer {self._token}"},
                timeout=5.0,
            )
        return self._client

    async def _command(self, *args: Any) -> Any:
        if not self.enabled:
            return None
        client = await self._get_client()
        resp = await client.post("/", json=[str(a) for a in args])
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"Redis error: {data['error']}")
        return data.get("result")

    # ----- generic ops -----
    async def get(self, key: str) -> str | None:
        return await self._command("GET", key)

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        if ttl:
            await self._command("SET", key, value, "EX", ttl)
        else:
            await self._command("SET", key, value)

    async def incr(self, key: str) -> int:
        result = await self._command("INCR", key)
        return int(result or 0)

    async def expire(self, key: str, ttl: int) -> None:
        await self._command("EXPIRE", key, ttl)

    async def zadd(self, key: str, member: str, score: float = 1.0) -> None:
        await self._command("ZADD", key, score, member)

    async def ping(self) -> bool:
        try:
            result = await self._command("PING")
            return result == "PONG" or result is None
        except Exception:
            return False

    # ----- JSON helpers -----
    async def get_json(self, key: str) -> Any | None:
        raw = await self.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return None

    async def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        await self.set(key, json.dumps(value, ensure_ascii=False), ttl=ttl)

    async def record_trending(self, query: str, day: str) -> None:
        """Best-effort increment of a query in the daily trending sorted set."""
        try:
            await self._command("ZINCRBY", f"trending:queries:{day}", 1, query)
            await self._command("EXPIRE", f"trending:queries:{day}", settings.TRENDING_TTL)
        except Exception as exc:  # never block on trending writes
            logger.debug("trending write failed: %s", exc)

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None


cache_service = CacheService()

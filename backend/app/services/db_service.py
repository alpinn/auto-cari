"""Neon Postgres access via an asyncpg connection pool.

All writes are non-critical analytics — if DATABASE_URL is unset or the DB is
down, the service degrades to no-ops so the search pipeline never blocks on it.
Query logging is fired via asyncio.create_task() by callers (non-blocking).
"""

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger("autocari.db")


class DBService:
    def __init__(self) -> None:
        self._pool: Any | None = None

    @property
    def enabled(self) -> bool:
        return bool(settings.DATABASE_URL)

    async def connect(self) -> None:
        if not self.enabled or self._pool is not None:
            return
        try:
            import asyncpg

            self._pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=1,
                max_size=5,
                command_timeout=10,
            )
            logger.info("Postgres pool initialized")
        except Exception as exc:
            logger.error("Postgres pool init failed (continuing degraded): %s", exc)
            self._pool = None

    async def health(self) -> bool:
        if not self._pool:
            return False
        try:
            async with self._pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            return True
        except Exception:
            return False

    async def log_query(
        self,
        *,
        raw_query: str,
        category: str | None,
        is_cached: bool,
        response_time: int | None,
        result_count: int | None,
        session_id: str | None = None,
    ) -> str | None:
        """Insert an analytics row; returns the new query id (or None if degraded)."""
        if not self._pool:
            return None
        try:
            async with self._pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    INSERT INTO queries
                        (session_id, raw_query, category, is_cached, response_time, result_count)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                    """,
                    _as_uuid(session_id),
                    raw_query,
                    category,
                    is_cached,
                    response_time,
                    result_count,
                )
                return str(row["id"]) if row else None
        except Exception as exc:
            logger.warning("log_query failed: %s", exc)
            return None

    async def add_to_waitlist(self, email: str, category: str) -> bool:
        if not self._pool:
            return False
        try:
            async with self._pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO waitlist (email, category)
                    VALUES ($1, $2)
                    ON CONFLICT (email, category) DO NOTHING
                    """,
                    email,
                    category,
                )
            return True
        except Exception as exc:
            logger.warning("add_to_waitlist failed: %s", exc)
            return False

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None


def _as_uuid(value: str | None):
    """asyncpg wants a UUID/None for uuid columns; pass through valid strings."""
    if not value:
        return None
    try:
        import uuid

        return uuid.UUID(value)
    except (ValueError, TypeError):
        return None


db_service = DBService()

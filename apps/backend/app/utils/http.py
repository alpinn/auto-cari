"""Shared async retry helper with exponential backoff for external calls.

Schedule: attempt 1 immediate, attempt 2 after 1s, attempt 3 after 2s.
Each attempt is bounded by the caller's own timeout. Raises the last error.
"""

import asyncio
import logging
from typing import Awaitable, Callable, TypeVar

logger = logging.getLogger("autocari.http")

T = TypeVar("T")


class ExternalServiceError(Exception):
    """Raised when an external service fails after all retries."""

    def __init__(self, service: str, message: str = "") -> None:
        self.service = service
        super().__init__(f"{service} unavailable: {message}")


async def with_retry(
    func: Callable[[], Awaitable[T]],
    *,
    service: str,
    max_attempts: int = 3,
    base_delay: float = 1.0,
) -> T:
    last_exc: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            return await func()
        except Exception as exc:  # noqa: BLE001 - retry on any transient failure
            last_exc = exc
            logger.warning("%s attempt %d/%d failed: %s", service, attempt, max_attempts, exc)
            if attempt < max_attempts:
                await asyncio.sleep(base_delay * (2 ** (attempt - 1)))
    raise ExternalServiceError(service, str(last_exc) if last_exc else "")

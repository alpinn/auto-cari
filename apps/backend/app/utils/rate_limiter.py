"""Per-IP daily rate limiting backed by Redis (primary).

Key: ratelimit:{ip}:{YYYY-MM-DD}, TTL 86400s (resets daily). Fails open if
Redis is unavailable so a cache outage never blocks all traffic.
"""

from datetime import datetime, timezone
from dataclasses import dataclass

from app.config import settings
from app.services.cache_service import cache_service


@dataclass
class RateLimitResult:
    allowed: bool
    remaining: int
    limit: int


async def check_rate_limit(ip: str) -> RateLimitResult:
    limit = settings.MAX_QUERIES_PER_DAY
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"ratelimit:{ip}:{today}"

    try:
        count = await cache_service.incr(key)
        if count == 1:
            await cache_service.expire(key, 86400)
    except Exception:
        # Fail open — never deny legitimate users due to cache failure.
        return RateLimitResult(allowed=True, remaining=limit, limit=limit)

    if count > limit:
        return RateLimitResult(allowed=False, remaining=0, limit=limit)

    return RateLimitResult(allowed=True, remaining=max(0, limit - count), limit=limit)

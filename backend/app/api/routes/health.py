"""GET /health — liveness + dependency status."""

import asyncio

from fastapi import APIRouter

from app.config import settings
from app.models.response import HealthResponse
from app.services.cache_service import cache_service
from app.services.db_service import db_service
from app.services.serper_service import serper_service
from app.services.tavily_service import tavily_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health() -> HealthResponse:
    redis_ok, db_ok, serper_ok, tavily_ok = await asyncio.gather(
        cache_service.ping(),
        db_service.health(),
        serper_service.health(),
        tavily_service.health(),
    )

    services = {
        "redis": _status(redis_ok, cache_service.enabled),
        "database": _status(db_ok, db_service.enabled),
        "serper": _status(serper_ok, serper_service.configured),
        "tavily": _status(tavily_ok, tavily_service.configured),
    }
    overall = "ok" if all(v != "error" for v in services.values()) else "degraded"

    return HealthResponse(
        status=overall,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        services=services,
    )


def _status(ok: bool, configured: bool) -> str:
    if not configured:
        return "not_configured"
    return "ok" if ok else "error"

"""Autocari Backend — FastAPI application entry point.

Wires CORS, a request-id middleware for tracing, global exception handlers that
never leak internals to clients, a lifespan that warms/closes shared clients,
and mounts the API routers under /api (plus /health at the root).
"""

import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import categories, health, products, search
from app.config import settings
from app.services.cache_service import cache_service
from app.services.db_service import db_service
from app.services.llm_service import llm_service
from app.services.serper_service import serper_service
from app.services.tavily_service import tavily_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("autocari")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Autocari API (env=%s, llm=%s)", settings.APP_ENV, settings.LLM_PROVIDER)
    await db_service.connect()
    yield
    await db_service.close()
    await cache_service.close()
    await serper_service.close()
    await tavily_service.close()
    await llm_service.close()
    logger.info("Autocari API shut down cleanly")


app = FastAPI(
    title="Autocari API",
    description="AI-powered product recommendation platform for Indonesia (Phase 1).",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    try:
        response = await call_next(request)
    except Exception:  # noqa: BLE001 - converted to a safe 500 below
        logger.exception("Unhandled error [request_id=%s]", request_id)
        return JSONResponse(
            status_code=500,
            content={
                "type": "error",
                "code": "INTERNAL_ERROR",
                "message": "Terjadi kesalahan internal. Silakan coba lagi nanti.",
            },
            headers={"x-request-id": request_id},
        )
    response.headers["x-request-id"] = request_id
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    rid = getattr(request.state, "request_id", "unknown")
    logger.exception("Exception handler [request_id=%s]: %s", rid, exc)
    return JSONResponse(
        status_code=500,
        content={
            "type": "error",
            "code": "INTERNAL_ERROR",
            "message": "Terjadi kesalahan internal. Silakan coba lagi nanti.",
        },
    )


# Routers
app.include_router(health.router, tags=["health"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(categories.router, prefix="/api", tags=["categories"])


@app.get("/", include_in_schema=False)
async def root():
    return {"name": "Autocari API", "version": settings.APP_VERSION, "docs": "/docs"}

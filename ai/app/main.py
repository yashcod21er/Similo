"""FastAPI application factory.

Run locally (from ai/):  uv run uvicorn app.main:app --reload --port 8000

This is an *internal* service: only the Node.js API and workers call it, never the
browser. Interactive docs (/docs) are disabled in production so the internal API
surface is not advertised. Service-to-service authentication is added together with
the first /internal/ai/* endpoint: every /internal/* route needs the bearer token
(AI_SERVICE_TOKEN), and production refuses to start without a strong one.
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool

from app import __version__
from app.analysis.models_loader import ModelRegistry, get_registry
from app.api.analyse import router as analyse_router
from app.api.health import router as health_router
from app.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    shared = settings is None
    settings = settings or get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    # The default settings share the process-wide model registry with in-process callers
    # (the evaluation runner); explicit settings (tests) get their own.
    registry = get_registry() if shared else ModelRegistry(settings)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        if settings.preload_models:
            await run_in_threadpool(registry.preload)
        yield

    app = FastAPI(
        title="Similo AI service",
        version=__version__,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.registry = registry
    app.include_router(health_router)
    app.include_router(analyse_router)
    return app


app = create_app()

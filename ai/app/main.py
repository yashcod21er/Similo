"""FastAPI application factory.

Run locally (from ai/):  uv run uvicorn app.main:app --reload --port 8000

This is an *internal* service: only the Node.js API and workers call it, never the
browser. Interactive docs (/docs) are disabled in production so the internal API
surface is not advertised. Service-to-service authentication is added together with
the first /internal/ai/* endpoint (Phase 5).
"""

import logging

from fastapi import FastAPI

from app import __version__
from app.api.health import router as health_router
from app.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    app = FastAPI(
        title="Similo AI service",
        version=__version__,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
    )
    app.include_router(health_router)
    return app


app = create_app()

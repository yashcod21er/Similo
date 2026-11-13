"""POST /internal/ai/analyse and GET /internal/ai/ready (both need the service token)."""

import logging
from functools import partial
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ValidationError

from app.analysis.models import AnalyseRequest, AnalyseResponse
from app.analysis.models_loader import ModelRegistry
from app.analysis.service import analyse
from app.config import Settings
from app.security import require_service_token

logger = logging.getLogger("similo.ai.api")

router = APIRouter(
    prefix="/internal/ai", tags=["analysis"], dependencies=[Depends(require_service_token)]
)


class ReadyResponse(BaseModel):
    status: str
    models: dict[str, bool]


def _too_large(limit: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
        detail=f"The request is larger than the {limit // (1024 * 1024)} MB limit.",
    )


async def _read_body(request: Request, limit: int) -> bytes:
    """Read the body, refusing as soon as it is known to exceed ``limit`` (before parsing)."""
    declared = request.headers.get("content-length")
    if declared is not None:
        try:
            if int(declared) > limit:
                raise _too_large(limit)
        except ValueError as error:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid Content-Length.") from error
    chunks: list[bytes] = []
    received = 0
    async for chunk in request.stream():
        received += len(chunk)
        if received > limit:
            raise _too_large(limit)
        chunks.append(chunk)
    return b"".join(chunks)


def _safe_errors(error: ValidationError) -> list[dict[str, Any]]:
    """Validation problems without the submitted values (they may be page text or images)."""
    return [
        {"loc": list(item["loc"]), "msg": item["msg"], "type": item["type"]}
        for item in error.errors(include_input=False, include_url=False, include_context=False)
    ]


@router.post("/analyse", response_model=AnalyseResponse, response_model_by_alias=True)
async def analyse_endpoint(request: Request) -> AnalyseResponse:
    settings: Settings = request.app.state.settings
    body = await _read_body(request, settings.max_request_bytes)
    try:
        parsed = await run_in_threadpool(AnalyseRequest.model_validate_json, body)
    except ValidationError as error:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail=_safe_errors(error)
        ) from None
    try:
        return await run_in_threadpool(
            partial(analyse, parsed, registry=request.app.state.registry)
        )
    except Exception as error:  # noqa: BLE001 - never leak details; log only the type
        logger.error("Analysis failed (%s)", type(error).__name__)
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, detail="The analysis failed."
        ) from None


@router.get("/ready", response_model=ReadyResponse)
def ready(request: Request) -> ReadyResponse:
    """Which models are loaded right now (they load on first use unless preloaded)."""
    registry: ModelRegistry = request.app.state.registry
    return ReadyResponse(status="ok", models=registry.status())

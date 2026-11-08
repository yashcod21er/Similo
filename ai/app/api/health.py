"""Liveness endpoint used by the Node.js API's dependency check and by deployments."""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__

SERVICE_NAME = "similo-ai-service"

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=SERVICE_NAME, version=__version__)

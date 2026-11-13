"""Service-to-service authentication for the internal endpoints.

The Node.js API sends ``Authorization: Bearer <AI_SERVICE_TOKEN>``. The check is constant
time (``hmac.compare_digest``). With no token configured the service refuses every
``/internal/*`` call with 503 instead of leaving it open. The token is never logged.
"""

import hmac

from fastapi import HTTPException, Request, status

from app.config import Settings


def require_service_token(request: Request) -> None:
    """FastAPI dependency: allow the request only with the right bearer token."""
    settings: Settings = request.app.state.settings
    expected = settings.token_value
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service has no service token configured (set AI_SERVICE_TOKEN).",
        )
    scheme, _, supplied = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not supplied.strip():
        raise _unauthorised()
    if not hmac.compare_digest(supplied.strip().encode(), expected.encode()):
        raise _unauthorised()


def _unauthorised() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid service token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

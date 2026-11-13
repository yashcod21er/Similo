from fastapi.testclient import TestClient

from app import __version__
from app.config import Settings
from app.main import create_app

PRODUCTION = {"environment": "production", "service_token": "p" * 40}


def test_health_returns_ok_with_service_identity() -> None:
    client = TestClient(create_app(Settings(_env_file=None, environment="test")))

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "similo-ai-service",
        "version": __version__,
    }


def test_docs_are_available_outside_production() -> None:
    client = TestClient(create_app(Settings(_env_file=None, environment="development")))
    assert client.get("/openapi.json").status_code == 200


def test_docs_are_hidden_in_production() -> None:
    client = TestClient(create_app(Settings(_env_file=None, **PRODUCTION)))
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_unknown_route_returns_404() -> None:
    client = TestClient(create_app(Settings(_env_file=None, environment="test")))
    assert client.get("/internal/ai/does-not-exist").status_code == 404

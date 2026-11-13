"""The /internal/* endpoints are only for the backend: bearer token, constant-time compare."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.helpers import TOKEN, FakeRegistry, build_request, make_settings

PROTECTED = [("POST", "/internal/ai/analyse"), ("GET", "/internal/ai/ready")]


def _client(**settings: object) -> TestClient:
    app = create_app(make_settings(**settings))
    app.state.registry = FakeRegistry()
    return TestClient(app)


@pytest.mark.parametrize(("method", "path"), PROTECTED)
def test_missing_token_is_401(method: str, path: str) -> None:
    response = _client().request(method, path, json=build_request())
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize(("method", "path"), PROTECTED)
def test_wrong_token_is_401(method: str, path: str) -> None:
    response = _client().request(
        method, path, json=build_request(), headers={"Authorization": "Bearer " + "x" * 40}
    )
    assert response.status_code == 401


@pytest.mark.parametrize(
    "header", ["Basic " + TOKEN, TOKEN, "Bearer", "Bearer ", f"Token {TOKEN}", f"Bearer {TOKEN}x"]
)
def test_malformed_or_near_miss_headers_are_401(header: str) -> None:
    response = _client().get("/internal/ai/ready", headers={"Authorization": header})
    assert response.status_code == 401


def test_non_ascii_token_does_not_crash() -> None:
    headers = {"Authorization": "Bearer pässwörd".encode()}
    response = _client().get("/internal/ai/ready", headers=headers)
    assert response.status_code == 401


def test_right_token_is_accepted(auth: dict[str, str]) -> None:
    response = _client().get("/internal/ai/ready", headers=auth)
    assert response.status_code == 200


def test_scheme_is_case_insensitive(auth: dict[str, str]) -> None:
    response = _client().get("/internal/ai/ready", headers={"Authorization": f"bearer {TOKEN}"})
    assert response.status_code == 200


@pytest.mark.parametrize(("method", "path"), PROTECTED)
def test_no_token_configured_is_503_even_with_a_header(method: str, path: str) -> None:
    client = _client(service_token=None)
    for headers in ({}, {"Authorization": f"Bearer {TOKEN}"}):
        response = client.request(method, path, json=build_request(), headers=headers)
        assert response.status_code == 503
        assert "AI_SERVICE_TOKEN" in response.json()["detail"]


def test_health_stays_public() -> None:
    assert _client().get("/health").status_code == 200
    assert _client(service_token=None).get("/health").status_code == 200


def test_token_never_appears_in_error_bodies() -> None:
    response = _client().get("/internal/ai/ready", headers={"Authorization": f"Bearer {TOKEN}x"})
    assert TOKEN not in response.text

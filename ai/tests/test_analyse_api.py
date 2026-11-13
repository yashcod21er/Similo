"""HTTP behaviour of POST /internal/ai/analyse (size guard, validation, shape of the answer)."""

import json
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from tests.helpers import FakeRegistry, build_request, make_logo, make_settings, to_b64


def _client(**settings: object) -> TestClient:
    app = create_app(make_settings(**settings))
    app.state.registry = FakeRegistry()
    return TestClient(app)


def test_minimal_request_returns_the_contract_shape(
    client: TestClient, auth: dict[str, str]
) -> None:
    response = client.post("/internal/ai/analyse", json=build_request(page=None), headers=auth)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "modelVersion",
        "score",
        "level",
        "signals",
        "reasons",
        "unavailable",
        "ocrText",
        "logoMatch",
        "models",
    }
    assert body["modelVersion"] == "similo-risk-1"
    assert body["logoMatch"] is None
    assert set(body["models"]) == {"text", "image", "ocr"}
    signal = body["signals"][0]
    assert set(signal) == {"id", "label", "value", "points", "maxPoints", "detail"}
    assert signal["id"] == "domain_similarity"
    assert signal["points"] == 20  # 0.82 of 25, rounded down


def test_snake_case_field_names_are_not_required_but_extra_fields_are_ignored(
    client: TestClient, auth: dict[str, str]
) -> None:
    payload = build_request(page=None)
    payload["somethingNew"] = {"ignored": True}
    response = client.post("/internal/ai/analyse", json=payload, headers=auth)
    assert response.status_code == 200


def test_full_request_with_a_logo(client: TestClient, auth: dict[str, str]) -> None:
    logo = to_b64(make_logo())
    payload = build_request(
        brand={"logos": [{"id": "logo-1", "imageBase64": logo}]},
        page={"images": [{"kind": "logo", "imageBase64": logo}], "title": "Acme sign in"},
    )
    body = client.post("/internal/ai/analyse", json=payload, headers=auth).json()
    assert body["logoMatch"] == {
        "logoId": "logo-1",
        "source": "logo",
        "similarity": 1.0,
        "method": "phash",
    }
    assert "logo_match" not in body["unavailable"]


def test_oversize_declared_length_is_413_before_parsing(auth: dict[str, str]) -> None:
    client = _client(max_request_bytes=1_000)
    response = client.post(
        "/internal/ai/analyse",
        content=b"{" + b" " * 5_000,
        headers={**auth, "Content-Type": "application/json"},
    )
    assert response.status_code == 413  # not 422: the body was never parsed


def test_oversize_chunked_body_is_413(auth: dict[str, str]) -> None:
    client = _client(max_request_bytes=1_000)

    def chunks() -> Iterator[bytes]:
        for _ in range(10):
            yield b" " * 500

    response = client.post(
        "/internal/ai/analyse",
        content=chunks(),
        headers={**auth, "Content-Type": "application/json"},
    )
    assert response.status_code == 413


def test_unauthenticated_oversize_request_is_401_not_413() -> None:
    client = _client(max_request_bytes=1_000)
    response = client.post("/internal/ai/analyse", content=b" " * 5_000)
    assert response.status_code == 401


def test_body_at_the_limit_is_accepted(auth: dict[str, str]) -> None:
    body = json.dumps(build_request(page=None)).encode()
    client = _client(max_request_bytes=len(body))
    response = client.post(
        "/internal/ai/analyse", content=body, headers={**auth, "Content-Type": "application/json"}
    )
    assert response.status_code == 200


def test_invalid_json_is_422(client: TestClient, auth: dict[str, str]) -> None:
    response = client.post(
        "/internal/ai/analyse",
        content=b"{not json",
        headers={**auth, "Content-Type": "application/json"},
    )
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("mutate", "path_part"),
    [
        (lambda p: p["brand"].update(name=""), "name"),
        (lambda p: p["brand"].update(name="x" * 201), "name"),
        (lambda p: p["brand"].update(keywords=["k"] * 51), "keywords"),
        (lambda p: p["brand"].update(officialDomains=["d.com"] * 51), "officialDomains"),
        (
            lambda p: p["brand"].update(
                logos=[{"id": str(i), "imageBase64": "AAAA"} for i in range(6)]
            ),
            "logos",
        ),
        (lambda p: p["candidate"].update(domainScore=101), "domainScore"),
        (lambda p: p["candidate"].update(domainScore=-1), "domainScore"),
        (lambda p: p["candidate"].update(domain=""), "domain"),
        (lambda p: p["candidate"].update(registeredAt="yesterday"), "registeredAt"),
        (lambda p: p["candidate"]["page"].update(text="x" * 20_001), "text"),
        (lambda p: p["candidate"]["page"].update(title="x" * 1_001), "title"),
        (
            lambda p: p["candidate"]["page"].update(screenshotBase64="A" * 2_100_001),
            "screenshotBase64",
        ),
        (
            lambda p: p["candidate"]["page"].update(
                images=[{"kind": "image", "imageBase64": "AAAA"}] * 13
            ),
            "images",
        ),
        (
            lambda p: p["candidate"]["page"].update(
                images=[{"kind": "video", "imageBase64": "AAAA"}]
            ),
            "kind",
        ),
        (
            lambda p: p["candidate"]["page"].update(
                images=[{"kind": "image", "imageBase64": "A" * 700_001}]
            ),
            "imageBase64",
        ),
        (lambda p: p.pop("brand"), "brand"),
        (lambda p: p["candidate"].pop("domain"), "domain"),
    ],
)
def test_limits_and_types_are_enforced_with_422(
    client: TestClient, auth: dict[str, str], mutate, path_part: str
) -> None:
    payload = build_request()
    mutate(payload)
    response = client.post("/internal/ai/analyse", json=payload, headers=auth)
    assert response.status_code == 422
    assert any(path_part in str(item["loc"]) for item in response.json()["detail"])


def test_validation_errors_never_echo_the_submitted_values(
    client: TestClient, auth: dict[str, str]
) -> None:
    secret = "SECRET-PAGE-TEXT-" + "x" * 20_000
    payload = build_request(page={"text": secret})
    response = client.post("/internal/ai/analyse", json=payload, headers=auth)
    assert response.status_code == 422
    assert "SECRET-PAGE-TEXT" not in response.text


def test_unexpected_failure_is_a_plain_500_without_details(
    client: TestClient, auth: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    def boom(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("secret internals /etc/passwd")

    monkeypatch.setattr("app.api.analyse.analyse", boom)
    response = client.post("/internal/ai/analyse", json=build_request(), headers=auth)
    assert response.status_code == 500
    assert response.json() == {"detail": "The analysis failed."}


def test_ready_lists_the_models(client: TestClient, auth: dict[str, str]) -> None:
    response = client.get("/internal/ai/ready", headers=auth)
    assert response.json() == {"status": "ok", "models": {"text": True, "image": True, "ocr": True}}

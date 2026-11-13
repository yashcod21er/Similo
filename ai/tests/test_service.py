"""The orchestration, with the heavy models replaced by FakeRegistry (fast)."""

from datetime import UTC, datetime

import pytest

from app.analysis.models import AnalyseRequest
from app.analysis.service import analyse
from tests.helpers import (
    FakeRegistry,
    build_request,
    make_logo,
    make_noise,
    make_screenshot,
    to_b64,
)

NOW = datetime(2026, 11, 9, 12, 0, tzinfo=UTC)
LOGO = to_b64(make_logo())


def _run(registry: FakeRegistry | None = None, **parts):  # type: ignore[no-untyped-def]
    request = AnalyseRequest.model_validate(build_request(**parts))
    return analyse(request, registry=registry or FakeRegistry(), now=NOW)


def _signal(response, signal_id: str):  # type: ignore[no-untyped-def]
    return next(s for s in response.signals if s.id == signal_id)


def _phishing_parts(**page: object) -> dict:
    """A page that copies the brand: logo, title, password form, young domain."""
    return {
        "brand": {
            "name": "Acme Bank",
            "description": "Online banking, savings and loans.",
            "keywords": ["acme pay"],
            "logos": [{"id": "logo-1", "imageBase64": LOGO}],
        },
        "candidate": {"registeredAt": "2026-11-06T00:00:00Z"},
        "page": {
            "title": "Acme Bank - Sign in",
            "text": "Sign in to your Acme Bank online banking account.",
            "images": [{"kind": "logo", "imageBase64": LOGO}],
            "forms": {"hasPasswordField": True, "submitsToOtherDomain": True},
            "certificateIssuedAt": "2026-11-08T00:00:00Z",
            **page,
        },
    }


def test_a_copy_of_the_brand_scores_high_and_explains_itself() -> None:
    response = _run(**_phishing_parts())

    assert response.level == "high"
    assert response.score == sum(s.points for s in response.signals)
    assert response.unavailable == []
    assert _signal(response, "logo_match").points == 25
    assert _signal(response, "brand_mention").points == 10
    assert _signal(response, "credential_form").points == 10
    assert response.logo_match is not None
    assert response.logo_match.logo_id == "logo-1"
    assert response.logo_match.source == "logo"
    # Reasons: highest points first, plain sentences, one per signal with points.
    assert response.reasons[0].startswith("The page shows a logo that is almost identical")
    assert len(response.reasons) == len([s for s in response.signals if s.points > 0])
    assert "The domain was registered 3 days ago." in response.reasons


def test_json_output_uses_camel_case() -> None:
    payload = _run(**_phishing_parts()).model_dump(mode="json", by_alias=True)
    assert {"modelVersion", "ocrText", "logoMatch", "models"} <= set(payload)
    assert "maxPoints" in payload["signals"][0]
    assert "logoId" in payload["logoMatch"]


def test_page_not_captured_leaves_only_name_and_age_signals() -> None:
    response = _run(page=None, candidate={"registeredAt": "2026-11-08T00:00:00Z"})

    assert [s.id for s in response.signals] == ["domain_similarity", "new_domain"]
    assert response.unavailable == [
        "logo_match",
        "text_similarity",
        "brand_mention",
        "credential_form",
        "payment_form",
        "new_certificate",
    ]
    assert response.score == _signal(response, "domain_similarity").points + 4
    assert response.logo_match is None
    assert response.ocr_text == ""


def test_missing_dates_make_age_signals_unavailable() -> None:
    response = _run()
    assert "new_domain" in response.unavailable
    assert "new_certificate" in response.unavailable


def test_ordinary_login_page_is_not_suspicious() -> None:
    parts = {
        "brand": {"name": "Acme"},
        "candidate": {"domain": "bakery-shop.com", "domainScore": 5},
        "page": {
            "title": "Sunrise Bakery - Customer login",
            "text": "Log in to your Sunrise Bakery account to order fresh bread.",
            "forms": {"hasPasswordField": True, "hasPaymentField": True},
        },
    }
    response = _run(**parts)
    assert _signal(response, "credential_form").points == 0
    assert _signal(response, "payment_form").points == 0
    assert response.score == 0
    assert response.level == "low"
    assert response.reasons == []


def test_forms_score_once_a_brand_signal_is_present() -> None:
    parts = {
        "brand": {"name": "Acme"},
        "candidate": {"domain": "bakery-shop.com", "domainScore": 5},
        "page": {
            "title": "Acme - customer login",
            "forms": {"hasPasswordField": True, "hasPaymentField": True},
        },
    }
    response = _run(**parts)
    assert _signal(response, "credential_form").points == 10
    assert _signal(response, "payment_form").points == 5


def test_ocr_text_feeds_the_brand_mention() -> None:
    registry = FakeRegistry(ocr_lines=("Welcome", "Acrne secure login"))
    response = _run(
        registry,
        candidate={"domain": "bakery.com", "domainScore": 5},
        page={"screenshotBase64": to_b64(make_screenshot(), "JPEG")},
    )
    assert response.ocr_text == "Welcome\nAcrne secure login"
    mention = _signal(response, "brand_mention")
    assert mention.points == 8
    assert "imitates your brand name (Acme)" in mention.detail
    assert "inside an image" in mention.detail
    assert registry.ocr_calls == 1


def test_ocr_text_is_capped_at_2000_characters() -> None:
    registry = FakeRegistry(ocr_lines=tuple("word " * 100 for _ in range(30)))
    response = _run(registry, page={"screenshotBase64": to_b64(make_screenshot(), "JPEG")})
    assert len(response.ocr_text) == 2_000


def test_official_domain_candidate_gets_no_mention_points() -> None:
    response = _run(
        candidate={"domain": "login.acme.com"}, page={"title": "Acme", "text": "Acme Acme Acme"}
    )
    mention = _signal(response, "brand_mention")
    assert mention.points == 0
    assert "official domains" in mention.detail


def test_text_similarity_uses_the_brand_profile() -> None:
    same = _run(
        brand={"name": "Acme Bank", "description": "online banking savings loans"},
        page={"title": "", "text": "online banking savings loans Acme Bank"},
    )
    other = _run(
        brand={"name": "Acme Bank", "description": "online banking savings loans"},
        page={"title": "", "text": "zzz qqq xxx jjj"},
    )
    assert _signal(same, "text_similarity").value > _signal(other, "text_similarity").value
    assert _signal(other, "text_similarity").points == 0


def test_page_with_no_text_makes_text_signals_unavailable() -> None:
    response = _run(page={"title": "", "text": ""})
    assert "text_similarity" in response.unavailable
    assert "brand_mention" in response.unavailable


# --- model failures never fail the request ----------------------------------------------------
def test_text_model_failure_marks_text_similarity_unavailable() -> None:
    response = _run(FakeRegistry(fail={"text"}), **_phishing_parts())
    assert response.unavailable == ["text_similarity"]
    assert _signal(response, "logo_match").points == 25  # the other signals still work


def test_ocr_failure_still_returns_everything_else() -> None:
    parts = _phishing_parts(screenshotBase64=to_b64(make_screenshot(), "JPEG"))
    response = _run(FakeRegistry(fail={"ocr"}), **parts)
    assert response.ocr_text == ""
    assert response.unavailable == []


def test_image_model_failure_marks_logo_unavailable_unless_a_hash_matched() -> None:
    different = {"images": [{"kind": "image", "imageBase64": to_b64(make_noise())}]}
    response = _run(FakeRegistry(fail={"image"}), **_phishing_parts(**different))
    assert "logo_match" in response.unavailable
    assert response.logo_match is None

    matched = _run(FakeRegistry(fail={"image"}), **_phishing_parts())
    assert "logo_match" not in matched.unavailable


def test_all_models_failing_still_answers() -> None:
    parts = _phishing_parts(
        screenshotBase64=to_b64(make_screenshot(), "JPEG"),
        images=[{"kind": "image", "imageBase64": to_b64(make_noise())}],
    )
    response = _run(FakeRegistry(fail={"text", "image", "ocr"}), **parts)
    assert set(response.unavailable) == {"text_similarity", "logo_match"}
    assert response.score > 0


def test_unexpected_error_in_one_signal_is_contained(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*_args: object, **_kwargs: object) -> None:
        raise ValueError("page text that must not be logged")

    monkeypatch.setattr("app.analysis.service.text_similarity", boom)
    response = _run(**_phishing_parts())
    assert "text_similarity" in response.unavailable


# --- bad images are skipped, not fatal -----------------------------------------------------------
def test_undecodable_images_are_skipped() -> None:
    parts = _phishing_parts(
        screenshotBase64="not-an-image",
        images=[
            {"kind": "image", "imageBase64": "!!!"},
            {"kind": "logo", "imageBase64": LOGO},
        ],
    )
    response = _run(**parts)
    assert _signal(response, "logo_match").points == 25


def test_undecodable_brand_logos_make_logo_match_unavailable() -> None:
    parts = _phishing_parts()
    parts["brand"]["logos"] = [{"id": "x", "imageBase64": "garbage"}]
    response = _run(**parts)
    assert "logo_match" in response.unavailable


def test_brand_without_logos_makes_logo_match_unavailable() -> None:
    parts = _phishing_parts()
    parts["brand"]["logos"] = []
    assert "logo_match" in _run(**parts).unavailable


def test_response_names_the_models() -> None:
    models = _run(page=None).models
    assert models.text == "sentence-transformers/all-MiniLM-L6-v2"
    assert models.image == "Qdrant/clip-ViT-B-32-vision"
    assert models.ocr.startswith("rapidocr")

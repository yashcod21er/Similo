"""One slow end-to-end test with the REAL models (MiniLM text, CLIP vision, RapidOCR).

Skipped by default. Run it with:  uv run pytest -m slow
It never downloads anything: the models must already be in ai/.models (or AI_MODELS_DIR).
"""

from datetime import UTC, datetime
from pathlib import Path

import pytest

from app.analysis.models import AnalyseRequest
from app.analysis.models_loader import ModelRegistry
from app.analysis.service import analyse
from tests.helpers import build_request, make_logo, make_noise, make_screenshot, to_b64

MODELS_DIR = Path(__file__).resolve().parent.parent / ".models"


@pytest.mark.slow
def test_real_text_clip_and_ocr_models_on_a_generated_page() -> None:
    from tests.helpers import make_settings

    registry = ModelRegistry(
        make_settings(models_dir=MODELS_DIR, allow_model_download=False, service_token=None)
    )
    # The brand's logo is a blue circle "ACME"; the page redraws it as a red square "ACNE":
    # not an exact copy, so the perceptual hash fails and CLIP has to decide.
    brand_logo = make_logo("ACME")
    lookalike = make_logo("ACNE", shape="square", fg=(200, 40, 40))
    screenshot = make_screenshot(
        header_logo=lookalike, lines=("ACME BANK", "Sign in to your account")
    )
    payload = build_request(
        brand={
            "name": "Acme Bank",
            "description": "Online banking, savings accounts and loans.",
            "logos": [{"id": "logo-1", "imageBase64": to_b64(brand_logo)}],
        },
        candidate={"domain": "acme-bank-login.com", "domainScore": 82},
        page={
            "title": "Acme Bank - Sign in",
            "text": "Sign in to your Acme Bank online banking account with your password.",
            "screenshotBase64": to_b64(screenshot, "JPEG", quality=85),
            "images": [{"kind": "image", "imageBase64": to_b64(make_noise())}],
            "forms": {"hasPasswordField": True},
        },
    )

    response = analyse(
        AnalyseRequest.model_validate(payload),
        registry=registry,
        now=datetime(2026, 11, 9, tzinfo=UTC),
    )

    assert registry.status() == {"text": True, "image": True, "ocr": True}
    assert response.unavailable == ["new_domain", "new_certificate"]  # no dates were given
    assert "ACME" in response.ocr_text.upper()  # RapidOCR read the screenshot
    by_id = {signal.id: signal for signal in response.signals}
    assert by_id["text_similarity"].value > 0.5  # MiniLM: same topic and wording
    assert by_id["brand_mention"].points == 10
    assert by_id["credential_form"].points == 10  # the brand signals open the gate
    assert by_id["logo_match"].value > 0.8  # CLIP: a redrawn look-alike is close
    assert response.logo_match is not None
    assert response.logo_match.method == "clip"
    assert response.logo_match.source in {"screenshot", "image"}
    assert response.level in {"medium", "high"}

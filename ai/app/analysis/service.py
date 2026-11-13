"""Orchestrates one analysis: decode, run each signal, score, explain.

``analyse(request)`` is the in-process API (used by the HTTP endpoint and by the evaluation
runner). A signal whose model fails, or whose input is missing, is reported in
``unavailable`` and never fails the whole request. Nothing about the page or the images is
logged or stored.
"""

import logging
from collections.abc import Callable
from datetime import UTC, datetime

from PIL import Image

from app.analysis import mention as mention_module
from app.analysis import scoring
from app.analysis.images import try_decode_image
from app.analysis.logos import LogoComparison, compare_logos
from app.analysis.models import (
    AnalyseRequest,
    AnalyseResponse,
    LogoMatch,
    LogoSource,
    ModelNames,
    Signal,
    SignalId,
)
from app.analysis.models_loader import (
    IMAGE_MODEL_NAME,
    TEXT_MODEL_NAME,
    ModelRegistry,
    get_registry,
    ocr_model_name,
)
from app.analysis.ocr import read_text
from app.analysis.text import text_similarity

logger = logging.getLogger("similo.ai.analysis")

MAX_LOGO_SIDE = 1024  # larger brand logos and page images are shrunk right after decoding
MAX_SCREENSHOT_SIDE = 1600


def _guard[T](name: str, function: Callable[[], T]) -> T | None:
    """Run one signal's computation; a model or input failure becomes None (= unavailable)."""
    try:
        return function()
    except Exception as error:  # noqa: BLE001 - any single-signal failure must not fail the request
        # Only the exception type is logged: messages could echo page content.
        logger.error("Signal %s failed (%s)", name, type(error).__name__)
        return None


def analyse(
    request: AnalyseRequest,
    *,
    registry: ModelRegistry | None = None,
    now: datetime | None = None,
) -> AnalyseResponse:
    registry = registry or get_registry()
    now = now or datetime.now(UTC)
    brand, candidate = request.brand, request.candidate
    page = candidate.page

    signals: list[Signal] = []
    unavailable: list[SignalId] = []
    ocr_text = ""
    logo_match: LogoMatch | None = None

    domain = scoring.domain_signal(candidate.domain_score, candidate.domain)
    signals.append(domain)
    evidence = {"domain": domain.value, "logo": 0.0, "text": 0.0, "mention": 0.0}

    if candidate.registered_at is None:
        unavailable.append("new_domain")
    else:
        signals.append(scoring.new_domain_signal(candidate.registered_at, now))

    if page is None:
        unavailable += [
            "logo_match",
            "text_similarity",
            "brand_mention",
            "credential_form",
            "payment_form",
            "new_certificate",
        ]
    else:
        screenshot = try_decode_image(page.screenshot_base64, MAX_SCREENSHOT_SIDE)

        # OCR first: its text feeds the brand-mention check.
        if screenshot is not None:
            ocr_text = _guard("ocr", lambda: read_text(registry, screenshot)) or ""

        # Text similarity
        has_text = bool(page.title.strip() or page.text.strip())
        similarity = (
            _guard(
                "text_similarity",
                lambda: text_similarity(
                    registry,
                    brand_name=brand.name,
                    brand_description=brand.description,
                    brand_keywords=brand.keywords,
                    page_title=page.title,
                    page_text=page.text,
                ),
            )
            if has_text
            else None
        )
        if similarity is None:
            unavailable.append("text_similarity")
        else:
            signals.append(scoring.text_signal(similarity))
            evidence["text"] = scoring.ramp(
                similarity, scoring.THRESHOLDS.text_low, scoring.THRESHOLDS.text_high
            )

        # Brand mention (title, text, OCR; the brand's own official domains are ignored)
        if mention_module.is_official_domain(candidate.domain, brand.official_domains):
            signals.append(scoring.mention_signal_for_official_domain())
        elif has_text or ocr_text:
            mentions = mention_module.find_mentions(
                name=brand.name,
                keywords=brand.keywords,
                official_domains=brand.official_domains,
                title=page.title,
                text=page.text,
                ocr_text=ocr_text,
            )
            signals.append(scoring.mention_signal(mentions, brand.name))
            evidence["mention"] = scoring.mention_fraction(mentions)[0]
        else:
            unavailable.append("brand_mention")

        # Logo match
        comparison, position = _compare_logos(registry, request, screenshot)
        if comparison is None or (comparison.best is None and comparison.clip_failed):
            unavailable.append("logo_match")
        else:
            signals.append(
                scoring.logo_signal(comparison, logo_count=len(brand.logos), logo_position=position)
            )
            if comparison.best is not None:
                evidence["logo"] = comparison.best.fraction
                logo_match = LogoMatch(
                    logo_id=comparison.best.logo_id,
                    source=comparison.best.source,
                    similarity=round(comparison.best.similarity, 3),
                    method=comparison.best.method,
                )

        # Forms (gated by the brand evidence collected above)
        gate = scoring.BrandEvidence(
            domain_value=evidence["domain"],
            logo_fraction=evidence["logo"],
            text_fraction=evidence["text"],
            mention_fraction=evidence["mention"],
        )
        signals.append(scoring.credential_signal(page.forms, gate))
        signals.append(scoring.payment_signal(page.forms, gate))

        if page.certificate_issued_at is None:
            unavailable.append("new_certificate")
        else:
            signals.append(scoring.new_certificate_signal(page.certificate_issued_at, now))

    return scoring.assemble(
        signals,
        unavailable,
        ocr_text=ocr_text,
        logo_match=logo_match,
        models=ModelNames(text=TEXT_MODEL_NAME, image=IMAGE_MODEL_NAME, ocr=ocr_model_name()),
    )


def _compare_logos(
    registry: ModelRegistry, request: AnalyseRequest, screenshot: Image.Image | None
) -> tuple[LogoComparison | None, int]:
    """Decode the brand logos and page images, compare them, and find the matching logo's slot."""
    brand, page = request.brand, request.candidate.page
    assert page is not None  # noqa: S101 - callers only pass requests that have a page

    logos: list[tuple[str, Image.Image]] = []
    for logo in brand.logos:
        image = try_decode_image(logo.image_base64, MAX_LOGO_SIDE)
        if image is not None:
            logos.append((logo.id, image))
    page_images: list[tuple[LogoSource, Image.Image]] = []
    for item in page.images:
        image = try_decode_image(item.image_base64, MAX_LOGO_SIDE)
        if image is not None:
            page_images.append((item.kind, image))

    comparison = _guard(
        "logo_match", lambda: compare_logos(registry, logos, page_images, screenshot)
    )
    position = 1
    if comparison is not None and comparison.best is not None:
        ids = [logo.id for logo in brand.logos]
        if comparison.best.logo_id in ids:
            position = ids.index(comparison.best.logo_id) + 1
    return comparison, position

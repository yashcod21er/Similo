"""The scoring rules: points, the gating rule for forms, the cap, levels and reason order."""

from datetime import UTC, datetime, timedelta

import pytest

from app.analysis import scoring
from app.analysis.logos import LogoComparison, LogoHit
from app.analysis.mention import Mention
from app.analysis.models import ModelNames, PageForms, Signal, SignalId
from app.analysis.scoring import THRESHOLDS, WEIGHTS, BrandEvidence

NOW = datetime(2026, 11, 9, 12, 0, tzinfo=UTC)
NAMES = ModelNames(text="t", image="i", ocr="o")
PASSWORD = PageForms(has_password_field=True)
PAYMENT = PageForms(has_payment_field=True)


def _assemble(signals: list[Signal], unavailable: list[SignalId] | None = None):  # type: ignore[no-untyped-def]
    return scoring.assemble(signals, unavailable or [], ocr_text="", logo_match=None, models=NAMES)


def test_weights_match_the_contract() -> None:
    assert WEIGHTS == {
        "domain_similarity": 25,
        "logo_match": 25,
        "text_similarity": 15,
        "brand_mention": 10,
        "credential_form": 10,
        "payment_form": 5,
        "new_domain": 5,
        "new_certificate": 5,
    }
    assert sum(WEIGHTS.values()) == 100


# --- levels and the cap --------------------------------------------------------------------
@pytest.mark.parametrize(
    ("score", "level"),
    [(0, "low"), (39, "low"), (40, "medium"), (69, "medium"), (70, "high"), (100, "high")],
)
def test_levels(score: int, level: str) -> None:
    assert scoring.level_for(score) == level
    assert (THRESHOLDS.level_medium, THRESHOLDS.level_high) == (40, 70)


def test_score_is_the_sum_of_points() -> None:
    signals = [
        scoring.domain_signal(82, "acme-login.com"),
        scoring.new_domain_signal(NOW - timedelta(days=3), NOW),
    ]
    assert _assemble(signals).score == sum(s.points for s in signals)


def test_score_is_capped_at_100() -> None:
    inflated = [
        scoring.domain_signal(100, "acme.test").model_copy(update={"points": 90}),
        scoring.new_domain_signal(NOW, NOW).model_copy(update={"points": 90}),
    ]
    response = _assemble(inflated)
    assert response.score == 100
    assert response.level == "high"


def test_everything_at_maximum_scores_100() -> None:
    evidence = BrandEvidence(domain_value=1.0)
    hit = LogoHit("a", "logo", 1.0, "phash", 1.0)
    signals = [
        scoring.domain_signal(100, "acme.test"),
        scoring.logo_signal(LogoComparison(hit, 1.0, "phash", 1), logo_count=1, logo_position=1),
        scoring.text_signal(1.0),
        scoring.mention_signal([Mention("Acme", "title", False, 1)], "Acme"),
        scoring.credential_signal(PASSWORD, evidence),
        scoring.payment_signal(PAYMENT, evidence),
        scoring.new_domain_signal(NOW, NOW),
        scoring.new_certificate_signal(NOW, NOW),
    ]
    assert [s.points for s in signals] == [25, 25, 15, 10, 10, 5, 5, 5]
    assert _assemble(signals).score == 100


# --- reasons -------------------------------------------------------------------------------
def test_reasons_are_highest_points_first_and_only_for_points_above_zero() -> None:
    signals = [
        scoring.domain_signal(82, "acme-login.com"),  # 20
        scoring.new_domain_signal(NOW - timedelta(days=15), NOW),  # 2
        scoring.mention_signal([Mention("Acme", "title", False, 1)], "Acme"),  # 10
        scoring.text_signal(0.1),  # 0
        scoring.credential_signal(PageForms(), BrandEvidence()),  # 0
    ]
    response = _assemble(signals)
    assert response.reasons == [
        "The domain name acme-login.com is very similar to your brand name.",
        "Your brand name (Acme) appears in the page title.",
        "The domain was registered 15 days ago.",
    ]
    # Every signal is still listed, including the ones without points.
    assert len(response.signals) == 5


def test_equal_points_keep_the_display_order() -> None:
    evidence = BrandEvidence(domain_value=0.9)
    signals = [
        scoring.new_domain_signal(NOW, NOW),  # 5
        scoring.payment_signal(PAYMENT, evidence),  # 5
    ]
    response = _assemble(signals)
    assert [s.id for s in response.signals] == ["payment_form", "new_domain"]
    assert response.reasons[0].startswith("The page asks for card or payment")


def test_unavailable_ids_are_sorted_in_signal_order() -> None:
    response = _assemble([], ["new_certificate", "logo_match", "new_domain"])
    assert response.unavailable == ["logo_match", "new_domain", "new_certificate"]


# --- gating ----------------------------------------------------------------------------------
def test_password_page_alone_is_not_suspicious() -> None:
    signal = scoring.credential_signal(PASSWORD, BrandEvidence(domain_value=0.2))
    assert signal.points == 0
    assert "alone is not counted as suspicious" in signal.detail


def test_payment_page_alone_is_not_suspicious() -> None:
    signal = scoring.payment_signal(PAYMENT, BrandEvidence())
    assert signal.points == 0
    assert "nothing else points to your brand" in signal.detail


@pytest.mark.parametrize(
    "evidence",
    [
        BrandEvidence(domain_value=0.7),
        BrandEvidence(logo_fraction=THRESHOLDS.gate_logo_fraction),
        BrandEvidence(text_fraction=THRESHOLDS.gate_text_fraction),
        BrandEvidence(mention_fraction=THRESHOLDS.gate_mention_fraction),
    ],
)
def test_any_brand_signal_opens_the_gate(evidence: BrandEvidence) -> None:
    assert scoring.credential_signal(PASSWORD, evidence).points == 10
    assert scoring.payment_signal(PAYMENT, evidence).points == 5


@pytest.mark.parametrize(
    "evidence",
    [
        BrandEvidence(domain_value=0.69),
        BrandEvidence(logo_fraction=0.29),
        BrandEvidence(text_fraction=0.29),
        BrandEvidence(mention_fraction=0.49),
    ],
)
def test_weak_brand_evidence_keeps_the_gate_closed(evidence: BrandEvidence) -> None:
    assert scoring.credential_signal(PASSWORD, evidence).points == 0
    assert scoring.payment_signal(PAYMENT, evidence).points == 0


def test_form_wording() -> None:
    open_gate = BrandEvidence(domain_value=0.9)
    assert (
        scoring.credential_signal(PASSWORD, open_gate).detail
        == "The page asks for a password, and it appears to imitate your brand."
    )
    other_site = PageForms(has_password_field=True, submits_to_other_domain=True)
    assert "sent to a different website" in scoring.credential_signal(other_site, open_gate).detail
    assert scoring.credential_signal(PageForms(), open_gate).points == 0


# --- domain and age ---------------------------------------------------------------------------
def test_domain_points_follow_the_name_score() -> None:
    assert scoring.domain_signal(82, "x.com").points == 20  # the brief's example
    assert scoring.domain_signal(100, "x.com").points == 25
    assert scoring.domain_signal(39, "x.com").points == 0
    assert "not very similar" in scoring.domain_signal(10, "x.com").detail


@pytest.mark.parametrize(
    ("days", "points", "text"),
    [
        (0, 5, "today"),
        (3, 4, "3 days ago"),
        (15, 2, "15 days ago"),
        (29, 0, "29 days ago"),
        (30, 0, "30 days ago"),
        (400, 0, "13 months ago"),
        (900, 0, "2 years ago"),
    ],
)
def test_new_domain(days: int, points: int, text: str) -> None:
    signal = scoring.new_domain_signal(NOW - timedelta(days=days), NOW)
    assert signal.points == points
    assert signal.detail == f"The domain was registered {text}."


def test_certificate_window_is_14_days() -> None:
    assert scoring.new_certificate_signal(NOW - timedelta(days=1), NOW).points == 4
    assert scoring.new_certificate_signal(NOW - timedelta(days=14), NOW).points == 0


def test_dates_without_timezone_and_in_the_future_are_handled() -> None:
    naive = datetime(2026, 11, 8, 12, 0)  # noqa: DTZ001 - the point of the test
    assert scoring.new_domain_signal(naive, NOW).points == 4
    assert scoring.new_domain_signal(NOW + timedelta(days=3), NOW).points == 5  # clock skew


# --- logo and text wording -------------------------------------------------------------------
def test_logo_wording_by_method_and_source() -> None:
    near = LogoComparison(LogoHit("a", "logo", 0.97, "phash", 0.97), 0.97, "phash", 3)
    assert (
        scoring.logo_signal(near, logo_count=1, logo_position=1).detail
        == "The page shows a logo that is almost identical to your logo."
    )
    favicon = LogoComparison(LogoHit("a", "favicon", 0.97, "phash", 0.97), 0.97, "phash", 3)
    detail = scoring.logo_signal(favicon, logo_count=2, logo_position=2).detail
    assert "small icon (favicon) is almost identical" in detail
    assert "(logo 2 of 2)" in detail


def test_clip_matches_never_claim_a_copy() -> None:
    similar = LogoComparison(LogoHit("a", "screenshot", 0.9, "clip", 0.4), 0.9, "clip", 3)
    detail = scoring.logo_signal(similar, logo_count=1, logo_position=1).detail
    assert "looks similar to your logo" in detail
    assert "almost identical" not in detail
    assert "visual estimate" in detail
    very = LogoComparison(LogoHit("a", "image", 0.95, "clip", 0.8), 0.95, "clip", 3)
    assert "looks very similar" in scoring.logo_signal(very, logo_count=1, logo_position=1).detail


def test_clip_alone_cannot_earn_the_full_logo_points() -> None:
    assert scoring.logo_fraction("clip", 1.0) == THRESHOLDS.clip_max_fraction
    assert scoring.points_for("logo_match", scoring.logo_fraction("clip", 1.0)) == 20
    assert scoring.logo_fraction("clip", 0.80) == 0.0
    assert scoring.logo_fraction("phash", 0.0, distance=9) == 0.0
    assert scoring.logo_fraction("phash", 1.0, distance=0) == 1.0
    assert scoring.logo_fraction("phash", 0.9, distance=8) == pytest.approx(0.9)


def test_no_logo_found_wordings() -> None:
    nothing = LogoComparison(None, 0.4, "clip", 5)
    detail = scoring.logo_signal(nothing, logo_count=1, logo_position=1).detail
    assert "looks like your logos" in detail
    empty = LogoComparison(None, 0.0, None, 0)
    assert "could be compared" in scoring.logo_signal(empty, logo_count=1, logo_position=1).detail


def test_text_signal_bands() -> None:
    assert scoring.text_signal(0.3).points == 0
    assert scoring.text_signal(THRESHOLDS.text_low).points == 0
    assert scoring.text_signal(THRESHOLDS.text_high).points == 15
    assert "somewhat similar" in scoring.text_signal(0.62).detail
    assert "very similar" in scoring.text_signal(0.9).detail


# --- mentions ----------------------------------------------------------------------------------
@pytest.mark.parametrize(
    ("mention", "points"),
    [
        (Mention("Acme", "title", False, 1), 10),
        (Mention("Acme", "title", True, 1), 10),
        (Mention("Acme", "image", False, 1), 8),
        (Mention("Acme", "text", True, 1), 8),
        (Mention("Acme", "text", False, 1), 5),
        (Mention("Acme", "text", False, 3), 8),
    ],
)
def test_mention_points(mention: Mention, points: int) -> None:
    assert scoring.mention_signal([mention], "Acme").points == points


def test_strongest_mention_wins() -> None:
    signal = scoring.mention_signal(
        [Mention("Acme", "text", False, 1), Mention("Acme", "title", False, 1)], "Acme"
    )
    assert signal.detail == "Your brand name (Acme) appears in the page title."


def test_lookalike_mention_wording_is_careful() -> None:
    signal = scoring.mention_signal([Mention("Acme", "text", True, 1)], "Acme")
    assert (
        signal.detail == "A spelling that imitates your brand name (Acme) appears in the page text."
    )


def test_no_mention_and_official_domain() -> None:
    assert scoring.mention_signal([], "Acme").points == 0
    official = scoring.mention_signal_for_official_domain()
    assert official.points == 0
    assert "official domains" in official.detail


def test_points_are_rounded_down_never_up() -> None:
    assert scoring.points_for("domain_similarity", 0.999) == 24
    assert scoring.points_for("domain_similarity", 1.0) == 25
    assert scoring.points_for("domain_similarity", 1.7) == 25
    assert scoring.points_for("domain_similarity", -1) == 0

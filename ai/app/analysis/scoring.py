"""The explainable risk score: every point comes from one named signal with a sentence.

All numbers that decide a score live in this file (``WEIGHTS`` and ``THRESHOLDS``), so they
can be tuned in one place. They are INITIAL values chosen from how each method behaves, not
measured results: the evaluation set (``ai/eval`` and ``docs/EVALUATION.md``) measures them.

How a score is built
--------------------
Each signal produces a *fraction* between 0 and 1 (how strongly its evidence points at a
look-alike) and earns ``floor(maxPoints * fraction)`` points (rounded down, so a signal never
claims more than its method supports). The score is the sum of the points, capped at 100,
and the level is ``high`` from 70 points and ``medium`` from 40.

Gating rule: an ordinary login or payment page is not suspicious by itself. The
``credential_form`` and ``payment_form`` signals only earn points when at least one *brand
signal* is present: a domain name close to the brand (>= 0.7), a logo match, similar text, or
a mention of the brand.

Wording rule: sentences are for non-technical people. Visual and text methods say "looks
similar" (an estimate); only a near-identical image hash says "almost identical".
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from app.analysis.models import (
    AnalyseResponse,
    Level,
    LogoMatch,
    ModelNames,
    PageForms,
    Signal,
    SignalId,
)

if TYPE_CHECKING:
    from app.analysis.logos import LogoComparison
    from app.analysis.mention import Mention

MODEL_VERSION = "similo-risk-1"

# Maximum points per signal. They add up to 100.
WEIGHTS: dict[SignalId, int] = {
    "domain_similarity": 25,
    "logo_match": 25,
    "text_similarity": 15,
    "brand_mention": 10,
    "credential_form": 10,
    "payment_form": 5,
    "new_domain": 5,
    "new_certificate": 5,
}
assert sum(WEIGHTS.values()) == 100  # noqa: S101 - guards against editing one weight only

LABELS: dict[SignalId, str] = {
    "domain_similarity": "Domain name",
    "logo_match": "Logo",
    "text_similarity": "Page wording",
    "brand_mention": "Brand name on the page",
    "credential_form": "Password request",
    "payment_form": "Payment request",
    "new_domain": "Domain age",
    "new_certificate": "Certificate age",
}

# Order used to break ties between signals with the same points (also the display order).
SIGNAL_ORDER: tuple[SignalId, ...] = tuple(WEIGHTS)


@dataclass(frozen=True)
class Thresholds:
    # --- levels (score 0-100) ---
    level_high: int = 70  # score >= 70 -> "high"
    level_medium: int = 40  # score >= 40 -> "medium", below -> "low"

    # --- domain_similarity: the backend's name score (0-100) divided by 100 ---
    # Phase 5 only creates findings from about 0.55 upwards; below this value we give no points.
    domain_min_value: float = 0.4

    # --- logo_match ---
    # pHash and dHash distances (0-64 bits) must BOTH be <= this to call a pair near-identical.
    # 8 bits (12 %) tolerates resizing, re-compression and recolouring but not a different logo.
    phash_near_identical_distance: int = 8
    # Near-identical copies earn 90-100 % of the points (100 % at distance 0).
    phash_fraction_at_limit: float = 0.9
    # CLIP image-image cosine: no points up to clip_low, the maximum at clip_high. Different
    # logos usually sit at 0.6-0.8 and copies above 0.9 (to be confirmed by the evaluation).
    clip_low: float = 0.82
    clip_high: float = 0.95
    # CLIP measures "looks alike", not "is a copy", so it can never earn more than 80 %.
    clip_max_fraction: float = 0.8
    # When a hash match already earns at least this, CLIP is not run (saves about a second).
    skip_clip_when_fraction_at_least: float = 0.9
    # Screenshot tiles: the top 20 % of the screenshot, at most 24 tiles.
    tile_band_fraction: float = 0.2
    max_tiles: int = 24
    # "very similar" wording from this share of the logo points, "similar" below it.
    logo_very_similar_fraction: float = 0.55

    # --- text_similarity: MiniLM cosine between brand profile and page text ---
    # Measured by hand on a handful of invented pages (not an evaluation): a page copying the
    # brand's own wording scores about 0.9, a sign-in page for the same brand about 0.65, a
    # different bank about 0.55, an unrelated shop about 0. Topic similarity is weak evidence
    # (a genuine competitor looks alike too), so the points only start at 0.5.
    text_low: float = 0.5
    text_high: float = 0.85

    # --- brand_mention: share of the points by where and how the name appears ---
    mention_title: float = 1.0  # in the page title (exact or look-alike spelling)
    mention_image: float = (
        0.8  # only inside an image (found by OCR); often done to dodge text checks
    )
    mention_text_lookalike: float = 0.8  # a deliberately altered spelling in the text
    mention_text_exact: float = 0.5  # the name appears in the text once or twice
    mention_text_exact_repeated: float = 0.8  # three or more times
    mention_repeat_count: int = 3

    # --- age of the domain and of its certificate ---
    new_domain_days: int = 30  # points fade out linearly from 100 % (today) to 0 at 30 days
    new_certificate_days: int = 14

    # --- gate for credential_form / payment_form: some brand signal must be present ---
    gate_domain_value: float = 0.7
    gate_logo_fraction: float = 0.3
    gate_text_fraction: float = 0.3
    gate_mention_fraction: float = 0.5


THRESHOLDS = Thresholds()


# --- helpers -----------------------------------------------------------------------------
def ramp(value: float, low: float, high: float) -> float:
    """0 at or below ``low``, 1 at or above ``high``, linear in between."""
    if high <= low:
        return 1.0 if value >= high else 0.0
    return max(0.0, min(1.0, (value - low) / (high - low)))


def points_for(signal_id: SignalId, fraction: float) -> int:
    """Points earned for a fraction of the maximum; rounded down so we never overclaim."""
    maximum = WEIGHTS[signal_id]
    return max(0, min(maximum, int(maximum * max(0.0, min(1.0, fraction)) + 1e-9)))


def level_for(score: int) -> Level:
    if score >= THRESHOLDS.level_high:
        return "high"
    if score >= THRESHOLDS.level_medium:
        return "medium"
    return "low"


def logo_fraction(method: str, similarity: float, distance: int | None = None) -> float:
    """Share (0-1) of the logo points a comparison earns. ``method`` is 'phash' or 'clip'."""
    if method == "phash":
        if distance is None:
            distance = round((1.0 - similarity) * 64)
        limit = THRESHOLDS.phash_near_identical_distance
        if distance > limit:
            return 0.0
        return 1.0 - (1.0 - THRESHOLDS.phash_fraction_at_limit) * distance / limit
    return (
        ramp(similarity, THRESHOLDS.clip_low, THRESHOLDS.clip_high) * THRESHOLDS.clip_max_fraction
    )


def _signal(
    signal_id: SignalId, value: float, fraction: float, detail: str, *, points: int | None = None
) -> Signal:
    return Signal(
        id=signal_id,
        label=LABELS[signal_id],
        value=round(max(0.0, min(1.0, value)), 3),
        points=points_for(signal_id, fraction) if points is None else points,
        max_points=WEIGHTS[signal_id],
        detail=detail,
    )


def _utc(moment: datetime) -> datetime:
    return moment.replace(tzinfo=UTC) if moment.tzinfo is None else moment.astimezone(UTC)


def describe_age(days: int) -> str:
    if days <= 0:
        return "today"
    if days == 1:
        return "1 day ago"
    if days < 60:
        return f"{days} days ago"
    if days < 730:
        return f"{days // 30} months ago"
    return f"{days // 365} years ago"


# --- one function per signal -------------------------------------------------------------
def domain_signal(domain_score: float, domain: str) -> Signal:
    value = max(0.0, min(1.0, domain_score / 100))
    if value < THRESHOLDS.domain_min_value:
        detail = f"The domain name {domain} is not very similar to your brand name."
        return _signal("domain_similarity", value, 0.0, detail)
    if value >= 0.9:
        closeness = "almost the same as"
    elif value >= 0.75:
        closeness = "very similar to"
    elif value >= 0.55:
        closeness = "similar to"
    else:
        closeness = "somewhat similar to"
    return _signal(
        "domain_similarity",
        value,
        value,
        f"The domain name {domain} is {closeness} your brand name.",
    )


_LOGO_SUBJECT = {
    "favicon": "The page's small icon (favicon)",
    "logo": "The page shows a logo that",
    "image": "An image on the page",
    "screenshot": "The top of the page contains a logo-like area that",
}


def logo_signal(comparison: LogoComparison, *, logo_count: int, logo_position: int) -> Signal:
    """Signal for a finished comparison. ``logo_position`` is the 1-based matching logo."""
    hit = comparison.best
    if hit is None:
        if comparison.compared == 0:
            detail = "No logo or image on the page could be compared with your logos."
        else:
            detail = "No logo or image on the page looks like your logos."
        return _signal("logo_match", comparison.value, 0.0, detail)
    which = f" (logo {logo_position} of {logo_count})" if logo_count > 1 else ""
    if hit.method == "phash":
        phrase = "is almost identical to"
    elif hit.fraction >= THRESHOLDS.logo_very_similar_fraction:
        phrase = "looks very similar to"
    else:
        phrase = "looks similar to"
    detail = f"{_LOGO_SUBJECT[hit.source]} {phrase} your logo{which}."
    if hit.method == "clip":
        detail += " This is a visual estimate, so please check it by eye."
    return _signal("logo_match", hit.similarity, hit.fraction, detail)


def text_signal(similarity: float) -> Signal:
    fraction = ramp(similarity, THRESHOLDS.text_low, THRESHOLDS.text_high)
    if fraction <= 0:
        detail = "The wording on the page does not resemble your brand."
    elif fraction >= 0.6:
        detail = "The wording on the page is very similar to your brand's own description."
    else:
        detail = "The wording on the page is somewhat similar to your brand's own description."
    return _signal("text_similarity", similarity, fraction, detail)


def mention_fraction(mentions: list[Mention]) -> tuple[float, Mention | None]:
    """Strongest mention and the share of the points it earns."""
    best: tuple[float, Mention | None] = (0.0, None)
    for mention in mentions:
        if mention.where == "title":
            fraction = THRESHOLDS.mention_title
        elif mention.where == "image":
            fraction = THRESHOLDS.mention_image
        elif mention.lookalike:
            fraction = THRESHOLDS.mention_text_lookalike
        elif mention.count >= THRESHOLDS.mention_repeat_count:
            fraction = THRESHOLDS.mention_text_exact_repeated
        else:
            fraction = THRESHOLDS.mention_text_exact
        if fraction > best[0]:
            best = (fraction, mention)
    return best


_WHERE_PHRASE = {
    "title": "in the page title",
    "text": "in the page text",
    "image": "inside an image on the page",
}


def mention_signal(mentions: list[Mention], brand_name: str) -> Signal:
    fraction, mention = mention_fraction(mentions)
    if mention is None:
        return _signal("brand_mention", 0.0, 0.0, "Your brand name does not appear on the page.")
    thing = f"your brand name ({brand_name})" if mention.term == brand_name else f"“{mention.term}”"
    where = _WHERE_PHRASE[mention.where]
    if mention.lookalike:
        detail = f"A spelling that imitates {thing} appears {where}."
    else:
        detail = f"{thing[0].upper()}{thing[1:]} appears {where}."
    return _signal("brand_mention", fraction, fraction, detail)


def mention_signal_for_official_domain() -> Signal:
    detail = "This is one of your official domains, so mentions of your brand name are expected."
    return _signal("brand_mention", 0.0, 0.0, detail)


@dataclass(frozen=True)
class BrandEvidence:
    """Which brand signals are present (used by the gating rule)."""

    domain_value: float = 0.0
    logo_fraction: float = 0.0
    text_fraction: float = 0.0
    mention_fraction: float = 0.0

    @property
    def present(self) -> bool:
        return (
            self.domain_value >= THRESHOLDS.gate_domain_value
            or self.logo_fraction >= THRESHOLDS.gate_logo_fraction
            or self.text_fraction >= THRESHOLDS.gate_text_fraction
            or self.mention_fraction >= THRESHOLDS.gate_mention_fraction
        )


def credential_signal(forms: PageForms, evidence: BrandEvidence) -> Signal:
    if not forms.has_password_field:
        return _signal("credential_form", 0.0, 0.0, "The page does not ask for a password.")
    if not evidence.present:
        detail = (
            "The page asks for a password, but nothing else points to your brand, "
            "so this alone is not counted as suspicious."
        )
        return _signal("credential_form", 1.0, 0.0, detail)
    detail = "The page asks for a password, and it appears to imitate your brand."
    if forms.submits_to_other_domain:
        detail += " What you type is sent to a different website."
    return _signal("credential_form", 1.0, 1.0, detail)


def payment_signal(forms: PageForms, evidence: BrandEvidence) -> Signal:
    if not forms.has_payment_field:
        return _signal(
            "payment_form", 0.0, 0.0, "The page does not ask for card or payment details."
        )
    if not evidence.present:
        detail = (
            "The page asks for card or payment details, but nothing else points to your brand, "
            "so this alone is not counted as suspicious."
        )
        return _signal("payment_form", 1.0, 0.0, detail)
    detail = "The page asks for card or payment details, and it appears to imitate your brand."
    if forms.submits_to_other_domain:
        detail += " What you type is sent to a different website."
    return _signal("payment_form", 1.0, 1.0, detail)


def _age_days(moment: datetime, now: datetime) -> int:
    return max(0, (_utc(now) - _utc(moment)).days)


def new_domain_signal(registered_at: datetime, now: datetime) -> Signal:
    days = _age_days(registered_at, now)
    fraction = 1.0 - days / THRESHOLDS.new_domain_days if days < THRESHOLDS.new_domain_days else 0.0
    return _signal(
        "new_domain", fraction, fraction, f"The domain was registered {describe_age(days)}."
    )


def new_certificate_signal(issued_at: datetime, now: datetime) -> Signal:
    days = _age_days(issued_at, now)
    limit = THRESHOLDS.new_certificate_days
    fraction = 1.0 - days / limit if days < limit else 0.0
    return _signal(
        "new_certificate",
        fraction,
        fraction,
        f"The website's security certificate was issued {describe_age(days)}.",
    )


# --- assembling the answer ---------------------------------------------------------------
def assemble(
    signals: list[Signal],
    unavailable: list[SignalId],
    *,
    ocr_text: str,
    logo_match: LogoMatch | None,
    models: ModelNames,
) -> AnalyseResponse:
    """Order the signals, add up the score and write the reasons (highest points first)."""
    ordered = sorted(signals, key=lambda signal: SIGNAL_ORDER.index(signal.id))
    score = min(100, sum(signal.points for signal in ordered))
    # sorted() is stable, so equal points keep the display order above.
    by_points = sorted((s for s in ordered if s.points > 0), key=lambda s: -s.points)
    return AnalyseResponse(
        model_version=MODEL_VERSION,
        score=score,
        level=level_for(score),
        signals=ordered,
        reasons=[signal.detail for signal in by_points],
        unavailable=sorted(unavailable, key=SIGNAL_ORDER.index),
        ocr_text=ocr_text,
        logo_match=logo_match,
        models=models,
    )

"""Logo comparison: perceptual hashes on generated images; CLIP is replaced by a fake."""

import io

import pytest
from PIL import Image, ImageOps

from app.analysis.logos import (
    compare_logos,
    phash_distance,
    prepare,
    screenshot_tiles,
)
from app.analysis.scoring import THRESHOLDS
from tests.helpers import FakeRegistry, make_logo, make_noise, make_screenshot


def _jpeg_round_trip(image: Image.Image, quality: int = 45) -> Image.Image:
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=quality)
    return Image.open(io.BytesIO(buffer.getvalue())).convert("RGB")


def _distance(left: Image.Image, right: Image.Image) -> int:
    prepared_left, prepared_right = prepare(left), prepare(right)
    assert prepared_left is not None
    assert prepared_right is not None
    return phash_distance(prepared_left, prepared_right)


NEAR = THRESHOLDS.phash_near_identical_distance


def test_identical_image_has_distance_zero() -> None:
    assert _distance(make_logo(), make_logo()) == 0


def test_recoloured_image_is_near_identical() -> None:
    assert _distance(make_logo(), make_logo(fg=(200, 40, 40))) <= NEAR


def test_dark_mode_version_is_near_identical() -> None:
    # Same logo, colours swapped (light mark on dark background): still found.
    dark = make_logo(fg=(255, 255, 255), bg=(20, 20, 30))
    assert _distance(make_logo(fg=(20, 20, 30), bg=(255, 255, 255)), dark) <= NEAR
    assert _distance(make_logo(), ImageOps.invert(make_logo())) <= NEAR


def test_resized_and_recompressed_image_is_near_identical() -> None:
    original = make_logo()
    assert _distance(original, original.resize((96, 96))) <= NEAR
    assert _distance(original, _jpeg_round_trip(original)) <= NEAR


def test_padding_around_the_logo_does_not_matter() -> None:
    padded = Image.new("RGB", (400, 300), (255, 255, 255))
    padded.paste(make_logo(), (80, 30))
    assert _distance(make_logo(), padded) <= NEAR


@pytest.mark.parametrize(
    "other",
    [
        make_logo("ZED", shape="triangle", fg=(200, 120, 0)),
        make_logo("PAYLY", shape="square", fg=(240, 160, 0)),
        make_noise((240, 240)),
    ],
)
def test_unrelated_images_are_far_apart(other: Image.Image) -> None:
    assert _distance(make_logo(), other) > 20


def test_blank_and_tiny_images_cannot_be_compared() -> None:
    assert prepare(Image.new("RGB", (200, 200), (255, 255, 255))) is None
    assert prepare(Image.new("RGB", (5, 5), (0, 0, 0))) is None
    assert prepare(make_logo()) is not None


# --- compare_logos ------------------------------------------------------------------------------
def test_identical_page_logo_is_found_by_hash_without_running_clip() -> None:
    registry = FakeRegistry()
    result = compare_logos(
        registry,
        [("brand-logo", make_logo())],
        [("image", make_noise()), ("logo", make_logo())],
        screenshot=None,
    )
    assert result is not None
    assert result.best is not None
    assert (result.best.logo_id, result.best.source, result.best.method) == (
        "brand-logo",
        "logo",
        "phash",
    )
    assert result.best.similarity == 1.0
    assert result.best.fraction == 1.0
    assert registry.image_calls == 0  # the expensive model was not needed


def test_recoloured_favicon_is_reported_with_its_source() -> None:
    result = compare_logos(
        FakeRegistry(),
        [("a", make_logo())],
        [("favicon", make_logo(fg=(200, 40, 40)).resize((32, 32)))],
        screenshot=None,
    )
    assert result is not None
    assert result.best is not None
    assert result.best.source == "favicon"
    assert result.best.method == "phash"


def test_best_of_several_brand_logos_is_named() -> None:
    result = compare_logos(
        FakeRegistry(),
        [("a", make_logo("ZED", shape="triangle")), ("b", make_logo())],
        [("logo", make_logo(fg=(10, 150, 60)))],
        screenshot=None,
    )
    assert result is not None
    assert result.best is not None
    assert result.best.logo_id == "b"


def test_logo_drawn_in_the_screenshot_header_is_found_in_a_tile() -> None:
    shot = make_screenshot(header_logo=make_logo(), lines=("Sign in",))
    result = compare_logos(FakeRegistry(), [("a", make_logo())], [], screenshot=shot)
    assert result is not None
    assert result.best is not None
    assert result.best.source == "screenshot"


def test_unrelated_page_has_no_match_and_a_value() -> None:
    shot = make_screenshot(header_logo=make_logo("ZED", shape="triangle", fg=(200, 120, 0)))
    registry = FakeRegistry()
    result = compare_logos(
        registry, [("a", make_logo())], [("image", make_noise())], screenshot=shot
    )
    assert result is not None
    assert result.best is None
    assert result.compared > 1
    assert registry.image_calls == 1  # no hash match, so CLIP (fake here) ran once for everything


def test_clip_match_is_used_when_hashes_do_not_match(monkeypatch: pytest.MonkeyPatch) -> None:
    class SimilarClip(FakeRegistry):
        def embed_images(self, images: list[Image.Image]) -> list[list[float]]:
            self.image_calls += 1
            # logo 0 and the first candidate point the same way, the others elsewhere
            return [[1.0, 0.0]] + [[0.96, 0.28]] + [[0.0, 1.0]] * (len(images) - 2)

    registry = SimilarClip()
    result = compare_logos(
        registry,
        [("a", make_logo())],
        [("image", make_logo("ZED", shape="triangle", fg=(200, 120, 0))), ("logo", make_noise())],
        screenshot=None,
    )
    assert result is not None
    assert result.best is not None
    assert (result.best.method, result.best.source) == ("clip", "image")
    assert result.best.similarity == pytest.approx(0.96, abs=0.01)
    assert 0 < result.best.fraction <= THRESHOLDS.clip_max_fraction


def test_clip_failure_without_a_hash_match_is_reported() -> None:
    result = compare_logos(
        FakeRegistry(fail={"image"}),
        [("a", make_logo())],
        [("image", make_noise())],
        screenshot=None,
    )
    assert result is not None
    assert result.clip_failed is True
    assert result.best is None


def test_clip_failure_keeps_a_hash_match() -> None:
    # A near-identical copy needs no CLIP at all, so a broken CLIP model changes nothing.
    result = compare_logos(
        FakeRegistry(fail={"image"}),
        [("a", make_logo())],
        [("logo", make_logo())],
        screenshot=None,
    )
    assert result is not None
    assert result.best is not None
    assert result.clip_failed is False


def test_no_usable_brand_logo_means_no_comparison() -> None:
    blank = Image.new("RGB", (100, 100), (255, 255, 255))
    assert compare_logos(FakeRegistry(), [], [("logo", make_logo())], None) is None
    assert compare_logos(FakeRegistry(), [("a", blank)], [("logo", make_logo())], None) is None


def test_page_without_images_or_logo_like_areas_compares_nothing() -> None:
    blank_page = Image.new("RGB", (1280, 800), (255, 255, 255))
    result = compare_logos(FakeRegistry(), [("a", make_logo())], [], blank_page)
    assert result is not None
    assert result.best is None
    assert result.compared == 0


def test_screenshot_tiles_come_from_the_top_band_only() -> None:
    shot = Image.new("RGB", (1280, 800), (255, 255, 255))
    tiles = screenshot_tiles(shot)
    assert 8 <= len(tiles) <= THRESHOLDS.max_tiles
    assert all(tile.height <= 800 * THRESHOLDS.tile_band_fraction + 1 for tile in tiles)
    assert all(tile.width <= 1280 for tile in tiles)


def test_small_screenshots_do_not_break_tiling() -> None:
    assert screenshot_tiles(Image.new("RGB", (100, 60), (255, 255, 255)))


@pytest.mark.parametrize("size", [16, 32, 48, 64, 96, 160])
def test_small_copies_such_as_favicons_still_match(size: int) -> None:
    # The soft edge of a shape must not move the crop box and change the hash.
    assert _distance(make_logo(), make_logo(fg=(200, 40, 40)).resize((size, size))) <= NEAR


def test_pale_logos_are_not_cropped_away() -> None:
    pale = make_logo(fg=(255, 235, 60))
    prepared = prepare(pale)
    assert prepared is not None
    assert prepared.width > 150

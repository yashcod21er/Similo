"""Logo comparison between the brand's logos and the images found on a suspect page.

Two methods, from strict to loose:

1. Perceptual hashes (``phash``): pHash and dHash of the grayscale image (and of the brand
   logo's colour-inverted copy, because dark-mode logos are common). A pair is "near
   identical" when the average of the two hash distances is small. This is cheap and very
   precise, but only catches copies (resized, re-compressed, recoloured), not look-alikes.
2. CLIP (``clip``): cosine similarity of CLIP ViT-B/32 image embeddings. This also catches
   re-drawn or slightly altered logos, but is less precise (it measures "looks alike"), so it
   needs a high similarity before it scores.

What we compare against:
- every favicon / logo / other image the capture found on the page, and
- tiles cut from the top band of the screenshot (where site logos normally sit), because many
  look-alike pages draw the logo in a way the capture does not list as an image.

Known limits (also in the README): a logo drawn inside a big hero image, a logo that is
mostly text, or a tile that cuts a logo in half can be missed or matched only weakly.
"""

import logging
from dataclasses import dataclass

import imagehash
import numpy as np
from PIL import Image, ImageOps, ImageStat

from app.analysis.images import autocrop, pad_to_square
from app.analysis.models import LogoMethod, LogoSource
from app.analysis.models_loader import ModelRegistry, ModelUnavailableError
from app.analysis.scoring import THRESHOLDS, logo_fraction

logger = logging.getLogger("similo.ai.logos")

MIN_SIDE_PIXELS = 8  # smaller images carry too little detail to compare
BLANK_STDDEV = 3.0  # (0-255) a grayscale image flatter than this has no logo in it


@dataclass(frozen=True)
class LogoHit:
    logo_id: str
    source: LogoSource
    similarity: float  # 0..1 (phash: 1 - distance/64; clip: cosine)
    method: LogoMethod
    fraction: float  # share of the signal's points this hit earns (0..1)


@dataclass(frozen=True)
class LogoComparison:
    best: LogoHit | None  # best hit that earns points (None = nothing resembles a brand logo)
    value: float  # similarity of the closest pair we measured (0 when nothing comparable)
    method: LogoMethod | None  # method behind ``value``
    compared: int  # number of page images/tiles compared
    clip_failed: bool = False


@dataclass(frozen=True)
class _Item:
    key: str  # logo id (brand side) or "" (page side)
    source: LogoSource
    image: Image.Image


def prepare(image: Image.Image) -> Image.Image | None:
    """Trim padding; return None when the image is too small or blank to compare."""
    cropped = autocrop(image)
    if cropped.width < MIN_SIDE_PIXELS or cropped.height < MIN_SIDE_PIXELS:
        return None
    if ImageStat.Stat(cropped.convert("L")).stddev[0] < BLANK_STDDEV:
        return None
    return cropped


def screenshot_tiles(screenshot: Image.Image) -> list[Image.Image]:
    """Cut overlapping tiles from the top band of the screenshot, where logos usually are."""
    width, height = screenshot.size
    band = max(MIN_SIDE_PIXELS, int(height * THRESHOLDS.tile_band_fraction))
    band = min(band, height)
    tiles: list[Image.Image] = []
    # Square-ish tiles for icon logos and wide tiles (3:1) for logo + wordmark.
    for tile_width in (band, band * 3):
        tile_width = min(tile_width, width)
        stride = max(1, int(tile_width * 0.75))
        left = 0
        while left + tile_width <= width:
            tiles.append(screenshot.crop((left, 0, left + tile_width, band)))
            left += stride
        if left - stride + tile_width < width:  # make sure the right edge is covered
            tiles.append(screenshot.crop((width - tile_width, 0, width, band)))
    return tiles[: THRESHOLDS.max_tiles]


def _hashes(image: Image.Image) -> tuple[imagehash.ImageHash, imagehash.ImageHash]:
    return imagehash.phash(image), imagehash.dhash(image)


def _hash_distance(
    left: tuple[imagehash.ImageHash, imagehash.ImageHash],
    right: tuple[imagehash.ImageHash, imagehash.ImageHash],
) -> int:
    # pHash is steadier for recoloured images, dHash for resized ones; each fails on some flat
    # logos. The pair's distance is their rounded-up average, so one unlucky hash cannot
    # hide a copy and neither alone can create a match.
    return (int(left[0] - right[0]) + int(left[1] - right[1]) + 1) // 2


def phash_distance(logo: Image.Image, other: Image.Image) -> int:
    """Smallest hash distance between ``other`` and ``logo`` or its colour-inverted copy."""
    other_hashes = _hashes(other)
    return min(
        _hash_distance(_hashes(logo), other_hashes),
        _hash_distance(_hashes(ImageOps.invert(logo)), other_hashes),
    )


def _clip_vectors(registry: ModelRegistry, images: list[Image.Image]) -> np.ndarray:
    vectors = registry.embed_images([pad_to_square(image) for image in images])
    matrix = np.asarray(vectors, dtype=np.float32)
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    return matrix / np.where(norms == 0, 1, norms)


def compare_logos(
    registry: ModelRegistry,
    brand_logos: list[tuple[str, Image.Image]],
    page_images: list[tuple[LogoSource, Image.Image]],
    screenshot: Image.Image | None,
) -> LogoComparison | None:
    """Compare brand logos with page images and screenshot tiles.

    Returns None when there are no usable brand logos (the signal is then unavailable).
    """
    logos = [
        _Item(logo_id, "logo", prepared)
        for logo_id, image in brand_logos
        if (prepared := prepare(image)) is not None
    ]
    if not logos:
        return None

    candidates = [
        _Item("", source, prepared)
        for source, image in page_images
        if (prepared := prepare(image)) is not None
    ]
    if screenshot is not None:
        candidates += [
            _Item("", "screenshot", prepared)
            for tile in screenshot_tiles(screenshot)
            if (prepared := prepare(tile)) is not None
        ]
    if not candidates:
        return LogoComparison(best=None, value=0.0, method=None, compared=0)

    best: LogoHit | None = None
    closest_phash = 0.0

    # Step 1: perceptual hashes (cheap). Computed once per image, inverted logos once per logo.
    candidate_hashes = [_hashes(item.image) for item in candidates]
    for logo in logos:
        normal = _hashes(logo.image)
        inverted = _hashes(ImageOps.invert(logo.image))
        for item, hashes in zip(candidates, candidate_hashes, strict=True):
            distance = min(_hash_distance(normal, hashes), _hash_distance(inverted, hashes))
            similarity = max(0.0, 1.0 - distance / 64)
            closest_phash = max(closest_phash, similarity)
            fraction = logo_fraction("phash", similarity, distance)
            if fraction > 0 and (best is None or fraction > best.fraction):
                best = LogoHit(logo.key, item.source, similarity, "phash", fraction)

    count = len(candidates)
    if best is not None and best.fraction >= THRESHOLDS.skip_clip_when_fraction_at_least:
        return LogoComparison(best, best.similarity, "phash", count)

    # Step 2: CLIP embeddings (slower, catches look-alikes that are not exact copies).
    try:
        matrix = _clip_vectors(registry, [item.image for item in logos + candidates])
    except Exception as error:  # noqa: BLE001 - a broken model must not fail the request
        if not isinstance(error, ModelUnavailableError):
            logger.error("CLIP comparison failed (%s)", type(error).__name__)
        if best is not None:  # a hash match is still a valid (partial) answer
            return LogoComparison(best, best.similarity, "phash", count, clip_failed=True)
        return LogoComparison(None, closest_phash, "phash", count, clip_failed=True)

    logo_matrix, candidate_matrix = matrix[: len(logos)], matrix[len(logos) :]
    similarities = np.clip(logo_matrix @ candidate_matrix.T, 0.0, 1.0)
    for logo_index, logo in enumerate(logos):
        for candidate_index, item in enumerate(candidates):
            similarity = float(similarities[logo_index, candidate_index])
            fraction = logo_fraction("clip", similarity)
            if fraction > 0 and (best is None or fraction > best.fraction):
                best = LogoHit(logo.key, item.source, similarity, "clip", fraction)

    if best is not None:
        return LogoComparison(best, best.similarity, best.method, count)
    return LogoComparison(None, float(similarities.max()), "clip", count)

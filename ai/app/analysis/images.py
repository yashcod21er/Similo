"""Safe image decoding. Images come from strangers' websites, so treat them as hostile.

Rules (Phase 6 brief):
- Pillow only, never any other decoder; accepted formats are PNG, JPEG, WebP, ICO and GIF.
- The format is decided from the file's first bytes (not from a name or content type).
  SVG, HTML and everything else are refused.
- ``Image.MAX_IMAGE_PIXELS`` is 40 million. Pillow only warns up to twice that, so we refuse
  anything above the limit ourselves, from the header, before decoding the pixels.
- GIFs use their first frame. Every image ends up as plain RGB (transparency is placed on
  white), so later steps never deal with modes.
- Nothing is logged or stored; error messages never contain image data.
"""

import base64
import binascii
import io
import warnings

from PIL import Image, ImageChops, UnidentifiedImageError

MAX_IMAGE_PIXELS = 40_000_000
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

ALLOWED_FORMATS = ("PNG", "JPEG", "WEBP", "ICO", "GIF")


class ImageRejected(ValueError):
    """The image is unusable or unsafe. The message is plain English and holds no image data."""


def _strip_data_url(value: str) -> str:
    value = value.strip()
    if value.startswith("data:"):
        _, _, value = value.partition(",")
    return value


def decode_base64(value: str) -> bytes:
    cleaned = "".join(_strip_data_url(value).split())
    try:
        return base64.b64decode(cleaned, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ImageRejected("The image is not valid base64.") from error


def sniff_format(data: bytes) -> str | None:
    """Return PNG/JPEG/WEBP/ICO/GIF from the first bytes, or None for anything else."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "PNG"
    if data.startswith(b"\xff\xd8\xff"):
        return "JPEG"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "WEBP"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "GIF"
    if data[:4] == b"\x00\x00\x01\x00":
        return "ICO"
    return None


def to_rgb(image: Image.Image) -> Image.Image:
    """Convert any Pillow mode to RGB, placing transparent areas on white."""
    if image.mode == "RGB":
        return image
    if image.mode in ("RGBA", "LA", "PA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        return Image.alpha_composite(background, rgba).convert("RGB")
    return image.convert("RGB")


def decode_image_bytes(data: bytes, max_side: int | None = None) -> Image.Image:
    """Decode raw bytes into an RGB image, or raise ImageRejected.

    ``max_side`` shrinks big images right after decoding (JPEGs are decoded at reduced size),
    which keeps memory and time bounded even for images near the pixel limit.
    """
    detected = sniff_format(data)
    if detected is None:
        raise ImageRejected("The file is not a PNG, JPEG, WebP, ICO or GIF image.")
    try:
        with warnings.catch_warnings():
            # Pillow only warns between the limit and twice the limit; we refuse those too.
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            image = Image.open(io.BytesIO(data), formats=list(ALLOWED_FORMATS))
            width, height = image.size
            if width < 1 or height < 1 or width * height > MAX_IMAGE_PIXELS:
                raise ImageRejected("The image is too large.")
            image.seek(0)  # animated GIF/WebP: first frame only
            if max_side and image.format == "JPEG":
                image.draft("RGB", (max_side, max_side))
            image.load()
            rgb = to_rgb(image)
            if max_side and max(rgb.size) > max_side:
                rgb.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
            return rgb
    except ImageRejected:
        raise
    except Image.DecompressionBombError as error:
        raise ImageRejected("The image is too large.") from error
    except Image.DecompressionBombWarning as error:
        raise ImageRejected("The image is too large.") from error
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, EOFError) as error:
        raise ImageRejected("The image could not be read.") from error


def decode_image(value: str, max_side: int | None = None) -> Image.Image:
    """Decode a base64 string (optionally a data: URL) into an RGB image."""
    return decode_image_bytes(decode_base64(value), max_side)


def try_decode_image(value: str | None, max_side: int | None = None) -> Image.Image | None:
    """Like decode_image, but returns None instead of raising (used to skip bad images)."""
    if not value:
        return None
    try:
        return decode_image(value, max_side)
    except ImageRejected:
        return None


def autocrop(image: Image.Image, tolerance: int = 24, min_side: int = 4) -> Image.Image:
    """Cut away a uniform border (typically white padding around a logo).

    The cut-off is the larger of ``tolerance`` and 40 % of the strongest difference from the
    border colour. The relative part ignores the soft anti-aliased edge of a shape, which would
    otherwise move the crop box by a pixel or two on a small copy (a 32 px favicon) and make
    the same logo hash differently.
    """
    if image.width < 2 or image.height < 2:
        return image
    border = image.getpixel((0, 0))
    background = Image.new("RGB", image.size, border)  # type: ignore[arg-type]
    difference = ImageChops.difference(image, background).convert("L")
    cutoff = max(tolerance, int(0.4 * difference.getextrema()[1]))
    mask = difference.point(lambda value: 255 if value > cutoff else 0)
    box = mask.getbbox()
    if box is None:
        return image
    left, top, right, bottom = box
    if right - left < min_side or bottom - top < min_side:
        return image
    return image.crop(box)


def pad_to_square(image: Image.Image) -> Image.Image:
    """Pad to a square using the border colour, so CLIP's centre-crop never cuts a wide logo."""
    width, height = image.size
    side = max(width, height)
    if width == height:
        return image
    fill = image.getpixel((0, 0))
    canvas = Image.new("RGB", (side, side), fill)  # type: ignore[arg-type]
    canvas.paste(image, ((side - width) // 2, (side - height) // 2))
    return canvas

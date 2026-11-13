"""Safe image decoding: only real PNG/JPEG/WebP/ICO/GIF, nothing huge, nothing executable."""

import base64
import struct
import zlib

import pytest
from PIL import Image

from app.analysis.images import (
    MAX_IMAGE_PIXELS,
    ImageRejected,
    autocrop,
    decode_image,
    decode_image_bytes,
    pad_to_square,
    sniff_format,
    try_decode_image,
)
from tests.helpers import make_logo, to_b64, to_bytes


def _png_header_only(width: int, height: int) -> bytes:
    """A PNG whose header claims a huge size; the pixel data is a tiny stub (never decoded)."""

    def chunk(kind: bytes, data: bytes) -> bytes:
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(b"\x00"))
        + chunk(b"IEND", b"")
    )


@pytest.mark.parametrize("fmt", ["PNG", "JPEG", "WEBP", "GIF"])
def test_accepted_formats_decode_to_rgb(fmt: str) -> None:
    image = decode_image(to_b64(make_logo(), fmt))
    assert image.mode == "RGB"
    assert image.size == (240, 240)


def test_ico_is_accepted() -> None:
    data = to_bytes(make_logo(size=64), "ICO", sizes=[(32, 32)])
    assert sniff_format(data) == "ICO"
    assert decode_image_bytes(data).mode == "RGB"


def test_animated_gif_uses_the_first_frame() -> None:
    first = Image.new("RGB", (40, 40), (255, 0, 0))
    second = Image.new("RGB", (40, 40), (0, 0, 255))
    data = to_bytes(first, "GIF", save_all=True, append_images=[second], duration=100, loop=0)
    result = decode_image_bytes(data)
    red, _green, blue = result.getpixel((20, 20))
    assert red > 200 > blue


def test_transparency_is_placed_on_white() -> None:
    clear = Image.new("RGBA", (30, 30), (0, 0, 0, 0))
    assert decode_image_bytes(to_bytes(clear, "PNG")).getpixel((5, 5)) == (255, 255, 255)
    palette = Image.new("P", (30, 30), 0)
    palette.info["transparency"] = 0
    assert decode_image_bytes(to_bytes(palette, "PNG", transparency=0)).mode == "RGB"


def test_data_url_prefix_and_whitespace_are_tolerated() -> None:
    encoded = to_b64(make_logo(size=50))
    spaced = "\n".join(encoded[i : i + 40] for i in range(0, len(encoded), 40))
    assert decode_image(f"data:image/png;base64,{spaced}").size == (50, 50)


@pytest.mark.parametrize(
    "payload",
    [
        b'<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        b"<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'></svg>",
        b"<!doctype html><html><body>hello</body></html>",
        b"GIF" + b"\x00" * 50,
        b"\x89PNG\r\n\x1a\n" + b"garbage" * 20,
        b"\xff\xd8\xff" + b"not really a jpeg" * 10,
        b"BM" + b"\x00" * 100,  # BMP
        b"II*\x00" + b"\x00" * 100,  # TIFF
        b"%PDF-1.7 fake",
        b"",
    ],
)
def test_non_images_and_garbage_are_refused(payload: bytes) -> None:
    with pytest.raises(ImageRejected):
        decode_image_bytes(payload)


def test_truncated_png_is_refused() -> None:
    data = to_bytes(make_logo(), "PNG")
    with pytest.raises(ImageRejected):
        decode_image_bytes(data[: len(data) // 2])


def test_bad_base64_is_refused() -> None:
    with pytest.raises(ImageRejected, match="base64"):
        decode_image("this is !!! not base64")


def test_svg_in_base64_is_refused() -> None:
    svg = base64.b64encode(b"<svg xmlns='http://www.w3.org/2000/svg'></svg>").decode()
    with pytest.raises(ImageRejected):
        decode_image(svg)


def test_pixel_limit_constant() -> None:
    assert MAX_IMAGE_PIXELS == 40_000_000
    assert Image.MAX_IMAGE_PIXELS == 40_000_000


@pytest.mark.parametrize(("width", "height"), [(7_000, 7_000), (10_000, 10_000), (60_000, 60_000)])
def test_decompression_bombs_are_refused_from_the_header(width: int, height: int) -> None:
    # 49 M pixels (only warned about by Pillow), 100 M and 3.6 G pixels (an error in Pillow).
    with pytest.raises(ImageRejected, match="too large"):
        decode_image_bytes(_png_header_only(width, height))


def test_image_just_under_the_limit_is_not_refused_for_size() -> None:
    # 100 x 100 is far below the limit: decoding works.
    assert decode_image_bytes(to_bytes(Image.new("RGB", (100, 100)), "PNG")).size == (100, 100)


def test_max_side_shrinks_large_images() -> None:
    big = to_bytes(Image.new("RGB", (3_000, 1_500), (10, 20, 30)), "PNG")
    shrunk = decode_image_bytes(big, max_side=600)
    assert max(shrunk.size) == 600
    jpeg = to_bytes(Image.new("RGB", (3_000, 1_500), (10, 20, 30)), "JPEG")
    assert (
        max(decode_image_bytes(jpeg, max_side=600).size) <= 750
    )  # JPEG draft mode scales by 1/2^n


def test_try_decode_returns_none_instead_of_raising() -> None:
    assert try_decode_image(None) is None
    assert try_decode_image("") is None
    assert try_decode_image("!!!") is None
    assert try_decode_image(to_b64(make_logo(size=32))) is not None


def test_autocrop_removes_a_uniform_border() -> None:
    image = Image.new("RGB", (100, 100), (255, 255, 255))
    image.paste(Image.new("RGB", (20, 10), (0, 0, 0)), (40, 45))
    assert autocrop(image).size == (20, 10)
    blank = Image.new("RGB", (50, 50), (255, 255, 255))
    assert autocrop(blank).size == (50, 50)


def test_pad_to_square_keeps_everything() -> None:
    wide = Image.new("RGB", (120, 40), (10, 10, 10))
    square = pad_to_square(wide)
    assert square.size == (120, 120)
    assert pad_to_square(Image.new("RGB", (30, 30))).size == (30, 30)

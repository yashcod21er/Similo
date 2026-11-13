"""Draw fictional logos with Pillow and make the altered copies a look-alike site might use.

Everything here is made from simple shapes and the default Pillow font. None of it imitates a
real company's logo.
"""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

SCALE = 4  # draw 4x bigger, then shrink for smooth edges


def hex_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.load_default(size=size)


def _shape(draw: ImageDraw.ImageDraw, x: float, y: float, s: float, spec: dict) -> None:
    """Draw one icon shape inside the square at (x, y) with side s."""
    color, accent, shape, letter = spec["color"], spec["accent"], spec["shape"], spec["letter"]

    def p(px: float, py: float) -> tuple[float, float]:
        return x + px * s, y + py * s

    letter_y = 0.5
    if shape == "shield":
        draw.polygon(
            [p(0.14, 0.08), p(0.86, 0.08), p(0.86, 0.55), p(0.5, 0.94), p(0.14, 0.55)], fill=color
        )
        letter_y = 0.45
    elif shape == "circle":
        draw.ellipse([p(0.06, 0.06), p(0.94, 0.94)], fill=color)
    elif shape == "triangle":
        draw.polygon([p(0.5, 0.06), p(0.96, 0.9), p(0.04, 0.9)], fill=color)
        letter_y = 0.64
    elif shape == "hexagon":
        draw.polygon(
            [
                p(0.25, 0.07),
                p(0.75, 0.07),
                p(0.97, 0.5),
                p(0.75, 0.93),
                p(0.25, 0.93),
                p(0.03, 0.5),
            ],
            fill=color,
        )
    elif shape == "diamond":
        draw.polygon([p(0.5, 0.04), p(0.96, 0.5), p(0.5, 0.96), p(0.04, 0.5)], fill=color)
    elif shape == "cloud":
        draw.ellipse([p(0.04, 0.42), p(0.44, 0.82)], fill=color)
        draw.ellipse([p(0.22, 0.16), p(0.68, 0.7)], fill=color)
        draw.ellipse([p(0.48, 0.3), p(0.96, 0.82)], fill=color)
        draw.rounded_rectangle([p(0.2, 0.5), p(0.8, 0.82)], radius=s * 0.1, fill=color)
        letter = ""
    elif shape == "orbit":
        draw.ellipse([p(0.06, 0.06), p(0.94, 0.94)], outline=color, width=int(0.14 * s))
        draw.ellipse([p(0.34, 0.34), p(0.66, 0.66)], fill=accent)
        letter = ""
    elif shape == "plane":
        draw.polygon([p(0.04, 0.52), p(0.96, 0.1), p(0.7, 0.92), p(0.5, 0.6)], fill=color)
        draw.polygon([p(0.5, 0.6), p(0.96, 0.1), p(0.38, 0.5)], fill=accent)
        letter = ""
    elif shape == "rounded":
        draw.rounded_rectangle([p(0.06, 0.06), p(0.94, 0.94)], radius=s * 0.22, fill=color)
    else:
        raise ValueError(f"unknown shape {shape}")
    if letter:
        draw.text(p(0.5, letter_y), letter, font=font(int(0.52 * s)), fill="white", anchor="mm")


def draw_icon(spec: dict, size: int = 256, transparent: bool = True) -> Image.Image:
    """Square icon: the brand shape with its letter."""
    bg = (255, 255, 255, 0) if transparent else (255, 255, 255, 255)
    img = Image.new("RGBA", (size * SCALE, size * SCALE), bg)
    _shape(ImageDraw.Draw(img), 0, 0, size * SCALE, spec)
    return img.resize((size, size), Image.LANCZOS)


def draw_wordmark(spec: dict, text: str | None = None, height: int = 200) -> Image.Image:
    """Opaque white logo: icon on the left, the brand name on the right."""
    text = text or spec["name"]
    big = height * SCALE
    probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    text_font = font(int(0.34 * big))
    width = int(probe.textlength(text, font=text_font)) + int(0.22 * big) + int(0.95 * big)
    img = Image.new("RGBA", (width, big), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    _shape(draw, 0.1 * big, 0.1 * big, 0.8 * big, spec)
    draw.text((1.0 * big, big / 2), text, font=text_font, fill=spec["ink"], anchor="lm")
    return img.resize((width // SCALE, height), Image.LANCZOS)


def text_banner(text: str, fg: str, bg: str, size: tuple[int, int] = (1000, 150)) -> Image.Image:
    """A heading rendered as pixels, so only OCR can read the words (shrunk to fit the width)."""
    img = Image.new("RGB", size, hex_rgb(bg))
    draw = ImageDraw.Draw(img)
    pixels = int(size[1] * 0.5)
    while pixels > 12 and draw.textlength(text, font=font(pixels)) > size[0] * 0.9:
        pixels -= 2
    draw.text((size[0] // 2, size[1] // 2), text, font=font(pixels), fill=hex_rgb(fg), anchor="mm")
    return img


# ----- copies and alterations a look-alike site might use -----


def on_white(img: Image.Image) -> Image.Image:
    """Flatten any transparency onto white."""
    rgba = img.convert("RGBA")
    base = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    base.alpha_composite(rgba)
    return base.convert("RGB")


def recolour(img: Image.Image, target: str) -> Image.Image:
    """Keep the shapes but tint them with another colour."""
    rgba = img.convert("RGBA")
    alpha = rgba.getchannel("A")
    gray = ImageOps.grayscale(on_white(rgba))
    tinted = ImageOps.colorize(gray, black=(20, 20, 20), white="white", mid=hex_rgb(target))
    out = tinted.convert("RGBA")
    out.putalpha(alpha)
    return out


def scale_by(img: Image.Image, factor: float, stretch: float = 1.0) -> Image.Image:
    width = max(8, int(img.width * factor * stretch))
    height = max(8, int(img.height * factor))
    return img.resize((width, height), Image.LANCZOS)


def alter(img: Image.Image, kind: str) -> Image.Image:
    """Small edits so the copy is not byte-identical."""
    flat = on_white(img)
    if kind == "rotate":
        return flat.rotate(6, expand=True, fillcolor=(255, 255, 255), resample=Image.BICUBIC)
    if kind == "crop-blur":
        w, h = flat.size
        cropped = flat.crop((int(w * 0.06), 0, w, int(h * 0.9))).filter(
            ImageFilter.GaussianBlur(1.2)
        )
        buffer = io.BytesIO()
        cropped.save(buffer, "JPEG", quality=35)
        return Image.open(io.BytesIO(buffer.getvalue())).convert("RGB")
    raise ValueError(f"unknown alteration {kind}")


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def login_screenshot_image(
    spec: dict, logo: Image.Image, title: str, logo_y: int = 110
) -> Image.Image:
    """A flat picture of a sign-in screen (used for 'the whole page is one image' cases)."""
    canvas = Image.new("RGB", (1280, 800), (238, 241, 245))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        [380, min(70, logo_y - 30), 900, 740], radius=18, fill="white", outline=(210, 214, 220)
    )
    mark = on_white(scale_by(logo, 330 / logo.width))
    canvas.paste(mark, (640 - mark.width // 2, logo_y))
    draw.text((640, 270), title, font=font(30), fill=hex_rgb(spec["ink"]), anchor="mm")
    for i, label in enumerate(("Email address", "Password")):
        top = 330 + i * 120
        draw.text((420, top), label, font=font(20), fill=(90, 98, 110), anchor="lm")
        draw.rounded_rectangle([420, top + 18, 860, top + 70], radius=8, outline=(180, 186, 195))
    draw.rounded_rectangle([420, 580, 860, 640], radius=10, fill=hex_rgb(spec["color"]))
    draw.text((640, 610), "Sign in", font=font(26), fill="white", anchor="mm")
    return canvas

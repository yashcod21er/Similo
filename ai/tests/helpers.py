"""Test helpers: settings, generated images, request builders and fake models.

No test needs a real model (except the one marked ``slow``): the heavy models are replaced by
``FakeRegistry``, which is deterministic and instant.
"""

import base64
import io
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from app.analysis.models_loader import ModelUnavailableError
from app.config import Settings

TOKEN = "t" * 40  # a valid production-length token


def make_settings(**overrides: Any) -> Settings:
    """Settings for tests: never read .env, always a token unless overridden."""
    values: dict[str, Any] = {"environment": "test", "service_token": TOKEN}
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[call-arg]


# --- generated images --------------------------------------------------------------------
def make_logo(
    text: str = "ACME",
    *,
    bg: tuple[int, int, int] = (255, 255, 255),
    fg: tuple[int, int, int] = (20, 90, 200),
    shape: str = "circle",
    size: int = 240,
) -> Image.Image:
    """A simple invented logo: a coloured shape with a word in it."""
    image = Image.new("RGB", (size, size), bg)
    draw = ImageDraw.Draw(image)
    margin = size // 8
    if shape == "circle":
        draw.ellipse((margin, margin, size - margin, size - margin), fill=fg)
    elif shape == "square":
        draw.rectangle((margin, margin, size - margin, size - margin), fill=fg)
    else:
        draw.polygon(
            [(size // 2, margin), (size - margin, size - margin), (margin, size - margin)], fill=fg
        )
    font = ImageFont.load_default(size=size // 4)
    draw.text((size // 2, size // 2), text, fill=bg, font=font, anchor="mm")
    return image


def make_noise(size: tuple[int, int] = (300, 200), sigma: int = 80) -> Image.Image:
    return Image.effect_noise(size, sigma).convert("RGB")


def to_bytes(image: Image.Image, fmt: str = "PNG", **options: Any) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, fmt, **options)
    return buffer.getvalue()


def to_b64(image: Image.Image, fmt: str = "PNG", **options: Any) -> str:
    return base64.b64encode(to_bytes(image, fmt, **options)).decode()


def make_screenshot(
    *, header_logo: Image.Image | None = None, lines: tuple[str, ...] = ()
) -> Image.Image:
    """A 1280x800 fake page: a white header (with a logo at top left) and some text lines."""
    shot = Image.new("RGB", (1280, 800), (245, 247, 250))
    draw = ImageDraw.Draw(shot)
    draw.rectangle((0, 0, 1280, 110), fill=(255, 255, 255))
    if header_logo is not None:
        shot.paste(header_logo.resize((80, 80)), (40, 15))
    font = ImageFont.load_default(size=44)
    for index, line in enumerate(lines):
        draw.text((400, 300 + index * 70), line, fill=(20, 20, 20), font=font)
    return shot


# --- request builder ---------------------------------------------------------------------
def build_request(
    *,
    brand: dict[str, Any] | None = None,
    candidate: dict[str, Any] | None = None,
    page: dict[str, Any] | None | str = "default",
) -> dict[str, Any]:
    """A valid camelCase request body. Pass page=None for "site could not be captured"."""
    base_brand: dict[str, Any] = {
        "name": "Acme",
        "description": "",
        "keywords": [],
        "officialDomains": ["acme.com"],
        "logos": [],
    }
    base_page: dict[str, Any] = {
        "finalUrl": "https://acme-login.com/",
        "title": "",
        "text": "",
        "screenshotBase64": None,
        "images": [],
        "forms": {
            "hasPasswordField": False,
            "hasPaymentField": False,
            "submitsToOtherDomain": False,
        },
        "certificateIssuedAt": None,
    }
    if page == "default":
        chosen_page: dict[str, Any] | None = base_page
    elif page is None:
        chosen_page = None
    else:
        chosen_page = {**base_page, **page}  # type: ignore[dict-item]
    base_candidate: dict[str, Any] = {
        "domain": "acme-login.com",
        "domainScore": 82,
        "registeredAt": None,
        "page": chosen_page,
    }
    base_candidate.update(candidate or {})
    return {"brand": {**base_brand, **(brand or {})}, "candidate": base_candidate}


# --- fake models -------------------------------------------------------------------------
@dataclass
class OcrOutput:
    txts: tuple[str, ...] = ()
    scores: tuple[float, ...] = ()


@dataclass
class FakeRegistry:
    """Stands in for ModelRegistry: instant, deterministic, records how it was used."""

    ocr_lines: tuple[str, ...] = ()
    fail: set[str] = field(default_factory=set)  # any of: text, image, ocr
    image_calls: int = 0
    text_calls: int = 0
    ocr_calls: int = 0

    def _check(self, name: str) -> None:
        if name in self.fail:
            raise ModelUnavailableError(f"The {name} model is not available.")

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        self._check("text")
        self.text_calls += 1
        vectors = []
        for text in texts:  # a letter histogram: similar wording gives similar vectors
            vector = np.zeros(26, dtype=np.float32)
            for char in text.lower():
                if "a" <= char <= "z":
                    vector[ord(char) - 97] += 1
            vectors.append((vector / (np.linalg.norm(vector) or 1)).tolist())
        return vectors

    def embed_images(self, images: list[Image.Image]) -> list[list[float]]:
        self._check("image")
        self.image_calls += 1
        vectors = []
        for image in images:  # a 6x6 grayscale thumbnail
            small = np.asarray(image.convert("L").resize((6, 6)), dtype=np.float32).ravel()
            small = small - small.mean()
            vectors.append((small / (np.linalg.norm(small) or 1)).tolist())
        return vectors

    def run_ocr(self, image: Any) -> OcrOutput:
        self._check("ocr")
        self.ocr_calls += 1
        return OcrOutput(self.ocr_lines, tuple(0.95 for _ in self.ocr_lines))

    def status(self) -> dict[str, bool]:
        return {"text": True, "image": True, "ocr": True}

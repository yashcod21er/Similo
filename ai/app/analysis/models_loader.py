"""Lazy, cached loaders for the three heavy models.

- text:  sentence-transformers/all-MiniLM-L6-v2 (384-d)   via fastembed (ONNX)
- image: Qdrant/clip-ViT-B-32-vision (512-d)             via fastembed (ONNX)
- ocr:   RapidOCR (PP-OCR models bundled in the package) via onnxruntime

A model is loaded the first time it is needed (or at start-up when ``AI_PRELOAD_MODELS=true``)
and kept for the life of the process. ONNX sessions can be shared between threads, but we
still serialise each model with a lock, so two requests never run the same model at once
(this also bounds peak memory on a small server).

A failed load is remembered for ``RETRY_AFTER_SECONDS`` so a missing model does not make
every request wait for a new (possibly very slow) download attempt.
"""

import logging
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from importlib import metadata
from pathlib import Path
from typing import Any

from app.config import Settings, get_settings

logger = logging.getLogger("similo.ai.models")

TEXT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
IMAGE_MODEL_NAME = "Qdrant/clip-ViT-B-32-vision"
RETRY_AFTER_SECONDS = 60.0


def ocr_model_name() -> str:
    try:
        return f"rapidocr {metadata.version('rapidocr')} (PP-OCR, bundled)"
    except metadata.PackageNotFoundError:  # pragma: no cover - rapidocr is a dependency
        return "rapidocr"


class ModelUnavailableError(RuntimeError):
    """A model could not be loaded (not downloaded, out of memory, ...)."""


@dataclass
class _Slot:
    name: str
    load: Callable[[], Any]
    lock: threading.Lock = field(default_factory=threading.Lock)  # guards loading
    run_lock: threading.Lock = field(default_factory=threading.Lock)  # guards inference
    model: Any = None
    failed_at: float | None = None
    load_seconds: float | None = None


class ModelRegistry:
    """Holds the loaded models. One registry per process (see ``get_registry``)."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._slots: dict[str, _Slot] = {
            "text": _Slot("text", self._load_text),
            "image": _Slot("image", self._load_image),
            "ocr": _Slot("ocr", self._load_ocr),
        }

    # -- loaders ------------------------------------------------------------------------
    @property
    def _cache_dir(self) -> str:
        path = Path(self._settings.models_dir).expanduser().resolve()
        path.mkdir(parents=True, exist_ok=True)
        return str(path)

    def _fastembed_options(self) -> dict[str, Any]:
        # No CPU memory arena: slightly slower, but the process does not hold on to scratch memory.
        options: dict[str, Any] = {"cache_dir": self._cache_dir, "enable_cpu_mem_arena": False}
        if not self._settings.allow_model_download:
            options["local_files_only"] = True
        return options

    def _load_text(self) -> Any:
        from fastembed import TextEmbedding

        return TextEmbedding(model_name=TEXT_MODEL_NAME, **self._fastembed_options())

    def _load_image(self) -> Any:
        from fastembed import ImageEmbedding

        return ImageEmbedding(model_name=IMAGE_MODEL_NAME, **self._fastembed_options())

    def _load_ocr(self) -> Any:
        from rapidocr import RapidOCR

        return RapidOCR(params={"Global.log_level": "warning"})

    # -- access -------------------------------------------------------------------------
    def _get(self, key: str) -> _Slot:
        slot = self._slots[key]
        if slot.model is not None:
            return slot
        with slot.lock:
            if slot.model is not None:
                return slot
            if (
                slot.failed_at is not None
                and time.monotonic() - slot.failed_at < RETRY_AFTER_SECONDS
            ):
                raise ModelUnavailableError(f"The {key} model is not available.")
            started = time.perf_counter()
            try:
                slot.model = slot.load()
            except Exception as error:  # noqa: BLE001 - any load failure means "unavailable"
                slot.failed_at = time.monotonic()
                logger.error("Could not load the %s model (%s)", key, type(error).__name__)
                raise ModelUnavailableError(f"The {key} model could not be loaded.") from error
            slot.failed_at = None
            slot.load_seconds = time.perf_counter() - started
            logger.info("Loaded the %s model in %.1f s", key, slot.load_seconds)
            return slot

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        slot = self._get("text")
        with slot.run_lock:
            return [vector.tolist() for vector in slot.model.embed(texts)]

    def embed_images(self, images: list[Any]) -> list[list[float]]:
        """Embed PIL images with CLIP; returns one vector per image, in order."""
        slot = self._get("image")
        with slot.run_lock:
            return [vector.tolist() for vector in slot.model.embed(images, batch_size=8)]

    def run_ocr(self, image: Any) -> Any:
        """Run RapidOCR on a numpy array or PIL image and return its raw output."""
        slot = self._get("ocr")
        with slot.run_lock:
            return slot.model(image)

    # -- status -------------------------------------------------------------------------
    def status(self) -> dict[str, bool]:
        return {key: slot.model is not None for key, slot in self._slots.items()}

    def load_seconds(self) -> dict[str, float | None]:
        return {key: slot.load_seconds for key, slot in self._slots.items()}

    def preload(self) -> None:
        for key in self._slots:
            try:
                self._get(key)
            except ModelUnavailableError:
                pass  # already logged; the service still starts and reports it in /ready


_registry: ModelRegistry | None = None
_registry_lock = threading.Lock()


def get_registry() -> ModelRegistry:
    """The process-wide registry (created on first use from the current settings)."""
    global _registry  # noqa: PLW0603
    if _registry is None:
        with _registry_lock:
            if _registry is None:
                _registry = ModelRegistry()
    return _registry


def set_registry(registry: ModelRegistry | None) -> None:
    """Replace the process-wide registry (used by tests and by create_app)."""
    global _registry  # noqa: PLW0603
    _registry = registry

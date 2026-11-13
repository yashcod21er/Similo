"""The lazy model loaders: loaded once, failures remembered briefly, status reported."""

import pytest

from app.analysis import models_loader
from app.analysis.models_loader import ModelRegistry, ModelUnavailableError
from tests.helpers import make_settings


class _Vector:
    def __init__(self, values: list[float]) -> None:
        self._values = values

    def tolist(self) -> list[float]:
        return self._values


class _FakeTextModel:
    def embed(self, texts: list[str]) -> list[_Vector]:
        return [_Vector([1.0, 0.0]) for _ in texts]


def _registry(tmp_path, **settings: object) -> ModelRegistry:  # type: ignore[no-untyped-def]
    return ModelRegistry(make_settings(models_dir=tmp_path / "models", **settings))


def test_nothing_is_loaded_until_needed(tmp_path) -> None:  # type: ignore[no-untyped-def]
    registry = _registry(tmp_path)
    assert registry.status() == {"text": False, "image": False, "ocr": False}


def test_models_load_once_and_report_status(tmp_path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    registry = _registry(tmp_path)
    loads: list[str] = []

    def fake_load() -> _FakeTextModel:
        loads.append("text")
        return _FakeTextModel()

    monkeypatch.setattr(registry, "_load_text", fake_load)
    registry._slots["text"].load = fake_load

    assert registry.embed_texts(["a", "b"]) == [[1.0, 0.0], [1.0, 0.0]]
    registry.embed_texts(["c"])
    assert loads == ["text"]
    assert registry.status() == {"text": True, "image": False, "ocr": False}
    assert registry.load_seconds()["text"] is not None


def test_a_failed_load_is_remembered_for_a_while(tmp_path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    registry = _registry(tmp_path)
    attempts: list[int] = []

    def broken() -> None:
        attempts.append(1)
        raise OSError("no network")

    registry._slots["text"].load = broken
    with pytest.raises(ModelUnavailableError):
        registry.embed_texts(["a"])
    with pytest.raises(ModelUnavailableError):
        registry.embed_texts(["a"])
    assert len(attempts) == 1  # the second call did not retry the slow load

    monkeypatch.setattr(models_loader, "RETRY_AFTER_SECONDS", 0.0)
    with pytest.raises(ModelUnavailableError):
        registry.embed_texts(["a"])
    assert len(attempts) == 2


def test_the_models_directory_is_created_and_used_as_cache(tmp_path) -> None:  # type: ignore[no-untyped-def]
    registry = _registry(tmp_path)
    options = registry._fastembed_options()
    assert options["cache_dir"] == str((tmp_path / "models").resolve())
    assert (tmp_path / "models").is_dir()
    assert "local_files_only" not in options


def test_downloads_can_be_disabled(tmp_path) -> None:  # type: ignore[no-untyped-def]
    registry = _registry(tmp_path, allow_model_download=False)
    assert registry._fastembed_options()["local_files_only"] is True


def test_preload_loads_everything_and_survives_failures(tmp_path) -> None:  # type: ignore[no-untyped-def]
    registry = _registry(tmp_path)
    registry._slots["text"].load = lambda: _FakeTextModel()
    registry._slots["image"].load = lambda: object()

    def broken() -> None:
        raise OSError("missing")

    registry._slots["ocr"].load = broken
    registry.preload()
    assert registry.status() == {"text": True, "image": True, "ocr": False}


def test_preload_runs_at_startup_when_enabled(tmp_path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    from fastapi.testclient import TestClient

    from app.main import create_app

    calls: list[str] = []
    app = create_app(make_settings(models_dir=tmp_path, preload_models=True))
    monkeypatch.setattr(app.state.registry, "preload", lambda: calls.append("preload"))
    with TestClient(app):
        pass
    assert calls == ["preload"]

    calls.clear()
    app = create_app(make_settings(models_dir=tmp_path, preload_models=False))
    monkeypatch.setattr(app.state.registry, "preload", lambda: calls.append("preload"))
    with TestClient(app):
        pass
    assert calls == []

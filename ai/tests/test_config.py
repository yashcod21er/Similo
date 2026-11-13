import pytest
from pydantic import ValidationError

from app.config import MIN_PRODUCTION_TOKEN_LENGTH, Settings


def test_development_needs_no_token() -> None:
    settings = Settings(_env_file=None, environment="development")  # type: ignore[call-arg]
    assert settings.token_value is None


def test_production_without_a_token_refuses_to_start() -> None:
    with pytest.raises(ValidationError, match="AI_SERVICE_TOKEN"):
        Settings(_env_file=None, environment="production")  # type: ignore[call-arg]


def test_production_rejects_a_short_token() -> None:
    short = "s" * (MIN_PRODUCTION_TOKEN_LENGTH - 1)
    with pytest.raises(ValidationError, match="at least 32"):
        Settings(_env_file=None, environment="production", service_token=short)  # type: ignore[call-arg]


def test_production_accepts_a_long_token() -> None:
    token = "s" * MIN_PRODUCTION_TOKEN_LENGTH
    settings = Settings(_env_file=None, environment="production", service_token=token)  # type: ignore[call-arg]
    assert settings.token_value == token


def test_blank_token_counts_as_not_configured() -> None:
    settings = Settings(_env_file=None, environment="test", service_token="   ")  # type: ignore[call-arg]
    assert settings.token_value is None


def test_token_is_hidden_in_repr() -> None:
    settings = Settings(_env_file=None, environment="test", service_token="super-secret-value")  # type: ignore[call-arg]
    assert "super-secret-value" not in repr(settings)


def test_environment_variables_are_read(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AI_MODELS_DIR", "somewhere")
    monkeypatch.setenv("AI_PRELOAD_MODELS", "true")
    monkeypatch.setenv("AI_MAX_REQUEST_BYTES", "1234")
    settings = Settings(_env_file=None, environment="test")  # type: ignore[call-arg]
    assert str(settings.models_dir) == "somewhere"
    assert settings.preload_models is True
    assert settings.max_request_bytes == 1234

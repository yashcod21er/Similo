"""Service configuration, read from environment variables (prefix ``AI_``) or ``.env``."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Production refuses to start with a shorter token (the backend sends the same value).
MIN_PRODUCTION_TOKEN_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="AI_", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # Shared secret for /internal/* (the backend sends it as `Authorization: Bearer <token>`).
    # Not set = every /internal/* call answers 503, so a mis-configured service fails closed.
    service_token: SecretStr | None = None

    # Where the downloaded ONNX models are cached (relative paths are relative to ai/).
    models_dir: Path = Path(".models")
    # Load every model when the service starts instead of on the first request.
    preload_models: bool = False
    # False = never download models (use only what is already in models_dir).
    allow_model_download: bool = True

    # Requests larger than this are refused with 413 before they are parsed.
    max_request_bytes: int = 16 * 1024 * 1024

    @field_validator("service_token", mode="before")
    @classmethod
    def _blank_token_means_unset(cls, value: object) -> object:
        # `AI_SERVICE_TOKEN=` in a .env file must behave like "not configured".
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @model_validator(mode="after")
    def _production_needs_a_strong_token(self) -> "Settings":
        if self.environment == "production":
            token = self.service_token.get_secret_value() if self.service_token else ""
            if len(token) < MIN_PRODUCTION_TOKEN_LENGTH:
                raise ValueError(
                    f"AI_SERVICE_TOKEN must be set to at least {MIN_PRODUCTION_TOKEN_LENGTH} "
                    "characters when AI_ENVIRONMENT=production"
                )
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def token_value(self) -> str | None:
        return self.service_token.get_secret_value() if self.service_token else None


@lru_cache
def get_settings() -> Settings:
    """Read settings once and reuse them (validated by Pydantic at first use)."""
    return Settings()

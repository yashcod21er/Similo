# Similo AI service. Build from the ai/ folder:  docker build -t similo-ai ai
# The three models (about 470 MB) are downloaded while the image is built, so the
# running service never downloads anything and the build fails early if a model
# cannot load on this machine.
FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_LINK_MODE=copy

# OpenCV (used by the OCR library) needs these two system libraries.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/* \
  && pip install --no-cache-dir uv \
  && useradd --create-home --uid 10001 app \
  && mkdir /app && chown app:app /app

USER app
WORKDIR /app
COPY --chown=app:app pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project --no-cache

COPY --chown=app:app app app
ENV PATH=/app/.venv/bin:$PATH \
    AI_MODELS_DIR=/app/.models

# Download and load every model once; stop the build if any of them fails.
RUN python -c "import sys; from app.analysis.models_loader import ModelRegistry; r = ModelRegistry(); r.preload(); print(r.status()); sys.exit(0 if all(r.status().values()) else 1)"

ENV AI_ENVIRONMENT=production \
    AI_ALLOW_MODEL_DOWNLOAD=false \
    AI_PRELOAD_MODELS=true
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

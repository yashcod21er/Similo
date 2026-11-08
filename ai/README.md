# Similo AI service

Internal Python service for the AI work: text and logo similarity, OCR, risk scoring,
embeddings and RAG. Only the backend (and, later, its background workers) calls it; browsers
never do. It runs at <http://localhost:8000>.

From the repository root:

```bash
uv sync --directory ai   # once: create ai/.venv and install the dependencies
npm run dev:ai           # run the service (npm run dev starts all three parts)
npm run test:ai          # run the tests (pytest)
npm run lint:ai          # lint the code (Ruff)
```

## What is where

```
ai/
├── app/
│   ├── main.py          Creates the FastAPI app
│   ├── config.py        Reads the settings (AI_ variables or .env)
│   └── api/health.py    GET /health
├── tests/               pytest tests
├── pyproject.toml       Dependencies (managed by uv; exact versions in uv.lock)
└── .env.example         Settings template (copy to .env)
```

- `GET /health` reports whether the service is running.
- `/docs` is the interactive API documentation. It is turned off when `AI_ENVIRONMENT=production`.

Phase 1 contains only the health endpoint. The ML libraries (sentence-transformers,
OpenCV, OCR) are added in Phase 6, when they are first needed, so the first install stays small and fast.

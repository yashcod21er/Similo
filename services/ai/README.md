# Similo AI service

Internal Python service for the AI work: text and logo similarity, OCR, risk scoring,
embeddings and RAG. Only the Node.js API and its workers call it; browsers never do.

```bash
cd services/ai
uv sync                                          # create .venv and install dependencies
uv run uvicorn app.main:app --reload --port 8000 # run the service
uv run pytest                                    # run the tests
uv run ruff check .                              # lint the code
```

- `GET /health` reports whether the service is running.
- `/docs` is the interactive API documentation. It is turned off when `AI_ENVIRONMENT=production`.

Phase 1 contains only the health endpoint. The ML libraries (sentence-transformers,
OpenCV, OCR) are added in Phase 6, when they are first needed, so the first install stays small and fast.

# Similo AI service

Internal Python service for the AI work: it compares a suspect website with a protected brand
(text, logo, OCR, page signals) and returns an **explainable risk score**. Only the backend
(and its background workers) calls it; browsers never do. It runs at <http://localhost:8000>.

The AI suggests, a person decides: the score is a list of named signals, each with its points
and a plain-English sentence. There is no LLM in this service.

From the repository root:

```bash
uv sync --directory ai   # once: create ai/.venv and install the dependencies
npm run dev:ai           # run the service (npm run dev starts all three parts)
npm run test:ai          # run the tests (pytest)
npm run lint:ai          # lint the code (Ruff)
```

Or from `ai/`:

```bash
uv run pytest                 # about 230 fast tests, no models needed (~2 s)
uv run pytest -m slow         # one slow test with the REAL models (needs ai/.models, ~5 s)
uv run ruff check .           # lint
uv run ruff format --check .  # formatting
```

## Endpoints

| Endpoint | Auth | What it does |
|---|---|---|
| `GET /health` | none | Is the service running? |
| `POST /internal/ai/analyse` | bearer token | Analyse one candidate domain against one brand |
| `GET /internal/ai/ready` | bearer token | Which models are loaded right now |
| `/docs` | none | Interactive API documentation (off when `AI_ENVIRONMENT=production`) |

### Authentication

`/internal/*` needs `Authorization: Bearer <AI_SERVICE_TOKEN>` (checked in constant time).
Missing or wrong token: `401`. No token configured on the service: `503` for every `/internal/*`
call (it fails closed). `AI_ENVIRONMENT=production` refuses to start unless the token is at
least 32 characters. The token is never logged.

### `POST /internal/ai/analyse`

JSON, camelCase. A body over `AI_MAX_REQUEST_BYTES` (16 MB) gets `413` before it is parsed.
Invalid bodies get `422` (the error lists the field names, never the submitted values).

```jsonc
{
  "brand": {
    "name": "Acme", "description": "", "keywords": ["acme pay"],   // keywords <= 50
    "officialDomains": ["acme.com"],                                // <= 50
    "logos": [{ "id": "<logoId>", "imageBase64": "<png|jpeg|webp>" }]  // <= 5, <= ~1 MB each
  },
  "candidate": {
    "domain": "acme-login.com",
    "domainScore": 82,                       // Phase 5 name score, 0-100
    "registeredAt": "2026-11-01T00:00:00Z",  // or null
    "page": null | {                         // null = the site could not be captured
      "finalUrl": "https://acme-login.com/", "title": "", "text": "",   // text <= 20 000 chars
      "screenshotBase64": "<jpeg>",          // <= ~1.5 MB
      "images": [{ "kind": "favicon"|"logo"|"image", "imageBase64": "<png>" }],  // <= 12, <= ~512 KB each
      "forms": { "hasPasswordField": false, "hasPaymentField": false, "submitsToOtherDomain": false },
      "certificateIssuedAt": null
    }
  }
}
```

Response `200`:

```jsonc
{
  "modelVersion": "similo-risk-1",
  "score": 0,                      // 0-100 integer = the sum of the signal points (capped at 100)
  "level": "low" | "medium" | "high",   // high >= 70, medium >= 40
  "signals": [{ "id": "domain_similarity", "label": "Domain name", "value": 0.82,
                "points": 20, "maxPoints": 25, "detail": "plain sentence" }],
  "reasons": ["plain sentences, highest points first, only for signals with points > 0"],
  "unavailable": ["logo_match"],   // signals that could not be computed
  "ocrText": "",                   // text read from the screenshot, <= 2 000 chars
  "logoMatch": null | { "logoId": "", "source": "favicon"|"logo"|"image"|"screenshot",
                        "similarity": 0.0, "method": "phash"|"clip" },
  "models": { "text": "...", "image": "...", "ocr": "..." }
}
```

`signals` lists only the signals that were computed (in the order below); every signal that
could not be computed is named in `unavailable` instead. A model that fails or a missing
input never fails the request: that signal is simply `unavailable`.

| Signal id | Label | Max | How it is measured |
|---|---|---|---|
| `domain_similarity` | Domain name | 25 | The backend's name score (0-100) as given |
| `logo_match` | Logo | 25 | Image hashes (near-identical copies) and CLIP (look-alikes), see below |
| `text_similarity` | Page wording | 15 | MiniLM cosine: brand profile vs page title and first 2 000 characters |
| `brand_mention` | Brand name on the page | 10 | Brand name or keyword in title, text or OCR, incl. look-alike spellings |
| `credential_form` | Password request | 10 | Page has a password field (gated, see below) |
| `payment_form` | Payment request | 5 | Page has a card/payment field (gated) |
| `new_domain` | Domain age | 5 | Registered less than 30 days ago (fades out linearly) |
| `new_certificate` | Certificate age | 5 | Certificate issued less than 14 days ago |

Points are `floor(max x strength)`, so a signal never claims more than its method supports.
**Gating:** `credential_form` and `payment_form` only score when some brand signal is present
(domain >= 0.7, a logo match, similar text or a brand mention). An ordinary login page is not
suspicious by itself.

### In-process API (evaluation runner)

```python
from app.analysis.service import analyse
from app.analysis.models import AnalyseRequest

response = analyse(AnalyseRequest.model_validate(payload))  # the same pydantic models as HTTP
```

`analyse(request, *, registry=None, now=None)` loads the models lazily and caches them for
the life of the process.

## Methods and calibration

All numbers that decide a score are in `app/analysis/scoring.py` (`WEIGHTS`, `THRESHOLDS`),
each with a comment. They are **initial values, not measured results**; the evaluation set
(`ai/eval`, `docs/EVALUATION.md`) measures them and they are to be tuned from it.

- **Logo.** Brand logos are compared with the favicon, logo and other images captured from the
  page, and with tiles cut from the top 20 % of the screenshot (where site logos sit). Images
  are trimmed of plain borders and blank images are skipped.
  - *pHash + dHash* (`method: phash`): the average of the two 64-bit distances (and of the
    brand logo's colour-inverted copy, for dark-mode logos) <= 8 means "almost identical"
    (90-100 % of the points). Cheap; when it finds a match CLIP is not run.
  - *CLIP ViT-B/32* (`method: clip`): cosine of the image embeddings; 0 points up to 0.82,
    80 % of the points at 0.95 or more. It never earns the full 25 points, because it measures
    "looks alike", not "is a copy". Its sentences say "looks similar" and add "please check it
    by eye".
  - Limits: a logo inside a large hero image, mostly-text logos, or a tile that cuts a logo in
    half can be missed or matched weakly.
- **Text.** all-MiniLM-L6-v2 cosine between "name. description. keywords" and "page title.
  first ~2 000 characters"; 0 points up to 0.5, full points at 0.85. Topic similarity is weak
  evidence (a genuine competitor reads alike), so it carries only 15 points. A brand with just a
  name gives low similarities even for a copy.
- **OCR.** RapidOCR on the screenshot (lines under 0.5 confidence are dropped); the text is
  returned (<= 2 000 characters) and used by the brand-mention check.
- **Brand mention.** Whole-word match, ignoring case and spaces/hyphens/dots between letters;
  a second pass treats look-alike characters as equal (Cyrillic/Greek letters, `0`=o, `1`/`|`/`I`=l,
  `rn`=m, `vv`=w, `cl`=d). Mentions of the brand's own official domains are removed first, and an
  official domain scores nothing here. Title 100 %, inside an image 80 %, altered spelling in the
  text 80 %, exact name in the text 50 % (80 % if repeated three times).
- **Images are hostile input.** Pillow only; PNG, JPEG, WebP, ICO and GIF (first frame), decided
  from the first bytes (SVG, HTML and everything else are refused); at most 40 million pixels;
  nothing is written to disk, and page text, images and tokens are never logged.

## Models

| Use | Model | Size on disk | Where |
|---|---|---|---|
| Text | `sentence-transformers/all-MiniLM-L6-v2` (384-d, ONNX via fastembed) | 87 MB | `AI_MODELS_DIR` |
| Image | `Qdrant/clip-ViT-B-32-vision` (512-d, ONNX via fastembed) | 336 MB | `AI_MODELS_DIR` |
| OCR | RapidOCR PP-OCR small models | 31 MB | inside the `rapidocr` package |

Models load on first use and stay loaded; set `AI_PRELOAD_MODELS=true` to load them at
start-up (`GET /internal/ai/ready` shows what is loaded). The first load of a model downloads
it (fastembed, from Hugging Face), which is slow on a slow connection: never delete
`ai/.models`. Set `AI_ALLOW_MODEL_DOWNLOAD=false` to forbid downloads. Measured on the
development PC (CPU only, other programs running): loading takes about 0.4-0.6 s per model; a
typical request (1.5 MB, 9 images) takes about 1.2-1.6 s when a hash match makes CLIP
unnecessary and about 2.5-3.5 s with CLIP and OCR (up to twice that when the PC is busy);
memory with all three models loaded is about 700 MB (peak about 900 MB), so the service needs
roughly 1 GB of RAM.

## What is where

```
ai/
├── app/
│   ├── main.py            Creates the FastAPI app (optional model preload at start-up)
│   ├── config.py          Settings (AI_ variables or .env); production needs a strong token
│   ├── security.py        Bearer-token check for /internal/*
│   ├── api/
│   │   ├── health.py      GET /health
│   │   └── analyse.py     POST /internal/ai/analyse, GET /internal/ai/ready
│   └── analysis/
│       ├── models.py      Request/response models and every size limit
│       ├── service.py     analyse(): runs each signal, never fails because one model fails
│       ├── scoring.py     WEIGHTS, THRESHOLDS, the gating rule, plain-English sentences
│       ├── images.py      Safe image decoding (Pillow only)
│       ├── text.py        MiniLM text similarity
│       ├── logos.py       pHash/dHash and CLIP logo comparison, screenshot tiles
│       ├── ocr.py         RapidOCR on the screenshot
│       ├── mention.py     Brand mentions incl. look-alike spellings
│       └── models_loader.py  Lazy, cached model loading
├── tests/                 pytest tests (real models only in the one `slow` test)
├── eval/                  Evaluation set and runner (a separate piece of work)
├── pyproject.toml         Dependencies (managed by uv; exact versions in uv.lock)
└── .env.example           Settings template (copy to .env)
```

## Settings

All are environment variables (or `ai/.env`); see `.env.example` for comments.

| Variable | Default | Meaning |
|---|---|---|
| `AI_ENVIRONMENT` | `development` | `development`, `test` or `production` |
| `AI_LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `AI_SERVICE_TOKEN` | empty | Bearer token for `/internal/*`; empty = 503; production needs >= 32 characters |
| `AI_MODELS_DIR` | `.models` | Model cache folder |
| `AI_PRELOAD_MODELS` | `false` | Load all models at start-up |
| `AI_ALLOW_MODEL_DOWNLOAD` | `true` | `false` = never download |
| `AI_MAX_REQUEST_BYTES` | `16777216` | Larger bodies get 413 |

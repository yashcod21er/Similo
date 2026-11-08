# Similo — Architecture

This document explains how the system is put together and why. Read it before changing the structure.

## 1. System overview

```mermaid
flowchart TB
  user([Analyst / Admin]) --> web[Web app<br/>React + TypeScript + Vite]
  web -- "/api/v1 (REST, JSON)<br/>HTTP-only session cookie" --> api[API<br/>Node.js + Express]
  api --> mongo[(MongoDB Atlas<br/>+ Vector Search)]
  api -- enqueue jobs --> redis[(Redis<br/>BullMQ queues)]
  redis --> workers[Workers<br/>Node.js]
  workers -- "/internal/ai/*<br/>service token" --> ai[AI service<br/>Python + FastAPI]
  api -- "health, quick calls" --> ai
  workers --> sources[[External sources<br/>domain feeds, RDAP,<br/>app stores, TM journals]]
  workers --> mongo
  ai --> mongo
  api --> s3[(S3-compatible<br/>object storage)]
```

**Built in Phase 1:** the web app, the API, the AI service, the health checks between them, and the MongoDB connection code.
**Planned:** Redis, workers, object storage and external sources (see the [roadmap](#roadmap)).

### Who is responsible for what

| Component                  | Responsible for                                                             | Never does                                                              |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Frontend** (`frontend/`) | UI, routing, forms, calling the API                                         | Hold secrets, enforce security (UI only hides things; the API enforces) |
| **Backend** (`backend/`)   | Auth, organisations, RBAC, CRUD, validation, audit logs, enqueuing jobs     | Long-running monitoring or AI work inside a request                     |
| **Workers** (Phase 5)      | Scheduled monitoring, enrichment, calling the AI service, creating findings | Serve browser traffic                                                   |
| **AI service** (`ai/`)     | Similarity, OCR, embeddings, risk scoring, RAG                              | Talk to browsers, decide tenant access on its own                       |

## 2. Why this shape

- **Two backends (Node + Python).** Node/Express is a good fit for the request/response
  work: auth, CRUD and validation. Python has the ML ecosystem (sentence-transformers,
  OpenCV, OCR). Splitting them lets each use its best tools, and lets the AI service scale
  separately (it is CPU/GPU-heavy, the API is I/O-heavy).
- **Queues between the API and AI work.** Monitoring a brand or OCR-ing a 200-page journal can
  take minutes. Doing that inside an HTTP request would time out and block other users.
  The API puts a job on a queue and returns immediately, a worker does the work, and the
  UI shows progress.
- **One database (MongoDB Atlas) for documents and vectors.** Atlas Vector Search keeps RAG
  embeddings next to the data they describe, so there is no second database to run.
  The organisation filter is applied to every vector query, just like a normal query.

## 3. Request flow (Phase 1)

```
Browser ─GET /api/v1/health/dependencies─▶ Vite dev server (5173)
        ─proxy─▶ Express (4000)
           request-logger → helmet → cors → json parser → router → controller → service
                                                                    ├─ ping MongoDB (timeout 3s)
                                                                    └─ GET http://localhost:8000/health (timeout 3s)
        ◀─ { success: true, data: { status: "degraded", dependencies: [...] } }
```

**The dev proxy.** In development the browser only talks to `localhost:5173`, and Vite
forwards `/api` to Express. Because the browser sees a single origin, CORS is not needed,
and HTTP-only cookies (Phase 2) work exactly as they will in production behind one domain.

## 4. API conventions

- **Versioning:** every route lives under `/api/v1`.
- **Response envelope:** every response has one of two shapes:
  - Success: `{ "success": true, "data": … }`
  - Failure: `{ "success": false, "error": { "code", "message", "requestId", "details?" } }`
  - `code` is stable and machine-readable (`NOT_FOUND`, `VALIDATION_ERROR`, …).
  - `message` is safe to show to users.
  - Unexpected errors become a generic `INTERNAL_ERROR`. Stack traces and internal messages are never sent to clients.
- **Request IDs:** every response carries `X-Request-Id`, which also appears on every log line
  for that request. Error responses repeat it as `error.requestId`.
- **Validation:** request bodies, params and queries are validated with Zod. A `ZodError` becomes `400 VALIDATION_ERROR` with per-field details.
- **Layers:** `routes → controller (thin, HTTP only) → service (business logic) → model/client`.
  Services never touch `req`/`res`, so they can be tested without HTTP.
- **Health endpoints:**
  - `GET /api/v1/health` is liveness and always returns 200 while the process runs.
  - `GET /api/v1/health/dependencies` is the dependency report:
    - `ok`: everything is up.
    - `degraded`: an optional dependency is down or not configured.
    - `down`: a critical dependency (the database) is down.
  - The dependency report will be restricted to admins in Phase 2.
- **AI service responses** are plain FastAPI JSON. The envelope is only used by the public API, and the Node client validates every AI response with Zod.

## 5. Security baseline

| Concern               | Phase 1                                                                                                                                                                                                                                                                           | Planned                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Secrets               | Read from environment variables and validated at startup; `.env` is git-ignored; error messages name the variable but never show its value                                                                                                                                        | Secret manager in production                                                                       |
| HTTP headers          | `helmet` (CSP, HSTS, nosniff, frame options); `X-Powered-By` removed                                                                                                                                                                                                              | —                                                                                                  |
| CORS                  | Allow-list only (`CORS_ORIGINS`), credentials enabled                                                                                                                                                                                                                             | —                                                                                                  |
| Body limits           | JSON bodies limited to 1 MB                                                                                                                                                                                                                                                       | Upload size and type validation (Phase 4)                                                          |
| Log hygiene           | `authorization`, `cookie` and `set-cookie` headers redacted; request logs keep only method, URL and status                                                                                                                                                                        | —                                                                                                  |
| AI service            | Not exposed to browsers; `/docs` disabled in production                                                                                                                                                                                                                           | Shared service token on `/internal/*` (Phase 5)                                                    |
| Auth / RBAC / tenancy | Phase 2: Argon2id passwords; opaque session token in an HTTP-only, SameSite=Lax cookie (`__Host-` + Secure in production), stored as a SHA-256 hash with idle (7 d) and absolute (30 d) expiry; five roles checked per route with `requirePermission`; role read on every request | MFA and SSO (Phase 10)                                                                             |
| Rate limiting         | Demo requests 5/15 min; sign-in 10/15 min; sign-up 5/h; invitation links 30/15 min (per client, `express-rate-limit`); account pause for 15 min after 5 wrong passwords                                                                                                           | Shared Redis store when the API runs on several instances                                          |
| CSRF                  | Phase 2: SameSite=Lax cookies plus an `Origin` allow-list check on every POST/PATCH/DELETE (`verifyOrigin`)                                                                                                                                                                       | —                                                                                                  |
| Audit                 | Phase 2: append-only audit log (sign-ins, failures, lockouts, invitations, role changes, removals) with actor, target, IP                                                                                                                                                         | Export and retention settings                                                                      |
| SSRF                  | —                                                                                                                                                                                                                                                                                 | Phase 5: URL fetchers block private/loopback/metadata IPs and re-check the IP after DNS resolution |

## 6. Multi-tenancy and authorisation (built in Phase 2)

- Every tenant-owned document has an `organizationId`, and every collection has compound indexes that start with `organizationId`.
- The organisation comes from the **authenticated session**, never from the request body or URL.
- The repositories/services that serve requests take `organizationId` as a required argument,
  so it is impossible to write an unscoped query by accident. Tests check that organisation A
  cannot read organisation B's data.
- Roles: Owner, Admin, Investigation Analyst, Legal Reviewer, Viewer. The API checks them per
  action (`requirePermission('findings:update')`). The UI only hides buttons.
- **Proposed session strategy:** opaque session ID in an HTTP-only, `Secure`, `SameSite=Lax`
  cookie, with sessions stored in MongoDB (TTL index). It's simpler and safer than JWT
  refresh-token rotation for a first-party web app, and sessions can be revoked instantly
  (logout, password change, member removal). Built this way in Phase 2.
- Proven by `backend/test/tenant-isolation.test.ts`: with the other organisation's real IDs,
  members, invitations and audit entries are invisible and unchangeable (404), and an
  `organizationId` sent in a request body is ignored.

## 7. Data sources and their limits

The platform must not claim coverage it doesn't have. Each source is an adapter behind an interface, so a source that is not yet approved can be swapped for clearly labelled test fixtures.

| Module            | Candidate sources                                                                                                      | Constraint                                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Domain discovery  | ICANN CZDS zone files; Certificate Transparency logs; licensed newly-registered-domain feeds; fixtures for development | CZDS needs approval per TLD (apply early: days to weeks). RDAP is used **only for enrichment**; it cannot discover new domains. |
| Domain enrichment | RDAP (via the IANA bootstrap registry)                                                                                 | Rate limits per registry; personal data is often redacted                                                                       |
| Apps              | Apple iTunes Search API (public, documented); licensed data providers                                                  | There is no official public Google Play search API. The Play Developer API only covers your own apps.                           |
| Trademarks        | IP India trademark journals (PDF); WIPO Global Brand Database where its terms permit                                   | No comprehensive global coverage; the OCR quality of journal PDFs varies                                                        |

## 8. Key decisions

| #   | Decision                                                                                                          | Why                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | npm workspaces monorepo (no pnpm/Turborepo)                                                                       | Built into npm, nothing extra to install; can be upgraded later                                                                             |
| D2  | TypeScript pinned to 6.0.x                                                                                        | TypeScript 7 (the native Go compiler) is out, but `typescript-eslint` supports only up to 6.0. Revisit when it supports 7.                  |
| D3  | Express 5                                                                                                         | Async errors reach the error handler automatically (no try/catch in every route)                                                            |
| D4  | ESM + `NodeNext` in the API                                                                                       | Matches Node's native module system. Relative imports end in `.js` even in `.ts` files, because that is the file Node runs after compiling. |
| D5  | Zod for API env/request validation                                                                                | One schema gives both runtime validation and TypeScript types                                                                               |
| D6  | pino logging                                                                                                      | Fast, structured JSON logs; readable output in development                                                                                  |
| D7  | Vite dev proxy for `/api`                                                                                         | Same-origin in development, so no CORS and cookies just work                                                                                |
| D8  | Tailwind v4 `@theme` tokens; purple/violet palettes removed                                                       | Brand colours are defined once; the "no purple" rule is enforced by the build                                                               |
| D9  | uv for Python, Python 3.12                                                                                        | Fast, reproducible installs (`uv.lock`); 3.12 has the best ML/OCR wheel support                                                             |
| D10 | ML libraries added in Phase 6, not now                                                                            | Keeps the foundation install small; nothing unused is installed                                                                             |
| D11 | `createApp(deps)` separate from `server.ts`                                                                       | Tests build the app with fake dependencies, without a network port or database                                                              |
| D12 | `motion` library for UI animation; `MotionConfig reducedMotion="user"` plus explicit gating of looping animations | Declarative scroll/entrance/parallax animation; visitors who ask for reduced motion get a still page (verified in a browser test)           |
| D13 | Hero globe and waves drawn on `<canvas>`, shield as SVG — no WebGL/three.js                                       | Far smaller bundle; canvases pause off-screen and in hidden tabs; sharp at any size                                                         |
| D14 | Route-level code splitting (React Router `lazy`)                                                                  | Home loads instantly; other pages (2–7 kB each) download on first visit; form libraries only load on `/contact`                             |
| D15 | Resource articles as typed data in `src/content/`, not a CMS yet                                                  | Real content without new infrastructure; swapping to a CMS later changes one module                                                         |
| D16 | Demo requests: Zod validation, honeypot, 5 per 15 min rate limit, `503` when the DB is down                       | A public form must resist spam and must never claim a request was saved when it was not                                                     |
| D17 | Design system v2 "Clarity" (`docs/DESIGN-SYSTEM.md`): light canvas, dark product stages, Geist + Instrument Serif | v1 followed the common brand-protection template; v2 is distinct, calmer, and written in plain words for non-experts                        |
| D18 | Home-page brand checker runs entirely in the browser (`src/lib/lookalikes.ts`, unit-tested)                       | A real, instant demo with no backend, no data collection and no fake results — it says it shows _possible_ imitations                       |
| D19 | Site-wide ⌘K / Ctrl K command menu built from `navigation.ts` and the resource content                            | Fast keyboard navigation; one source of truth, so new pages and guides appear automatically                                                 |
| D20 | Product renamed BrandShield → Similo; identifiers use `similo` (packages, services, default DB)                   | "BrandShield" is already the name of an existing brand-protection company; "Similo" comes from "similar"                                    |
| D21 | Sessions: opaque random token in an HTTP-only cookie, stored hashed in MongoDB (TTL), not JWTs                    | Instant sign-out, role changes and removals; nothing readable by page scripts; no token rotation scheme to get wrong                        |
| D22 | Argon2id via `@node-rs/argon2` (prebuilt, no compiler) with OWASP baseline settings                               | Current OWASP recommendation; works on Windows without native build tools                                                                   |
| D23 | Invitations are one-time links shown once (hash stored), shared by the inviter; no email yet                      | No email provider is configured; never pretend an email was sent                                                                            |
| D24 | Repositories take `organizationId` first; services get the organisation only from the session                     | An unscoped query can't be written by accident; request bodies can't choose a tenant                                                        |
| D25 | Auth tests on in-memory fakes with a controllable clock, plus an Atlas test in a throwaway database               | Fast, deterministic tests of expiry and lockout; real proof of indexes and transactions                                                     |

## 9. Risks and open questions

| Risk / question                                                  | Impact                                                               | Proposed action                                                                                                                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project lives in OneDrive                                        | Slow installs, file-lock errors, GBs synced once ML libraries arrive | Move to a folder outside OneDrive                                                                                                                             |
| Node.js on the dev PC cannot resolve DNS SRV records             | `mongodb+srv://` strings fail with `querySrv ECONNREFUSED`           | Atlas M0 is connected with the standard (non-SRV) connection string; documented in README troubleshooting                                                     |
| No Redis or Docker on this machine                               | Blocks Phase 5 queues                                                | Choose one: Redis in WSL2, Memurai (Windows), or Redis Cloud free tier. Upstash is not ideal because BullMQ's frequent polling uses up its per-command quota. |
| CZDS approval lead time                                          | Real domain discovery delayed                                        | Apply now; develop against labelled fixtures and Certificate Transparency                                                                                     |
| Tesseract/PaddleOCR on Windows                                   | Native install friction                                              | Decide in Phase 6. Tesseract needs a system binary; PaddleOCR is pip-only but heavy.                                                                          |
| LLM provider and API key                                         | Needed for Phase 8                                                   | Provider abstraction; pick the provider at Phase 8                                                                                                            |
| Initial JS bundle is ~190 kB gzip (React, router, motion, query) | Slower first load on poor connections                                | Acceptable for now; revisit with vendor chunking and a Lighthouse audit in Phase 10                                                                           |
| npm 11 blocks esbuild's install script                           | None today (tsx and Vite work)                                       | Optional: `npm approve-scripts esbuild`                                                                                                                       |

## Roadmap

| Phase | Scope                                                                                      | Status                                 |
| ----- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| 0     | Repository inspection, architecture                                                        | ✅ Done                                |
| 1     | Foundation: monorepo, web, API, AI service, config, logging, errors, health checks         | ✅ Done (Atlas connected and verified) |
| 2     | Authentication, organisations, roles, protected routes                                     | ✅ Done                                |
| 3     | Public website: 11 pages, brand checker hero, resources, demo-request form + API endpoint  | ✅ Done (redesigned to v2 "Clarity")   |
| 4     | Brand management (brands, logos, domains, trademarks, monitoring config)                   | Next                                   |
| 5     | First end-to-end domain monitoring (discovery adapter, similarity, RDAP, BullMQ, findings) | —                                      |
| 6     | AI intelligence (text/image similarity, OCR, explainable risk scoring, evaluation set)     | —                                      |
| 7     | Investigations and evidence (provenance, SHA-256, timeline, reports)                       | —                                      |
| 8     | RAG assistant (ingestion, embeddings, vector search, cited answers, drafts)                | —                                      |
| 9     | App and trademark monitoring                                                               | —                                      |
| 10    | Production readiness (security audit, performance, deployment, backups)                    | —                                      |
| Later | MCP server (read-only tools, permission-checked)                                           | Extension point only                   |

### Phase 2 — accounts, organisations and roles

| Endpoint                                       | Who                        | Purpose                                       |
| ---------------------------------------------- | -------------------------- | --------------------------------------------- |
| `POST /auth/sign-up`, `POST /auth/sign-in`     | Anyone (rate-limited)      | Create an organisation + Owner; sign in       |
| `POST /auth/sign-out`, `GET /auth/me`          | Signed in                  | End this session; who am I, role, permissions |
| `POST /auth/change-password`                   | Signed in                  | Also signs out every other session            |
| `GET /auth/invites/:token`, `POST …/accept`    | Link holder (rate-limited) | Preview and accept an invitation              |
| `GET`/`PATCH /organization`                    | All / Owner, Admin         | Organisation summary; rename                  |
| `GET /organization/members`                    | All roles                  | Members with roles                            |
| `PATCH`/`DELETE /organization/members/:userId` | Owner, Admin (Owner rules) | Change role; remove (signs them out at once)  |
| `GET`/`POST`/`DELETE /organization/invites`    | Owner, Admin               | Pending invitations; create link; revoke      |
| `GET /audit-events`                            | Owner, Admin, Legal        | Audit log, newest first, cursor-paginated     |

Owner rules: only Owners can grant, change or remove the Owner role; nobody can change their own
role or remove themselves; an organisation always keeps at least one Owner.

Website: `/sign-in`, `/sign-up`, `/invite/:token` (focused layout) and the protected workspace
`/app` (Overview, Members, Audit log, Settings). `RequireAuth` only decides what to show; the API
enforces every rule.

### Phase 3 — public website

| Route                                                              | Page                                                                                                                                                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                | Home: plain-words hero + interactive brand checker (orbiting shield visual), 01 problem stories with alert cards, 02 auto-advancing "how it works", 03 bento of six checks, 04 teams, 05 FAQ |
| `/platform`, `/technology`                                         | "How it works" menu: the platform in plain words; "The AI, explained" — the one page with full technical depth                                                                               |
| `/solutions/domain-intelligence`                                   | Lookalike card, attack vectors, visual diff, RDAP telemetry, lifecycle, FAQ                                                                                                                  |
| `/solutions/trademark-intelligence`                                | Watch card, interactive matching pillars, scroll-linked workflow, case view, FAQ                                                                                                             |
| `/solutions/app-intelligence`, `/solutions/investigation-evidence` | App impersonation; cases, evidence vault, grounded assistant, drafting flow                                                                                                                  |
| `/resources`, `/resources/:slug`                                   | Searchable, filterable library of six real guides (`src/content/resources.ts`)                                                                                                               |
| `/about`, `/contact`                                               | Company principles; demo-request form → `POST /api/v1/demo-requests`                                                                                                                         |
| `/status`                                                          | Live system status (also shown in the footer)                                                                                                                                                |

**Content honesty.** The Stitch designs contained invented claims (Fortune 500 customers,
SOC 2 / ISO 27001 certifications, accuracy and latency figures, testimonials, logos of
trademark offices). These were replaced with accurate copy. Product visuals use sample data
and carry an "Illustrative example" tag; the footer says so too.

**Design system v2.** The first version looked too close to the usual brand-protection
template, so the site was rebuilt on a new design system (`docs/DESIGN-SYSTEM.md`): floating
island header with a ⌘K search, light canvas with framed dark product stages, plain-language
copy with technical names on a secondary "Under the hood" line, numbered chapters, and a
closing contained call-to-action panel. The brand palette from the product brief is unchanged.

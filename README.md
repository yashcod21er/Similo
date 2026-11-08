# Similo

AI-powered brand protection and digital risk intelligence platform. Organisations register
their protected brands. Similo then monitors domains, apps and trademark publications
for look-alikes, explains why each one was flagged, and supports analysts through
investigation, evidence collection and legal drafting. A person always makes the final decision.

> **Status:** Phases 1 (foundation), 2 (accounts, organisations and roles), 3 (public website)
> and 4 (brand management) are complete, on MongoDB Atlas. Phase 5 (first domain monitoring) is next.
> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#roadmap) and [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Repository layout

The code is split into three parts, one folder each:

```
.
├── frontend/   Website and dashboard: React + TypeScript + Vite + Tailwind (port 5173)
├── backend/    REST API: Node.js + Express + TypeScript + MongoDB (port 4000)
├── ai/         AI service: Python + FastAPI (port 8000)
├── docs/
│   ├── ARCHITECTURE.md   System design, decisions, risks, roadmap
│   ├── BRAND.md          Logo and brand guidelines
│   ├── CONVENTIONS.md    Coding and project conventions
│   └── DESIGN-SYSTEM.md  Website design system v2 ("Clarity")
└── package.json  npm workspaces + scripts that run everything
```

How they connect: the browser loads the **frontend**, which calls the **backend** at `/api/v1/…`.
Only the backend reads and writes MongoDB Atlas and calls the **AI service**.

Each folder has its own guide to what is inside: [frontend/README.md](frontend/README.md),
[backend/README.md](backend/README.md) and [ai/README.md](ai/README.md).

## Prerequisites

| Tool    | Version                                | Check                                                  |
| ------- | -------------------------------------- | ------------------------------------------------------ |
| Node.js | ≥ 22.12 (24 recommended, see `.nvmrc`) | `node --version`                                       |
| npm     | ≥ 10                                   | `npm --version`                                        |
| Python  | 3.12                                   | `py -3.12 --version`                                   |
| uv      | ≥ 0.5                                  | `uv --version` ([install](https://docs.astral.sh/uv/)) |

Also needed:

- **MongoDB Atlas** connection string (accounts and sign-in need it). Without it the website
  and API still run, the status page shows the database as "not configured", and sign-in
  answers "the database is not connected".
- **Redis.** Not needed until Phase 5 (background jobs).

## Quick start

```bash
# 1. Install the JavaScript dependencies for every workspace
npm install

# 2. Install the Python dependencies (creates ai/.venv)
uv sync --directory ai

# 3. Create local environment files from the templates (Windows: use `copy`)
cp backend/.env.example backend/.env
cp ai/.env.example ai/.env
#    Then set MONGODB_URI in backend/.env if you have an Atlas cluster.

# 4. Start the frontend, backend and AI service together
npm run dev
```

Open <http://localhost:5173> for the website, or <http://localhost:5173/status> to check that
every part of the system can reach the others. The "Request a demo" form at `/contact` saves
to MongoDB; until `MONGODB_URI` is set it shows an honest "could not save" message.

| URL                                              | What it is                             |
| ------------------------------------------------ | -------------------------------------- |
| http://localhost:5173                            | Website and dashboard (frontend)       |
| http://localhost:4000/api/v1/health              | API liveness                           |
| http://localhost:4000/api/v1/health/dependencies | Database and AI service status         |
| http://localhost:8000/health                     | AI service liveness                    |
| http://localhost:8000/docs                       | AI service interactive docs (dev only) |

## Scripts (run from the repository root)

| Command                                            | What it does                                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                      | Run the frontend, backend and AI service together (`dev:frontend`, `dev:backend`, `dev:ai` run one)       |
| `npm test`                                         | Frontend and backend tests (Vitest)                                                                       |
| `npm run test:ai`                                  | AI service tests (pytest)                                                                                 |
| `npm run typecheck`                                | TypeScript type check for all workspaces                                                                  |
| `npm run lint` / `npm run lint:ai`                 | ESLint / Ruff                                                                                             |
| `npm run format`                                   | Format with Prettier                                                                                      |
| `npm run build`                                    | Production build of the backend and frontend                                                              |
| `npm run check`                                    | Type check + lint + all tests (run this before committing)                                                |
| `npm run seed:demo`                                | Create a sample organisation with one user per role and one sample brand (prints a new password each run) |
| `npm run seed:demo -- --remove`                    | Delete that sample organisation, its users and its brands                                                 |
| `npm run auth:reset-password -- --email <address>` | Set a new random password for an account (development only)                                               |

## Accounts, organisations and roles (Phase 2)

1. Open <http://localhost:5173/sign-up>. Signing up creates your organisation and makes you its **Owner**.
2. In the dashboard (`/app`), **Members → Invite people** creates a one-time invitation link
   (valid for 7 days). Similo doesn't send email yet, so copy the link and send it yourself.
3. To try every role quickly, run `npm run seed:demo`. It creates **Demo Co (sample data)** with
   one user per role on the reserved `demo.similo.test` domain, plus one sample brand, and prints
   their password.

| Role                  | Can do                                                        |
| --------------------- | ------------------------------------------------------------- |
| Owner                 | Everything, including managing other Owners                   |
| Admin                 | Invite and remove people, change roles, organisation settings |
| Investigation Analyst | Work on alerts and investigations (Phases 5–7)                |
| Legal Reviewer        | Read the audit log; review legal drafts (Phases 7–8)          |
| Viewer                | See everything, change nothing                                |

How it is protected: passwords must be at least 10 characters and are hashed with Argon2id.
Signing in sets two HTTP-only, SameSite cookies that page scripts can't read: a short-lived
access token (a signed JWT, valid for 15 minutes) and a random refresh token, of which MongoDB
stores only a hash, that quietly renews the access token for up to 30 days. Your role and
membership are checked again on every request, so a role change or removal from the
organisation applies at once. One honest trade-off: signing out (or changing your password)
deletes refresh tokens immediately, but an access token someone had already copied would keep
working for at most 15 more minutes. Sign-in is rate-limited and pauses for 15 minutes after
5 wrong passwords; every query is scoped to the signed-in organisation; data-changing requests
from other websites are rejected; important actions are written to an append-only audit log.
Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#6-multi-tenancy-and-authorisation-built-in-phase-2).

Not yet: email verification and password reset by email (an email service comes later; until
then `npm run auth:reset-password` covers development), two-factor sign-in, single sign-on, and
belonging to more than one organisation.

## Brand management (Phase 4)

A **brand** is something your organisation wants protected, such as a company or product name.
In the dashboard, **Brands** lets you record for each brand:

- its name, a short description and **keywords** (other spellings and names people use);
- its **official domains** (typed any way, e.g. `https://www.Example.com/shop`; Similo stores
  `example.com`, and international names such as `bücher.de` in their standard `xn--` form);
- its **trademarks**, entered by hand: the mark, the office (USPTO, EUIPO, WIPO, IP India,
  UKIPO or other), the registration or application number, the Nice classes and the status;
- up to 5 **logos** (PNG, JPEG or WebP, at most 1 MB each; the file's contents are checked,
  not just its name, and SVG files are not accepted because they can contain scripts);
- **monitoring settings**: which channels to watch, how sensitive alerts should be, and whether
  to email alerts.

Monitoring itself starts in Phase 5. Today these settings are saved but nothing scans yet, and
the dashboard says so.

| Role                                          | Brands                         |
| --------------------------------------------- | ------------------------------ |
| Owner, Admin                                  | Add, change and delete brands  |
| Investigation Analyst, Legal Reviewer, Viewer | See all brands; change nothing |

Limits: 50 brands per organisation; per brand 50 keywords, 50 domains, 100 trademarks and 5 logos.
Every change appears in the audit log. `npm run seed:demo` adds one made-up brand,
**Northwind Coffee (sample data)**, using reserved `.example` domains. API details:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#phase-4--brand-management).

## Connecting MongoDB Atlas

1. Create a free M0 cluster at <https://cloud.mongodb.com>. M0 also supports Atlas Vector Search, which the RAG phase needs.
2. **Database Access:** create a database user with a strong password.
3. **Network Access:** add your current IP address.
4. **Connect → Drivers:** copy the `mongodb+srv://…` string into `MONGODB_URI` in `backend/.env`.
5. Restart `npm run dev`. The status page should show **MongoDB Atlas: Operational**.
6. Run `npm test --workspace @similo/backend`. The database integration tests (normally skipped) now run
   against your cluster; the auth test uses a temporary database that it deletes afterwards.

## Troubleshooting

- **The project is inside OneDrive.** OneDrive tries to sync `node_modules` and `.venv`
  (tens of thousands of files), which is slow and can cause `EPERM` file-lock errors.
  Move the project outside OneDrive (for example `C:\dev\similo`), delete
  `node_modules` and `ai/.venv`, then reinstall.
- **Port already in use.** Another copy of the app is still running. Stop it, or change `PORT` in `backend/.env`.
- **`querySrv ECONNREFUSED` when connecting to Atlas.** Node.js could not look up the cluster's DNS
  SRV record (on some PCs Node asks `127.0.0.1` for DNS, where nothing answers). Use the
  **standard connection string** instead of `mongodb+srv://`: list the three hosts from
  `Resolve-DnsName -Type SRV _mongodb._tcp.<cluster-host>` and the options from
  `Resolve-DnsName -Type TXT <cluster-host>`, in the form
  `mongodb://<user>:<password>@host1:27017,host2:27017,host3:27017/?tls=true&replicaSet=<from TXT>&authSource=admin&retryWrites=true&w=majority`.
- **`npm warn allow-scripts … esbuild`.** npm 11 blocks dependency install scripts until you approve them.
  Everything works without approving them (verified). You can approve with `npm approve-scripts esbuild`.

# Similo

AI-powered brand protection and digital risk intelligence platform. Organisations register
their protected brands. Similo then monitors domains, apps and trademark publications
for look-alikes, explains why each one was flagged, and supports analysts through
investigation, evidence collection and legal drafting. A person always makes the final decision.

> **Status:** Phase 1 (foundation) and Phase 3 (public website, design system v2) are complete.
> MongoDB Atlas is connected (verified by the database integration test). Phase 2 (authentication) is next.
> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#roadmap) and [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).

## Repository layout

```
.
├── apps/
│   ├── web/          React + TypeScript + Vite + Tailwind (port 5173)
│   └── api/          Node.js + Express + TypeScript REST API (port 4000)
├── services/
│   └── ai/           Python + FastAPI AI service (port 8000)
├── docs/
│   ├── ARCHITECTURE.md   System design, decisions, risks, roadmap
│   ├── BRAND.md          Logo and brand guidelines
│   ├── CONVENTIONS.md    Coding and project conventions
│   └── DESIGN-SYSTEM.md  Website design system v2 ("Clarity")
└── package.json      npm workspaces + scripts that run everything
```

## Prerequisites

| Tool    | Version                                | Check                                                  |
| ------- | -------------------------------------- | ------------------------------------------------------ |
| Node.js | ≥ 22.12 (24 recommended, see `.nvmrc`) | `node --version`                                       |
| npm     | ≥ 10                                   | `npm --version`                                        |
| Python  | 3.12                                   | `py -3.12 --version`                                   |
| uv      | ≥ 0.5                                  | `uv --version` ([install](https://docs.astral.sh/uv/)) |

Optional for Phase 1:

- **MongoDB Atlas** connection string. Without it the API still runs, and the status page shows the database as "not configured".
- **Redis.** Not needed until Phase 5 (background jobs).

## Quick start

```bash
# 1. Install the JavaScript dependencies for every workspace
npm install

# 2. Install the Python dependencies (creates services/ai/.venv)
uv sync --directory services/ai

# 3. Create local environment files from the templates (Windows: use `copy`)
cp apps/api/.env.example apps/api/.env
cp services/ai/.env.example services/ai/.env
#    Then set MONGODB_URI in apps/api/.env if you have an Atlas cluster.

# 4. Start the web app, API and AI service together
npm run dev
```

Open <http://localhost:5173> for the website, or <http://localhost:5173/status> to check that
every part of the system can reach the others. The "Request a demo" form at `/contact` saves
to MongoDB; until `MONGODB_URI` is set it shows an honest "could not save" message.

| URL                                              | What it is                             |
| ------------------------------------------------ | -------------------------------------- |
| http://localhost:5173                            | Web app                                |
| http://localhost:4000/api/v1/health              | API liveness                           |
| http://localhost:4000/api/v1/health/dependencies | Database and AI service status         |
| http://localhost:8000/health                     | AI service liveness                    |
| http://localhost:8000/docs                       | AI service interactive docs (dev only) |

## Scripts (run from the repository root)

| Command                            | What it does                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`                      | Run the web app, API and AI service together (`dev:web`, `dev:api`, `dev:ai` run one) |
| `npm test`                         | Web and API tests (Vitest)                                                            |
| `npm run test:ai`                  | AI service tests (pytest)                                                             |
| `npm run typecheck`                | TypeScript type check for all workspaces                                              |
| `npm run lint` / `npm run lint:ai` | ESLint / Ruff                                                                         |
| `npm run format`                   | Format with Prettier                                                                  |
| `npm run build`                    | Production build of the API and web app                                               |
| `npm run check`                    | Type check + lint + all tests (run this before committing)                            |

## Connecting MongoDB Atlas

1. Create a free M0 cluster at <https://cloud.mongodb.com>. M0 also supports Atlas Vector Search, which the RAG phase needs.
2. **Database Access:** create a database user with a strong password.
3. **Network Access:** add your current IP address.
4. **Connect → Drivers:** copy the `mongodb+srv://…` string into `MONGODB_URI` in `apps/api/.env`.
5. Restart `npm run dev`. The status page should show **MongoDB Atlas: Operational**.
6. Run `npm test --workspace @similo/api`. The database integration test (normally skipped) now runs against your cluster.

## Troubleshooting

- **The project is inside OneDrive.** OneDrive tries to sync `node_modules` and `.venv`
  (tens of thousands of files), which is slow and can cause `EPERM` file-lock errors.
  Move the project outside OneDrive (for example `C:\dev\similo`), delete
  `node_modules` and `services/ai/.venv`, then reinstall.
- **Port already in use.** Another copy of the app is still running. Stop it, or change `PORT` in `apps/api/.env`.
- **`querySrv ECONNREFUSED` when connecting to Atlas.** Node.js could not look up the cluster's DNS
  SRV record (on some PCs Node asks `127.0.0.1` for DNS, where nothing answers). Use the
  **standard connection string** instead of `mongodb+srv://`: list the three hosts from
  `Resolve-DnsName -Type SRV _mongodb._tcp.<cluster-host>` and the options from
  `Resolve-DnsName -Type TXT <cluster-host>`, in the form
  `mongodb://<user>:<password>@host1:27017,host2:27017,host3:27017/?tls=true&replicaSet=<from TXT>&authSource=admin&retryWrites=true&w=majority`.
- **`npm warn allow-scripts … esbuild`.** npm 11 blocks dependency install scripts until you approve them.
  Everything works without approving them (verified). You can approve with `npm approve-scripts esbuild`.

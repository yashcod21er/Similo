# Development conventions

## General

- Run `npm run check` before every commit. It runs the type check, lint and all tests (TypeScript and Python).
- Never commit `.env` files. When you add a variable, add it to the matching `.env.example`
  with a comment, and (in the backend) to the Zod schema in `backend/src/config/env.ts`.
- No fake data presented as real. Sample data lives in seed scripts or fixtures and is labelled
  `demo` / `fixture` everywhere it appears.
- Never claim an integration works until a test or a manual run proves it. Document every external API's limits in `docs/ARCHITECTURE.md` §7.
- The product name is **Similo** in prose and UI (never "Similo AI"). Code, package, service and
  database names use lowercase `similo` (`@similo/frontend`, `@similo/backend`, `similo-api`). Logo rules: `docs/BRAND.md`.

## TypeScript (frontend and backend)

- Strict mode, plus `noUncheckedIndexedAccess`: indexing an array or record may return `undefined`, so handle that case.
- `import type` for type-only imports (enforced by ESLint and `verbatimModuleSyntax`).
- Backend: relative imports end in `.js` (`import { x } from './x.js'`), because that is what Node runs after compiling.
- Frontend: import from `src` with the `@/` alias (`import { apiRequest } from '@/lib/api-client'`).
- Unused variables or arguments that must exist are prefixed with `_`.

## Backend structure (`backend/`)

```
src/
  config/        env parsing (one place)
  lib/           small shared helpers (errors, logger, responses)
  middleware/    Express middleware
  clients/       HTTP clients for other services
  db/            connection; Mongoose models live in each module
  modules/<feature>/
    <feature>.routes.ts      URL → controller
    <feature>.controller.ts  HTTP in/out only (thin)
    <feature>.service.ts     business logic (no req/res)
    <feature>.schemas.ts     Zod request schemas
    <feature>.model.ts       Mongoose model
    <feature>.types.ts       shared types
  routes.ts      mounts each module under /api/v1
  app.ts         builds the Express app (no listen)
  server.ts      reads config, wires dependencies, listens
```

- Throw `AppError(status, CODE, message)` for expected failures. Let unexpected errors bubble up to the central handler.
- Every query on tenant data takes `organizationId` as its first argument, and services take it
  only from `getAuth(res)` (the session), never from the body, query or URL.
- Protected routes: mount behind `requireAuth`, then `requirePermission('<permission>')` per route.
  New permissions go in `modules/organizations/roles.ts` (the single source of truth).
- Security-relevant actions call `auditService.record(...)`; there is no update or delete for audit events.

## Frontend structure (`frontend/`)

```
src/
  app/          router, query client, providers
  components/
    ui/         design-system primitives (Button, layout: Eyebrow/Pill/Stage, SpotlightCard, Reveal, Accordion, Logo)
    site/       header, footer, ⌘K command menu, navigation config (one source for all menus)
    marketing/  reusable page sections (SplitHero, CtaBand, ProcessSteps, FeatureCard)
    visuals/    AlertCard, product previews and the hero motion visual (canvas + SVG)
  content/      typed site content (resource articles)
  features/<feature>/   API hooks + pages/components for one feature
  pages/        route-level pages; big pages split into a folder (pages/home/*)
  lib/          framework-agnostic helpers (api-client, lookalikes)
  styles/       Tailwind entry + design tokens
```

- Server data goes through TanStack Query hooks (`features/<x>/api.ts`), not `useEffect` plus `fetch`.
- Signed-in pages live under the `/app` route (wrapped in `RequireAuth`). Use `useCan(permission)`
  only to show or hide controls; the API is the security boundary.
- Every data view handles loading, empty, error and permission-restricted states.
- Follow `docs/DESIGN-SYSTEM.md` (v2 "Clarity"): plain words first, light canvas, dark product
  visuals only inside `Stage`/`ProductWindow`, one `<em>` accent per headline.
- Use colour tokens (`bg-midnight`, `text-crimson`, …), not hex values. Never use purple or violet.
- Animations: entrance/scroll via `<Reveal>`/`<RevealGroup>`; shared easing from `@/lib/motion`.
  Any looping animation (`repeat: Infinity`) must be switched off when `useReducedMotion()` is true.
- Marketing copy: no invented metrics, customers, certifications or testimonials. Product
  visuals with sample data carry `<ExampleTag />`.
- New pages are added to `app/router.tsx` with `lazy` (code-split) and to `site/navigation.ts`.

## Python (AI service, `ai/`)

- Format and lint with Ruff (`npm run lint:ai`). Type hints on all public functions.
- One router module per capability in `app/api/`. Algorithms go in plain modules that can be tested without HTTP.
- Fuzzy, semantic and visual scores are separate, named signals. Never merge them into an unlabelled number.

## Tests

- Backend: `backend/test/*.test.ts`. Use `buildTestApp()` with fake dependencies. Name integration tests `*.integration.test.ts` and skip them automatically when credentials are missing.
- Frontend: `*.test.tsx` next to the component. Stub `fetch`, never a real network.
- AI service: `ai/tests/test_*.py`.
- Test failure paths, not only the happy path.

## Git

- Branch per phase/feature (`phase-2/auth`), small commits, imperative messages (`Add session middleware`).

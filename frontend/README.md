# Similo frontend

The public website and the signed-in dashboard, built with React 19, TypeScript, Vite and
Tailwind CSS 4. It runs at <http://localhost:5173>.

The frontend never talks to the database or the AI service. It only calls the backend at
`/api/v1/…`. In development, Vite forwards those requests to <http://localhost:4000> (change
this with `API_PROXY_TARGET` in `frontend/.env`).

From the repository root:

```bash
npm run dev:frontend                    # run only the frontend (npm run dev starts all three parts)
npm test --workspace @similo/frontend   # its tests (Vitest + Testing Library)
```

## What is where

```
frontend/
├── index.html               The one HTML page; React fills it in
├── public/                  Served as-is: favicon, app icon, logo files (brand/)
└── src/
    ├── main.tsx             Starting point: mounts the app
    ├── app/                 Router (which URL shows which page) and the data-fetching client
    ├── pages/               Public website pages
    │   ├── home/            Home page sections: hero, brand checker, how it works, FAQ
    │   ├── solutions/       Domain, app, trademark and investigation pages
    │   └── resources/       Article list and article page
    ├── features/            Product features: each folder holds its screens, API calls and tests
    │   ├── auth/            Sign in, sign up, accept an invitation, "must be signed in" guard
    │   ├── app-shell/       Dashboard layout (sidebar, header) and the overview page
    │   ├── organization/    Members, invitations, audit log, settings
    │   ├── demo-request/    The "Request a demo" form
    │   └── system-status/   The /status page
    ├── components/
    │   ├── ui/              Building blocks: buttons, dialogs, form fields, logo
    │   ├── site/            Website header, footer, menu and search (Ctrl+K)
    │   ├── marketing/       Section layouts shared by website pages
    │   └── visuals/         Product illustrations (clearly labelled sample data)
    ├── content/             Text of the resource articles
    ├── lib/                 Helpers: API client, formatting, the look-alike checker
    ├── styles/index.css     Design tokens: colours, fonts, shadows
    └── test/setup.ts        Test setup
```

## How a screen gets its data

`MembersPage.tsx` calls `useMembers()` from `features/organization/api.ts` (a TanStack Query
hook), which uses `lib/api-client.ts` to request `GET /api/v1/organization/members` from the
backend. The hook caches the answer and refreshes it after changes.

## Rules worth knowing

- The backend enforces every permission. `useCan()` only hides buttons a person can't use.
- Never put secrets in frontend code or in `VITE_` variables: they end up in public JavaScript.
- New pages follow [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md). Coding rules are in
  [docs/CONVENTIONS.md](../docs/CONVENTIONS.md).

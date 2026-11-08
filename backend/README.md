# Similo backend

The REST API, built with Node.js, Express 5 and TypeScript. It stores data in MongoDB Atlas
(through Mongoose) and runs at <http://localhost:4000>; every route starts with `/api/v1`.

It is the only part that reads and writes the database or calls the AI service, and it checks
sign-in, roles and organisation boundaries on every request.

From the repository root:

```bash
cp backend/.env.example backend/.env    # once (Windows: copy); then set MONGODB_URI. Never commit .env
npm run dev:backend                     # run only the backend (npm run dev starts all three parts)
npm test --workspace @similo/backend    # its tests (Vitest + Supertest)
npm run seed:demo                       # sample organisation with one user per role
```

## What is where

```
backend/
├── .env.example             Settings template (copy to .env)
├── src/
│   ├── server.ts            Starting point: reads settings, connects to MongoDB, listens on port 4000
│   ├── app.ts               Builds the Express app: security headers, CORS, cookies, routes, errors
│   ├── routes.ts            URL map: which module answers which /api/v1/... path
│   ├── config/env.ts        Reads and validates the settings in .env
│   ├── db/                  MongoDB connection, indexes, transactions
│   ├── middleware/          Runs before the routes: sign-in, permission and origin checks, logging, errors
│   ├── modules/             One folder per feature
│   │   ├── auth/            Sign up, sign in, sign out, change password, join by invitation;
│   │   │                    JWT access tokens (access-token.ts) and the sign-in cookies
│   │   ├── organizations/   Organisation, members, invitations; roles.ts says which role can do what
│   │   ├── users/           User accounts
│   │   ├── sessions/        Refresh tokens (stored hashed) that renew the 15-minute access token
│   │   ├── brands/          Brands, official domains, trademarks, logos, monitoring settings
│   │   ├── audit/           Audit log
│   │   ├── demo-requests/   "Request a demo" form submissions
│   │   └── health/          Health checks used by the status page
│   ├── clients/             Calls to other services (the AI service)
│   └── lib/                 Helpers: errors, password hashing, tokens, validation, logger
├── scripts/                 seed-demo.ts and reset-password.ts (development tools)
└── test/                    Tests; *.integration.test.ts run against the real database
```

## How a request flows

```
request → middleware        logging, origin check, sign-in, permission
        → x.routes.ts       reads the request and validates the input (x.schemas.ts, Zod)
        → x.service.ts      business rules, e.g. "an organisation always keeps an Owner"
        → x.repository.ts   database queries; organisation data is always filtered by organisation
        → x.model.ts        the shape of the MongoDB collection
```

Most modules follow this pattern, so a new feature is a new folder in `src/modules/` with the
same files (`brands/` from Phase 4 is a recent example; it also has `domain-name.ts` for domain
clean-up and `logo-sniff.ts`, which checks uploaded logos by their first bytes).

## Rules worth knowing

- Every query on organisation data takes `organizationId` as its first argument, and services
  take it only from the signed-in session, never from the request body or URL.
- New permissions go in `src/modules/organizations/roles.ts`.
- File uploads (only brand logos so far) are parsed with `multer` in memory with strict limits,
  and their type is decided by the file's bytes, never by its name.
- The design is explained in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md). Coding rules are
  in [docs/CONVENTIONS.md](../docs/CONVENTIONS.md).

# QA Management Platform

A production-oriented, multi-tenant SaaS platform for managing the full quality
assurance lifecycle — requirements, test cases, plans, runs, executions,
defects, automation ingestion and reporting — built as a **modular monolith**.

> Reference implementation for a technical assignment. It prioritizes correct
> architecture, strict multi-tenant isolation, server-enforced RBAC, validation,
> error handling, testing and deployment readiness over feature breadth.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, RSC, Server Actions, Route Handlers) |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) + Lucide |
| Forms / validation | React Hook Form + Zod |
| Database | PostgreSQL (Neon serverless driver) |
| ORM / migrations | Drizzle ORM + Drizzle Kit |
| Auth | Better Auth (email/password, sessions, verification, reset) |
| Authorization | Custom, centralized RBAC (`src/lib/authorization`) |
| Charts / tables | Recharts / TanStack Table (+ server pagination) |
| File storage | Vercel Blob (metadata-only in DB) |
| Email | Resend (console fallback in dev) |
| Testing | Vitest + Testing Library + Playwright |
| Deployment | Vercel |

---

## Quick start

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env.local
#   → set DATABASE_URL to your Neon (or Postgres) connection string
#   → set BETTER_AUTH_SECRET (openssl rand -base64 32)

# 3. Create the schema
pnpm db:migrate      # apply migrations to a fresh database

# 4. Seed deterministic dev data (two isolated tenants)
pnpm db:seed

# 5. Run
pnpm dev             # http://localhost:3000
```

### Development credentials (seed data)

All seeded users share the password **`Password123!`** (development only —
never a production credential).

| Email | Tenant | Org role |
| --- | --- | --- |
| `owner@acme.test` | Acme QA | OWNER |
| `admin@acme.test` | Acme QA | ADMIN |
| `qa@acme.test` | Acme QA | MEMBER (QA_ENGINEER on SHOP) |
| `viewer@acme.test` | Acme QA | VIEWER |
| `owner@globex.test` | Globex Testing | OWNER |
| `qa@globex.test` | Globex Testing | MEMBER |

Acme and Globex are **separate tenants** — signing in as an Acme user never
exposes any Globex data.

---

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` (strict) |
| `pnpm lint` | ESLint (next/core-web-vitals + typescript) |
| `pnpm test` | Vitest unit/integration tests |
| `pnpm test:e2e` | Playwright E2E (`E2E_SEEDED=1` for full journeys) |
| `pnpm verify` | typecheck + lint + test + build (CI gate) |
| `pnpm db:generate` | Generate SQL migration from schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed dev data |
| `pnpm db:studio` | Drizzle Studio |

---

## Architecture

A **modular monolith**: one deployable, organized by domain module so any module
can later be extracted into a service. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full write-up (ERD, route
list, RBAC matrix, tenancy & security strategy).

```
src/
  app/                      # Next.js App Router (routes, API handlers)
    (auth)/                 #   sign-in / sign-up / reset
    (app)/                  #   authenticated shell (dashboard, projects, …)
    api/                    #   /api/auth/*, /api/v1/*
  components/               # UI primitives (shadcn) + shell + charts
  features/                 # Domain modules (UI + validation + services + actions)
    organizations/ projects/ test-cases/ automation/ integrations/ dashboard/ …
  db/                       # Drizzle schema, client, migrations, seed
    schema/                 #   one file per domain area
  lib/
    auth/                   # Better Auth + trusted server context (IDOR guards)
    authorization/          # Centralized RBAC (permissions + evaluation)
    validation/ errors/ email/ audit/ logging …
  server/
    http.ts                 # API response envelope + handler wrapper
    repositories/           # Tenant-scoped data access (always org-scoped)
  tests/                    # Test setup, DB harness, security tests
```

### Key design guarantees

- **Tenant isolation is structural.** Every repository function requires an
  `organizationId` and includes it in the `WHERE` clause. There is no
  `getProject(id)` that ignores tenancy — see
  `src/server/repositories/*`. Cross-tenant ids resolve to `404`, never data.
- **Authorization is centralized and server-enforced.** All access decisions
  flow through `src/lib/authorization` and the trusted context guards in
  `src/lib/auth/context.ts` (`requireOrgPermission`, `requireProjectPermission`).
  The client/UI never authorizes; hidden UI is never the security boundary.
- **Consistent errors.** `src/lib/errors.ts` maps a typed error taxonomy to
  HTTP status codes and strips internal details (stack traces, SQL) from client
  responses while logging them server-side.
- **Immutable audit log.** `recordAudit` is append-only; there are no
  update/delete paths.

---

## Automation & CI/CD integration

Automation is an **integration layer**, not in-process test execution
(`src/features/automation`). The `AutomationProvider` interface
(`createRun/startRun/getRunStatus/cancelRun/collectResults`) abstracts
providers; a `SimulatedProvider` ships for local demos, and results parsers
(e.g. JUnit XML → normalized model) demonstrate the adapter pattern.

External pipelines submit results to:

```
POST /api/v1/test-results
Authorization: Bearer qa_<prefix>_<secret>
Content-Type: application/json

{ "runName": "CI #128", "environment": "staging",
  "results": [ { "testRef": "SHOP-TC-001", "status": "PASSED", "durationMs": 512 } ] }
```

The token is authenticated by constant-time hash comparison (only a SHA-256
hash + lookup prefix are stored), the payload is Zod-validated, and results are
matched to existing test cases by reference — never trusted blindly.

---

## Testing

- **Unit / RBAC** (`src/lib/authorization/rbac.test.ts`) — exhaustive
  role→permission checks, privilege-escalation guard (no DB).
- **Parser** (`src/features/automation/parsers/junit.test.ts`).
- **Multi-tenant isolation** (`src/tests/security/tenant-isolation.test.ts`) —
  DB-backed proof that Org A cannot read Org B's project / test case / run /
  defect / attachment, and that id-substitution cannot cross tenants. Runs when
  `DATABASE_URL` is set (skips cleanly otherwise).
- **E2E** (`e2e/`) — smoke tests (no DB) + seeded authenticated journeys
  (`E2E_SEEDED=1`).

```bash
pnpm test                 # unit + integration (DB tests skip if no DATABASE_URL)
E2E_SEEDED=1 pnpm test:e2e
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the mapping of the
mandated security tests (TEST 1–10) to their implementations, and
[`docs/STATUS.md`](docs/STATUS.md) for exactly what is implemented vs. pending.

---

## Deployment (Vercel + Neon)

1. Create a Neon Postgres database; copy the pooled connection string.
2. Import the repo into Vercel.
3. Set env vars (Project → Settings → Environment Variables): `DATABASE_URL`,
   `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your deployment URL),
   `NEXT_PUBLIC_APP_URL`, `INTEGRATION_WEBHOOK_SECRET`, and optionally
   `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`.
4. Run migrations against production: `DATABASE_URL=... pnpm db:migrate`
   (from CI or locally). Do **not** edit the production schema by hand.
5. Deploy. Preview deployments get their own env; point them at a branch DB.

Environment variables are validated at runtime (`src/lib/env.ts`) — a missing
or malformed value fails fast with a clear message.

---

## License

Provided as an assignment reference implementation.

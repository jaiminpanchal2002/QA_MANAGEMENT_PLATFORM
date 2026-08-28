# Implementation status

Honest accounting of what is implemented in this pass ("Foundation + security
core") vs. what is scaffolded at the data/permission layer but does not yet have
full UI/API. Nothing here is fake: every visible feature has a real underlying
implementation, and pending items are labeled as such in the UI.

## Fully implemented (schema + tenancy + RBAC + validation + UI/API + tests)

- **Auth**: sign up, sign in, sign out, password reset, email verification
  (console transport in dev), sessions, protected routes, onboarding.
- **Organizations**: create, active-tenant resolution, org switcher, members
  list, roles displayed.
- **Projects**: full CRUD (UI create + REST `GET/POST/PATCH/DELETE`),
  tenant-scoped, unique key per org, server-side pagination + search, soft
  delete, audit.
- **Test cases**: create (with dynamic steps), list with server-side
  pagination/search/filter/sort, auto-generated per-project references, soft
  delete, bulk delete (repository), audit. Accessed within a project.
- **Dashboard**: real server-side aggregation — totals, pass rate, automation
  coverage, execution status distribution, execution trend, defects by severity,
  recent runs, recent activity. No hardcoded metrics.
- **Audit log**: append-only, immutable, viewable by OWNER/ADMIN.
- **Automation**: `AutomationProvider` interface + `SimulatedProvider` +
  JUnit parser (unit-tested).
- **CI/CD ingestion**: `POST /api/v1/test-results` with hashed-token auth +
  Zod validation + reference matching → creates an automated run with executions.
- **Security**: centralized RBAC, tenant-scoped repositories, IDOR guards,
  error taxonomy, redacting logger, security headers, env validation.
- **Testing**: RBAC unit tests, JUnit parser tests, DB-backed multi-tenant
  isolation tests, Playwright smoke + seeded journey specs.

## Modeled at data + permission layer; UI/API pending (next slices)

These have complete schema, tenant scoping and permission definitions, and (for
several) repositories/services — but not yet dedicated CRUD screens:

- **Requirements** — schema + tenancy done; no CRUD UI yet.
- **Test suites** — schema + membership join done; suite management UI pending
  (seed populates suites).
- **Test plans** — schema + items join + repository read done; planning UI pending.
- **Test runs / executions** — schema + repositories + ingestion done; manual
  run authoring/execution UI pending (seed + webhook populate runs).
- **Defects** — schema + repository (create/list/status) done; defect board UI
  pending (seed creates a linked defect).
- **Teams** — schema + membership done; team management UI pending.
- **Invitations** — schema done; invite flow UI/email pending.
- **Comments** — schema done; comment threads UI pending.
- **Attachments** — schema + tenant-scoped access done; Blob upload UI pending.
- **Notifications** — schema done; UI pending.
- **Reports export** — server aggregation done (dashboard); dedicated
  export/report pages pending.

The project-scoped module nav entries (`/test-cases`, `/test-plans`,
`/test-runs`, `/defects`, `/reports`) route to a landing that lists projects and
explains where the module is used — they are informational, not fake buttons.

## Verification performed in this pass

- `pnpm typecheck` — passes.
- `pnpm lint` — passes (warnings only).
- `pnpm test` — 19 pass; 6 DB-isolation tests run when `DATABASE_URL` is set.
- `pnpm build` — production build succeeds; all routes compile.
- `pnpm db:generate` — full 24-table schema generates a clean migration.

## To run the DB-backed proof end to end

```bash
# with a real Neon/Postgres DATABASE_URL in .env.local
pnpm db:migrate && pnpm db:seed
pnpm test            # the 6 tenant-isolation tests now execute
pnpm dev             # sign in as owner@acme.test / Password123!
```

# Architecture

## 1. Summary

A **modular monolith** on Next.js (App Router). One deployable; code is
organized by domain module (`src/features/*`, `src/server/repositories/*`,
`src/db/schema/*`) with clean seams so a module can be extracted into a service
later without rewrites.

Layering (dependencies point downward):

```
UI (RSC / Client)  →  Server Actions / Route Handlers
                        →  Services (features/*/service.ts)   ← auth + RBAC + audit
                          →  Repositories (server/repositories)  ← tenant-scoped SQL
                            →  Drizzle / Postgres
```

- **Services** establish the trusted context (who, which tenant, what role) and
  orchestrate validation → repository → audit. They never accept a client-supplied
  `organizationId`.
- **Repositories** are pure, tenant-scoped data access. Every function takes and
  filters by `organizationId`.

## 2. Technology choices & justification

- **Next.js App Router** — colocates server data access (RSC / Server Actions)
  with UI, minimizes client JS, and gives Route Handlers for a clean REST API.
- **Drizzle ORM** — typed SQL with first-class migrations; no heavy runtime,
  predictable queries, easy to scope every query by tenant.
- **Neon Postgres** — serverless Postgres that fits Vercel; the serverless
  driver works over WebSockets in serverless and locally.
- **Better Auth** — modern, self-hostable auth (email/password, sessions,
  verification, reset) with a Drizzle adapter; kept to *identity only* so the
  authorization model stays fully under our control.
- **Zod + RHF** — one validation source reused across API, actions and forms.
- **shadcn/ui + Tailwind** — accessible Radix primitives, no vendor lock-in,
  professional dense UI.

## 3. Database ERD (textual)

Identity (Better Auth): `user`, `session`, `account`, `verification`.

Tenancy & access:
- `organizations` (tenant root) 1—N `memberships` N—1 `user`
- `organizations` 1—N `invitations`, 1—N `teams` 1—N `team_members`
- `organizations` 1—N `projects` 1—N `project_members`

Test assets (all carry `organization_id` **and** `project_id`):
- `projects` 1—N `requirements`
- `projects` 1—N `test_suites`; `test_cases` N—M `test_suites` via `test_suite_cases`
- `projects` 1—N `test_cases` 1—N `test_steps`
- `test_cases` N—1 `requirements` (optional traceability)
- `projects` 1—N `test_plans` ; `test_plans` N—M `test_cases` via `test_plan_items`
- `projects` 1—N `test_runs` 1—N `test_executions` N—1 `test_cases`
- `projects` 1—N `defects` N—1 `test_executions` (optional link)

Cross-cutting (polymorphic via `entity_type` + `entity_id`, org-scoped):
- `comments`, `attachments` (Blob metadata only)
- `integrations`, `notifications`
- `audit_logs` (append-only)

Conventions: UUID PKs (text ids for Better Auth tables), `created_at/updated_at`
on every table, `deleted_at` soft delete where recoverability matters, FKs with
appropriate `on delete` (cascade within a tenant, `restrict` for owner refs,
`set null` for optional links). Uniqueness is **tenant-scoped** — e.g. project
`key` is unique per organization; test-case `reference` unique per project.

Indexes exist on `organization_id`, `project_id`, `status`, `severity`,
`priority`, `created_at`, foreign keys, and search columns.

## 4. Route / API list

Pages (App Router):

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing (static) |
| `/sign-in`, `/sign-up`, `/reset-password` | Auth |
| `/onboarding` | Create first organization |
| `/dashboard` | Org-wide QA metrics (real aggregation) |
| `/projects`, `/projects/[id]` | Project list (paginated) + detail with test cases |
| `/test-cases`, `/test-plans`, `/test-runs`, `/defects`, `/reports` | Project-scoped module entries |
| `/settings`, `/settings/audit` | Members + immutable audit log |

APIs (Route Handlers, consistent `{ success, data|error, meta? }` envelope):

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `*` | `/api/auth/[...all]` | Better Auth | sign-in/up/out, session, verify, reset |
| `GET` | `/api/v1/projects` | session | list (page, search, status) |
| `POST` | `/api/v1/projects` | session + `project.create` | create |
| `GET` | `/api/v1/projects/[id]` | session + `project.view` | 404 cross-tenant |
| `PATCH` | `/api/v1/projects/[id]` | session + `project.update` | update |
| `DELETE` | `/api/v1/projects/[id]` | session + `project.delete` | soft delete |
| `POST` | `/api/v1/test-results` | integration token | CI/CD result ingestion |

## 5. RBAC matrix

Two role dimensions. Org OWNER/ADMIN implicitly hold **all** project permissions
in their tenant. A plain member needs an explicit project role to access a project.

Organization roles (org-scoped permissions):

| Permission | OWNER | ADMIN | MEMBER | VIEWER |
| --- | :-: | :-: | :-: | :-: |
| organization.view | ✅ | ✅ | ✅ | ✅ |
| organization.update | ✅ | ✅ | — | — |
| organization.delete | ✅ | — | — | — |
| organization.manage_members | ✅ | ✅ | — | — |
| team.create/update/delete | ✅ | ✅ | — | — |
| project.create | ✅ | ✅ | ✅ | — |
| integration.manage | ✅ | ✅ | — | — |
| audit.view | ✅ | ✅ | — | — |
| settings.update | ✅ | ✅ | — | — |

Project roles (project-scoped permissions, abbreviated):

| Capability | PROJECT_ADMIN | QA_LEAD | QA_ENGINEER | DEVELOPER | VIEWER |
| --- | :-: | :-: | :-: | :-: | :-: |
| project.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| project.update | ✅ | ✅ | — | — | — |
| project.delete | ✅ | — | — | — | — |
| testcase.create/update | ✅ | ✅ | ✅ | — | — |
| testcase.delete | ✅ | ✅ | — | — | — |
| testcase.execute / testrun.execute | ✅ | ✅ | ✅ | — | — |
| testplan.create/update | ✅ | ✅ | ✅ | — | — |
| testrun.cancel | ✅ | ✅ | — | — | — |
| defect.create/update | ✅ | ✅ | ✅ | ✅ | — |
| defect.assign/delete | ✅ | ✅ | — | — | — |
| report.view / report.export | ✅ | ✅ | view | view | view |
| everything else | — | — | — | — | read-only |

Privilege-escalation guard (`canAssignOrgRole`): a member can assign only roles
at or below their own; only OWNER can grant OWNER.

## 6. Multi-tenancy strategy

- **Tenant = organization.** Every tenant-owned row carries `organization_id`.
- **Active tenant** is derived from the session + a validated cookie
  (`getOrgContext`) — it is always checked against real memberships, so a
  client-forged cookie cannot select an org the user isn't in.
- **Repositories are the enforcement layer**: no query runs without an
  `organization_id` filter. Services never accept a client `organizationId`.
- **IDOR prevention**: project-scoped access goes through
  `requireProjectPermission(projectId, permission)`, which (1) resolves the
  tenant, (2) loads the project *within that tenant only* (missing ⇒ 404), (3)
  resolves the project role, (4) checks the permission (missing ⇒ 403). A valid
  id from another tenant is indistinguishable from a non-existent one.

## 7. Security strategy

- Server-enforced auth + RBAC on every action/handler/read; middleware is a UX
  redirect only, never the security boundary.
- Better Auth: hashed passwords, http-only secure session cookies, email
  verification & reset; secrets only via env.
- Input validation with Zod at every boundary (bodies, params, query, webhooks).
- Consistent error taxonomy; internal details never leak to clients; detailed
  server logs with sensitive-key redaction (`src/lib/logger.ts`).
- Integration webhooks authenticated by hashed bearer tokens (constant-time
  compare); payloads validated and matched, never trusted.
- Security headers set in `next.config.mjs` (HSTS, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Attachments store metadata only; Blob access is authorized per request.
- Append-only audit log for sensitive actions.

## 8. Testing strategy & the mandated security tests

| # | Scenario | Where |
| --- | --- | --- |
| 1 | Org A cannot access Org B project | `tenant-isolation.test.ts` |
| 2 | …test case | `tenant-isolation.test.ts` |
| 3 | …test run | `tenant-isolation.test.ts` |
| 4 | …defect | `tenant-isolation.test.ts` |
| 5 | Viewer cannot perform admin operations | `rbac.test.ts` |
| 6 | QA Engineer cannot change org settings | `rbac.test.ts` |
| 7 | Unauthorized user cannot access private attachment | `tenant-isolation.test.ts` |
| 8 | Cannot modify another org's resource by changing ids | `tenant-isolation.test.ts` |
| 9 | User cannot escalate their own role | `rbac.test.ts` |
| 10 | Project-level permission restrictions work | `rbac.test.ts` |

RBAC tests (5,6,9,10) run with no database. Isolation tests (1–4,7,8) run against
`DATABASE_URL` and skip cleanly without one.

## 9. Future scaling strategy

- **Read scaling**: Neon read replicas; the repository layer is the single place
  to route reads.
- **Async work**: automation runs are already modeled asynchronously
  (`AutomationProvider` + external job ids); move queueing to a durable queue
  (e.g. QStash / SQS) and a worker without touching call sites.
- **Service extraction**: a module (e.g. automation, reporting) can be lifted
  out behind its existing service interface.
- **Caching**: add request-level and tag-based caching (`revalidateTag`) for
  heavy dashboard aggregations; precompute rollups for very large tenants.
- **Partitioning**: `audit_logs`/`test_executions` partition by time or tenant
  as volume grows; indexes are already tenant-first.
- **Row-Level Security**: as an added defense-in-depth, Postgres RLS keyed on a
  session GUC can back the application-level tenant scoping.

# Deployment guide (Vercel + Neon)

End-to-end steps to deploy the QA Management Platform.

## 1. Provision the database (Neon)

1. Create a project at [neon.tech](https://neon.tech) — it creates a database.
2. Copy the **pooled** connection string (host contains `-pooler`,
   ends with `?sslmode=require`). This is your `DATABASE_URL`.

## 2. Import the repo into Vercel

1. New Project → import `jaiminpanchal2002/QA_MANAGEMENT_PLATFORM`.
2. Framework preset: **Next.js** (auto-detected). Build/install commands are the
   defaults (`next build`, `pnpm install`).

## 3. Environment variables

Set these in **Project → Settings → Environment Variables** (Production +
Preview). Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

| Key | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `BETTER_AUTH_SECRET` | ✅ | 32-byte random (command above) |
| `INTEGRATION_WEBHOOK_SECRET` | ✅ | 32-byte random |
| `BETTER_AUTH_URL` | recommended | Your final URL, e.g. `https://your-app.vercel.app` (auto-derived from Vercel if unset) |
| `NEXT_PUBLIC_APP_URL` | recommended | Same as above |
| `ALLOW_SEED` | optional | `false` in production |
| `LOG_LEVEL` | optional | `info` |
| `BLOB_READ_WRITE_TOKEN` | optional | From Vercel → Storage → Blob (for uploads) |
| `RESEND_API_KEY` | optional | From resend.com (else emails log to console) |
| `EMAIL_FROM` | optional | Verified sender, e.g. `QA Platform <no-reply@domain.com>` |

> Do **not** set `NODE_ENV` — Vercel manages it.
> `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` auto-resolve from Vercel's
> `VERCEL_PROJECT_PRODUCTION_URL` when unset, so the first build never blocks on
> a URL you don't have yet. Set them explicitly for a custom domain.

## 4. First deploy

Deploy. Once you have the production URL, set `BETTER_AUTH_URL` and
`NEXT_PUBLIC_APP_URL` to it and redeploy (recommended for correct auth
cookies/redirects, especially with a custom domain).

## 5. Run migrations (once, and after schema changes)

From your machine, with the production `DATABASE_URL` exported:

```bash
pnpm db:migrate
```

Never edit the production schema by hand — always via a Drizzle migration.

## 6. Seed data

- **Local / demo only:** `pnpm db:seed` (requires `ALLOW_SEED=true`). Creates two
  isolated orgs (Acme QA, Globex Testing) with users, projects, cases, a plan, a
  run and a defect. Dev password for all seeded users: `Password123!`.
- **Production:** do **not** seed. Real users self-onboard by creating an
  organization on first sign-in.

## 7. Preview deployments

Every PR gets its own Vercel preview with its own env scope. Point previews at a
Neon **branch** database so preview data never touches production.

## 8. Local development

```bash
cp .env.example .env.local     # fill DATABASE_URL + BETTER_AUTH_SECRET
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev                       # http://localhost:3000
```

## 9. CI

`.github/workflows/ci.yml` runs typecheck + lint + tests + build on every push
and PR (pnpm 10, Node 22). The build fails if any step fails.

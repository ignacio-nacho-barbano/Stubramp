# Stubramp

A Ramp-style bill-pay / payables demo built as a technical test. It's a **Turborepo + pnpm monorepo** containing a Fastify API, a React SPA dashboard, a Next.js marketing site, and shared UI + contract packages.

> ⚠️ Technical test only — not a real product.

---

## Monorepo layout

| Path | Package | What it is |
| --- | --- | --- |
| `apps/api` | `@stubramp/api` | Fastify REST API — auth, multi-tenancy/RBAC, bill-pay domain. Prisma + Postgres (Neon). |
| `apps/app` | `@stubramp/app` | React 19 SPA dashboard (Vite + TanStack Router/Query/Table/Form). The main product UI. |
| `apps/website` | `@stubramp/website` | Next.js 16 static marketing site. |
| `packages/contracts` | `@stubramp/contracts` | Zod schemas, enums, permissions, and the bill state machine shared by API + app. |
| `packages/ui` | `@stubramp/ui` | Shared React component library (Ramp-style design system, Tailwind v4, Storybook). |
| `packages/typescript-config` | `@stubramp/typescript-config` | Shared `tsconfig` bases. |
| `packages/eslint-config` | `@stubramp/eslint-config` | Shared ESLint config. |
| `e2e` | — | Playwright end-to-end tests. |

---

## Tech stack

**Language & tooling**
- TypeScript everywhere · **pnpm 11** workspaces · **Turborepo** task runner
- Node **22.23+** (see `.node-version`)
- ESLint + Prettier · Vitest (unit) · Playwright (e2e)

**API (`apps/api`)**
- **Fastify 5** with `fastify-type-provider-zod` (Zod 4 request/response validation)
- **Prisma 7** ORM over **Postgres**, using the `@prisma/adapter-pg` driver adapter
- Auth: `@fastify/jwt` (short-lived access JWT) + opaque server-side refresh tokens, delivered as **httpOnly cookies** set by the API
- Hardening: `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, salt + server-side pepper password hashing
- Fail-fast env validation with Zod (`src/env.ts`)

**App (`apps/app`)**
- **React 19** SPA on **Vite 8**
- **TanStack** Router / Query / Table / Form
- Sentry error monitoring · Zod-validated env
- Talks to the API as a pure client (cookie-based sessions)

**Website (`apps/website`)**
- **Next.js 16** with `output: 'export'` (fully static)
- **Tailwind CSS v4**

**UI (`packages/ui`)**
- React component library, **Tailwind v4**, **Storybook 10**, ships raw `.tsx` source consumed by both apps

**Infrastructure**
- **API** → deployed to **Fly.io** (`stubramp-api`, region `iad`) via Docker; scale-to-zero single machine; migrations run as a Fly `release_command`
- **Database** → **Neon** serverless Postgres (pooled `DATABASE_URL` for the runtime, direct `DATABASE_URL_UNPOOLED` for migrations); local **Docker Postgres** available as an offline alternative
- **App** → **Cloudflare** (static SPA assets via Wrangler)
- **Website** → static export for **Cloudflare Pages**

---

## Prerequisites

- **Node 22.23+** and **pnpm 11** (`corepack enable` will pick up the pinned version)
- **Docker** (only if you use the local Postgres option below)

Install all dependencies from the repo root:

```sh
pnpm install
```

---

## Run everything locally

There are two ways to get a database. **Local Docker Postgres is the simplest for a fresh clone** (no accounts, no cloud). The default cloud path uses Neon.

### 1. Database + API

**Option A — Local Docker Postgres (recommended for local dev)**

```sh
cd apps/api

# secrets for local dev already live in .env.docker (committed, throwaway).
pnpm db:up               # start Postgres 17 in Docker (waits until healthy)
pnpm db:migrate:docker   # apply migrations to the local DB
pnpm db:seed             # seed demo company + users + sample bills
pnpm dev:docker          # start the API against local Postgres  → http://localhost:3001
```

Stop it with `pnpm db:down` (add `-v` / `pnpm db:reset` to wipe the data volume).

**Option B — Neon cloud Postgres (default)**

```sh
cd apps/api
cp .env.example .env.local        # then fill in DATABASE_URL, DATABASE_URL_UNPOOLED,
                                  # JWT_SECRET, PASSWORD_PEPPER
                                  # (or `neonctl env pull` to populate the DB URLs)
pnpm db:migrate                   # apply migrations
pnpm db:seed                      # seed demo data
pnpm dev                          # start the API  → http://localhost:3001
```

`USE_LOCAL_DB=1` selects `.env.docker`; otherwise `.env.local` + `.env` are loaded (see `apps/api/src/env.ts`).

### 2. React app (SPA dashboard)

```sh
cd apps/app
pnpm dev                 # → http://localhost:3000  (defaults to VITE_API_URL=http://localhost:3001)
```

### 3. Next.js marketing website

```sh
cd apps/website
pnpm dev                 # → http://localhost:3001
```

> **Port note:** the API and the website both default to port **3001**. If you want both running at once, start the website on another port: `pnpm --filter @stubramp/website dev -- --port 3002` (or edit its `dev` script).

### Run tasks across the whole monorepo

From the repo root, Turborepo fans tasks out to every workspace:

```sh
pnpm dev            # run all dev servers
pnpm build          # build everything
pnpm lint           # lint everything
pnpm check-types    # typecheck everything
```

---

## Seeded demo credentials

`pnpm db:seed` creates a `Demo Co` company. All seeded users share the password **`demo-password`**:

| Email | Role |
| --- | --- |
| `root@stubramp.test` | SUPERUSER (platform staff, no company) |
| `admin@demo.test` | ADMIN |
| `accountant@demo.test` | ACCOUNTANT |
| `approver@demo.test` | APPROVER |
| `employee@demo.test` | EMPLOYEE |

---

## Testing

```sh
pnpm --filter @stubramp/api test     # API unit tests (Vitest)
pnpm --filter @stubramp/app test     # app unit tests (Vitest)
cd e2e && pnpm test                  # end-to-end (Playwright)
```

---

## Useful API scripts (`apps/api`)

| Script | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm dev:docker` | Run the API (Neon / local Docker) with hot reload |
| `pnpm db:migrate` / `db:migrate:docker` | Create + apply a migration |
| `pnpm db:deploy` | Apply pending migrations (production) |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:up` / `db:down` / `db:reset` | Start / stop / wipe local Docker Postgres |

## Deployment

- API → `pnpm deploy:api` (from repo root) deploys to Fly.io; migrations run automatically as the release command.
- App → `pnpm --filter @stubramp/app deploy` builds and `wrangler deploy`s the static SPA.
- Website → `pnpm --filter @stubramp/website build` produces a static export for Cloudflare Pages.

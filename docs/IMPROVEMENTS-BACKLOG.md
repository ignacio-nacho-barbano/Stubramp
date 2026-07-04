# Improvements backlog

Planned, not yet implemented. These came out of an architecture review alongside
four changes that shipped (shared `@stubramp/contracts`, optimistic-concurrency
transitions, auth hardening, and Zod-validated env). Ordered by leverage.

## #7 — API observability

**Why:** Sentry is wired in the frontend (`apps/app/src/main.tsx`) but the API has
no error tracking, and pino logs are unredacted.

- Add `@sentry/node` to `apps/api`; init in `src/index.ts` before route registration
  and hook the Fastify error handler.
- Configure pino redaction so `authorization` headers, cookies, `password`, and
  token fields never hit logs.
- Optionally split `/health` (liveness, no I/O) from `/ready` (the DB `SELECT 1`),
  so the liveness probe stays cheap.

## #5 — List pagination

**Why:** `GET /bills` (`BillRepository.findByStatus`) returns all rows unbounded,
even though `BaseRepository.getAll` already implements clamped offset pagination.

- Route the bill list through `getAll` (or add `skip`/`take` + a total count) and
  return the `Paginated<T>` envelope already used by vendors/users.
- Have `listBillsFn` (`apps/app/src/lib/bills.ts`) pass `page`/`pageSize` and the
  bills list view consume the envelope.

## #6 — Idempotency keys on money mutations

**Why:** Schedule (`POST /bills/:id/transitions` → SCHEDULED) and settle
(`POST /payments/:id/settle`) have side effects; a client retry after a network
blip can double-fire. (CAS from the concurrency change prevents double _state_
transitions, but not a duplicate settle arriving as a fresh request.)

- Accept an `Idempotency-Key` header on those routes; persist key → result;
  replay the stored response on a repeat within a TTL window.

## #8 — Test pyramid

**Why:** Strong unit tests exist; there's no route-level coverage.

- Add integration tests that exercise auth gate → service → repo against an
  ephemeral Neon branch (CI already provisions one in `.github/workflows/e2e.yml`).
- A DB-backed concurrent-transition test to complement the unit-level race test
  added with the CAS change (`bill.service.test.ts`).

## Also noted

- **Rate-limit store:** the shipped `@fastify/rate-limit` uses the default
  in-memory store — correct for the single-instance Fly deploy (`--ha=false`).
  A multi-instance rollout needs a shared store (Redis).
- **Secret length:** env validation floors `JWT_SECRET`/`PASSWORD_PEPPER` at 16
  chars to match the provisioned dev secrets. Rotate to 32+ and raise the floor
  for production.

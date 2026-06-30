# payables-api

A Fastify + Prisma + Zod backend scaffold for a bill-pay (accounts payable) product.
It implements the spine — the bill data model, an explicit state machine, the
splits-sum-to-line invariant, and an audit log — that the rest of the feature
scope (OCR, CSV upload, recurring bills, AP aging) builds on top of.

## Stack

- **Fastify 5** — HTTP server
- **fastify-type-provider-zod** — one Zod schema validates the request and types the handler
- **Prisma** — Postgres data layer
- **Vitest** — tests (state-machine units included)

## Layout

```
src/
  domain/
    bill-state-machine.ts   # transition table — the single source of truth
    errors.ts               # domain errors carrying HTTP status codes
  services/
    bill.service.ts         # create + guarded transition() + audit events
  routes/
    bills.ts                # Fastify routes, Zod-validated
  schemas/
    bill.schema.ts          # shared Zod schemas
  lib/prisma.ts             # Prisma client singleton
  app.ts                    # app builder + error handler
  server.ts                 # entry point
prisma/schema.prisma        # the data model
test/                       # vitest
```

## Run it

```bash
cp .env.example .env          # point DATABASE_URL at your local Postgres
npm install
npm run db:generate
npm run db:migrate            # creates tables
npm run dev                   # http://localhost:3000
npm test                      # state-machine tests
```

## The state machine

```
DRAFT → SUBMITTED → APPROVED → SCHEDULED → PAID
            ↓                       ↓
         REJECTED                FAILED → (retry) SCHEDULED
```

`canTransition(from, to)` is the only authority on legality. `BillService.transition()`
is the only place a status ever changes, and every transition writes a `BillEvent`.

## Try the flow

```bash
# create a draft (splits must sum to each line's amount)
curl -X POST localhost:3000/bills -H 'content-type: application/json' -d '{
  "vendorId": "<a-vendor-uuid>",
  "billNumber": "INV-001",
  "issueDate": "2026-06-01",
  "dueDate": "2026-07-01",
  "lines": [{
    "description": "AWS",
    "quantity": 1,
    "unitCents": 100000,
    "splits": [
      { "costCenter": "engineering", "amountCents": 60000 },
      { "costCenter": "data", "amountCents": 40000 }
    ]
  }]
}'

# drive it through the state machine
curl -X POST localhost:3000/bills/<id>/transitions -H 'content-type: application/json' \
  -d '{ "to": "SUBMITTED", "actor": "alice" }'
```

An illegal transition (e.g. `DRAFT → PAID`) returns `409`; a guard failure
(e.g. submitting a bill whose splits don't balance) returns `422`.

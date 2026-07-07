// ESM
// NOTE: Sentry is initialized in src/instrument.ts, loaded via the `--import`
// flag in package.json's dev/start scripts *before* this module — so it is
// already active by the time these imports evaluate.
import * as Sentry from "@sentry/node";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { authPlugin } from "./auth/plugin.js";
import { pingDb, prisma } from "./db.js";
import { isTransientDbError } from "./db-retry.js";
import { DomainError } from "./domain/errors.js";
import { env } from "./env.js";
import { authRoutes } from "./routes/auth.js";
import { billRoutes } from "./routes/bills.js";
import { companyRoutes } from "./routes/companies.js";
import { paymentRoutes } from "./routes/payments.js";
import { userRoutes } from "./routes/users.js";
import { vendorRoutes } from "./routes/vendors.js";
import { NotFoundError, UniqueConstraintError } from "./repositories/errors.js";
import { repositoriesPlugin } from "./repositories/plugin.js";
import { servicesPlugin } from "./services/plugin.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const fastify = Fastify({
  logger: true,
});

// Wire Sentry into Fastify so unhandled route errors are captured. This only
// reports server (5xx) errors — the expected 4xx domain/validation errors mapped
// in the custom error handler below are not sent to Sentry.
Sentry.setupFastifyErrorHandler(fastify);

// Use Zod for request validation + response serialization. Compilers are opt-in
// per route (via a `schema` block), so routes without one are unaffected.
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Expose the Prisma client to routes/plugins and close it on shutdown.
fastify.decorate("prisma", prisma);
fastify.addHook("onClose", async () => {
  await prisma.$disconnect();
});

// Map domain repository errors to HTTP status codes so route handlers never
// need to know about Prisma error codes.
fastify.setErrorHandler((error, _request, reply) => {
  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      error: "Not Found",
      model: error.model,
      criteria: error.criteria,
    });
  }
  if (error instanceof UniqueConstraintError) {
    return reply
      .status(409)
      .send({ error: "Conflict", model: error.model, fields: error.fields });
  }
  // Payables domain errors carry their own HTTP status (404/409/422).
  if (error instanceof DomainError) {
    return reply
      .status(error.statusCode)
      .send({ error: error.name, message: error.message });
  }
  // @fastify/multipart rejects oversize / too-many files with a 4xx and a
  // FST_REQ_* code; surface a friendly message under `message` (the client
  // prefers it) rather than the terse default.
  const code = (error as { code?: string }).code;
  if (typeof code === "string" && code.startsWith("FST_REQ_FILE")) {
    return reply.status(413).send({
      error: "PayloadTooLarge",
      message: "File is too large (max 10 MB).",
    });
  }
  if (code === "FST_FILES_LIMIT") {
    return reply
      .status(400)
      .send({ error: "TooManyFiles", message: "Upload one file at a time." });
  }
  // Fastify sets `validation` on schema (Zod) validation failures.
  if ((error as { validation?: unknown }).validation) {
    return reply
      .status(400)
      .send({ error: "ValidationError", message: (error as Error).message });
  }
  // A transient DB fault that survived the in-repo/in-service retries (e.g. a
  // request that grabbed a dead connection outside a retried path, or Neon still
  // waking). Return a retryable 503 rather than a generic 500 so the client knows
  // to try again — and don't leak driver internals.
  if (isTransientDbError(error)) {
    fastify.log.error(error, "transient DB error surfaced to client");
    return reply.status(503).send({
      error: "ServiceUnavailable",
      message: "The service is temporarily unavailable. Please retry.",
    });
  }
  fastify.log.error(error);
  const statusCode =
    typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;
  return reply.status(statusCode).send({
    error:
      statusCode < 500 && error instanceof Error
        ? error.message
        : "Internal Server Error",
  });
});

fastify.get("/", async () => {
  return { hello: "world" };
});

// Liveness + DB connectivity check.
//
// The DB is probed with a bounded `pingDb` (see db.ts) so a wedged pool returns
// 503 quickly instead of hanging on the 30s pool connect timeout. Crucially,
// this endpoint also SELF-HEALS the "wedged pool" outage: when Neon autosuspends
// (scale-to-zero) it drops the long-lived pool's connections, and node-postgres
// can get stuck handing out / waiting on dead ones — a state a single process
// never recovers from, but a fresh process (fresh pool) does. So if the DB stays
// unreachable continuously past HEALTH_MAX_DB_DOWN_MS, we exit non-zero and let
// Fly restart the machine (min_machines_running=1 brings it right back).
//
// A genuine Neon cold start resolves within one probe (pingDb's timeout exceeds
// the worst-case wake) and returns 200, which clears the down-tracker — so a
// routine cold start never trips the restart. Only a truly stuck pool does.
const HEALTH_QUERY_TIMEOUT_MS = 25_000;
const HEALTH_MAX_DB_DOWN_MS = 90_000;
let dbDownSince: number | null = null;

fastify.get("/health", async (_request, reply) => {
  try {
    await pingDb(HEALTH_QUERY_TIMEOUT_MS);
    dbDownSince = null;
    return { status: "ok" };
  } catch (err) {
    const now = Date.now();
    if (dbDownSince === null) dbDownSince = now;
    const downMs = now - dbDownSince;
    fastify.log.error({ err, downMs }, "health: DB unreachable");

    if (downMs >= HEALTH_MAX_DB_DOWN_MS) {
      fastify.log.fatal(
        { downMs },
        "health: DB unreachable too long — pool likely wedged, exiting so Fly restarts the machine with a fresh pool",
      );
      // Flush Sentry (best-effort, bounded) so the fatal is reported, then exit
      // non-zero. Detached + unref'd so this never blocks the 503 response.
      void Sentry.flush(2000)
        .catch(() => {})
        .finally(() => process.exit(1));
    }
    return reply.status(503).send({ status: "error", db: "unreachable" });
  }
});

const start = async () => {
  try {
    // Allow the browser SPA (a different subdomain → a different origin) to call
    // the API with credentials so the httpOnly session cookies flow both ways.
    // `credentials` forbids the `*` wildcard, so CORS_WHITELIST lists each allowed
    // origin explicitly (one in prod; the two local dev servers locally).
    await fastify.register(fastifyCors, {
      origin: env.CORS_WHITELIST,
      credentials: true,
    });

    // Security response headers (sensible defaults for a JSON API).
    await fastify.register(fastifyHelmet);

    // Global rate limit as a baseline abuse guard. Auth routes tighten this
    // per-route (see routes/auth.ts) to blunt credential brute-forcing. The
    // default in-memory store is correct for the single-instance Fly deploy
    // (--ha=false); a multi-instance rollout would need a shared Redis store.
    await fastify.register(fastifyRateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });

    // Multipart uploads (invoice PDFs → POST /bills/parse). Capped at one 10 MB
    // file per request; @fastify/multipart throws a 413 past the size limit,
    // mapped to a friendly message in the error handler above.
    await fastify.register(fastifyMultipart, {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    });

    // Order matters: services depend on repositories; auth depends on repos +
    // jwt; routes depend on all three (and the global auth onRequest hook).
    await fastify.register(repositoriesPlugin);
    await fastify.register(servicesPlugin);
    await fastify.register(authPlugin);
    await fastify.register(authRoutes);
    await fastify.register(companyRoutes);
    await fastify.register(userRoutes);
    await fastify.register(billRoutes);
    await fastify.register(vendorRoutes);
    await fastify.register(paymentRoutes);
    await fastify.listen({ host: env.HOST, port: env.PORT });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Last-resort process boundaries. Without these a single stray rejected promise
// or thrown-outside-a-request error takes down the (single) machine with nothing
// reported — our worst failures would be invisible. Report to Sentry, flush
// best-effort, then exit non-zero so Fly restarts a clean process
// (min_machines_running=1). We deliberately exit on both: after an uncaught
// exception or unhandled rejection the process state may be corrupt, and a fast
// restart is safer than limping on. `flush` is bounded so a wedged reporter
// can't block the exit.
function fatalExit(err: unknown, kind: string) {
  fastify.log.fatal({ err, kind }, "unhandled process-level error — exiting");
  Sentry.captureException(err);
  void Sentry.flush(2000)
    .catch(() => {})
    .finally(() => process.exit(1));
}
process.on("uncaughtException", (err) => fatalExit(err, "uncaughtException"));
process.on("unhandledRejection", (reason) =>
  fatalExit(reason, "unhandledRejection"),
);

// Graceful shutdown (Fly.io sends SIGINT / SIGTERM on deploy/scale). Guarded by a
// hard timeout: if `fastify.close()` hangs (e.g. an in-flight request stuck on a
// dead DB connection), force-exit rather than wait for Fly to SIGKILL us — a
// clean, prompt exit makes for smoother deploys.
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    if (shuttingDown) return; // ignore a second signal
    shuttingDown = true;
    const forceExit = setTimeout(() => {
      fastify.log.error("shutdown timed out — forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();
    try {
      await fastify.close();
      process.exit(0);
    } catch (err) {
      fastify.log.error(err, "error during shutdown");
      process.exit(1);
    }
  });
}

start();

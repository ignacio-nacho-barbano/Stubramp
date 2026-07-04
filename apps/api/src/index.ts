// ESM
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { authPlugin } from "./auth/plugin.js";
import { prisma } from "./db.js";
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
    return reply
      .status(404)
      .send({
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
  // Fastify sets `validation` on schema (Zod) validation failures.
  if ((error as { validation?: unknown }).validation) {
    return reply
      .status(400)
      .send({ error: "ValidationError", message: (error as Error).message });
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
fastify.get("/health", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: "ok" };
});

const start = async () => {
  try {
    // Allow the browser SPA (a different subdomain → a different origin) to call
    // the API with credentials so the httpOnly session cookies flow both ways.
    // `credentials` forbids the `*` wildcard, hence the explicit single origin.
    await fastify.register(fastifyCors, {
      origin: env.APP_URL,
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

// Graceful shutdown (Fly.io sends SIGINT / SIGTERM on deploy/scale).
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await fastify.close();
    process.exit(0);
  });
}

start();

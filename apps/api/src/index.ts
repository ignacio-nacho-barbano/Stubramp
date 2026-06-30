// ESM
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { prisma } from "./db.js";
import { DomainError } from "./domain/errors.js";
import { env } from "./env.js";
import { billRoutes } from "./routes/bills.js";
import { paymentRoutes } from "./routes/payments.js";
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
      .send({ error: "Not Found", model: error.model, criteria: error.criteria });
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
    // Order matters: services depend on repositories; routes depend on both.
    await fastify.register(repositoriesPlugin);
    await fastify.register(servicesPlugin);
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

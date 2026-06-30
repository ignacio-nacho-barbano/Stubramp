// ESM
import Fastify from "fastify";
import { prisma } from "./db.js";
import { env } from "./env.js";
import { NotFoundError, UniqueConstraintError } from "./repositories/errors.js";
import { repositoriesPlugin } from "./repositories/plugin.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const fastify = Fastify({
  logger: true,
});

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
    await fastify.register(repositoriesPlugin);
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

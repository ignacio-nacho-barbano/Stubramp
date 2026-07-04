import Fastify, { type FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import { DomainError } from "./domain/errors.js";
import { billRoutes } from "./routes/bills.js";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  // Make Zod the validator and serializer for every route schema.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // One place to turn domain + validation errors into HTTP responses.
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof DomainError) {
      return reply
        .code(err.statusCode)
        .send({ error: err.name, message: err.message });
    }
    if (
      err instanceof ZodError ||
      (err as { validation?: unknown }).validation
    ) {
      return reply
        .code(400)
        .send({ error: "ValidationError", message: err.message });
    }
    app.log.error(err);
    return reply.code(500).send({ error: "InternalServerError" });
  });

  app.get("/health", () => ({ status: "ok" }));
  app.register(billRoutes);

  return app;
}

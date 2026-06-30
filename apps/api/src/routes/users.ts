import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../auth/permissions.js";
import { createUserInput, listUsersQuery } from "../schemas/user.schema.js";

export async function userRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/users",
    {
      schema: { body: createUserInput },
      preHandler: requirePermission("user:manage"),
    },
    async (req, reply) => {
      const user = await app.services.users.create(req.auth, req.body);
      return reply.code(201).send(user);
    },
  );

  r.get(
    "/users",
    {
      schema: { querystring: listUsersQuery },
      preHandler: requirePermission("user:manage"),
    },
    async (req) => {
      return app.services.users.list(req.auth, {
        page: req.query.page,
        pageSize: req.query.pageSize,
      });
    },
  );
}

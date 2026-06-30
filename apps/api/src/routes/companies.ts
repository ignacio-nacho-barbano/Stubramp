import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../auth/permissions.js";
import {
  createCompanyInput,
  listCompaniesQuery,
} from "../schemas/company.schema.js";

// Companies are a platform-level resource: only SUPERUSER has `company:manage`.
export async function companyRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/companies",
    {
      schema: { body: createCompanyInput },
      preHandler: requirePermission("company:manage"),
    },
    async (req, reply) => {
      const company = await app.repositories.companies.create(req.body);
      return reply.code(201).send(company);
    },
  );

  r.get(
    "/companies",
    {
      schema: { querystring: listCompaniesQuery },
      preHandler: requirePermission("company:manage"),
    },
    async (req) => {
      return app.repositories.companies.getAll({
        page: req.query.page,
        pageSize: req.query.pageSize,
        orderBy: { createdAt: "desc" },
      });
    },
  );
}

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../auth/permissions.js";
import { requireCompanyForWrite, resolveCompanyId } from "../auth/scope.js";
import { NotFoundError } from "../repositories/errors.js";
import {
  createVendorInput,
  listVendorsQuery,
  vendorIdParams,
} from "../schemas/vendor.schema.js";

export async function vendorRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/vendors",
    {
      schema: { body: createVendorInput },
      preHandler: requirePermission("vendor:manage"),
    },
    async (req, reply) => {
      const companyId = requireCompanyForWrite(req.auth);
      const vendor = await app.repositories.vendors.create({
        name: req.body.name,
        email: req.body.email,
        bankRef: req.body.bankRef,
        company: { connect: { id: companyId } },
      });
      return reply.code(201).send(vendor);
    },
  );

  r.get(
    "/vendors",
    {
      schema: { querystring: listVendorsQuery },
      preHandler: requirePermission("vendor:read"),
    },
    async (req) => {
      const companyId = resolveCompanyId(req.auth);
      return app.repositories.vendors.getAll({
        where: companyId ? { companyId } : undefined,
        page: req.query.page,
        pageSize: req.query.pageSize,
        orderBy: { createdAt: "desc" },
      });
    },
  );

  r.get(
    "/vendors/:id",
    {
      schema: { params: vendorIdParams },
      preHandler: requirePermission("vendor:read"),
    },
    async (req) => {
      const vendor = await app.repositories.vendors.findByIdScoped(
        req.params.id,
        resolveCompanyId(req.auth),
      );
      if (!vendor) throw new NotFoundError("Vendor", { id: req.params.id });
      return vendor;
    },
  );
}

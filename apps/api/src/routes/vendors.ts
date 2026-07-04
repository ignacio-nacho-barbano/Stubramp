import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requirePermission } from "../auth/permissions.js";
import { requireCompanyForWrite, resolveCompanyId } from "../auth/scope.js";
import { DomainError } from "../domain/errors.js";
import { NotFoundError } from "../repositories/errors.js";
import {
  createVendorInput,
  updateVendorInput,
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
        terms: req.body.terms,
        paymentMethod: req.body.paymentMethod,
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

  r.patch(
    "/vendors/:id",
    {
      schema: { params: vendorIdParams, body: updateVendorInput },
      preHandler: requirePermission("vendor:manage"),
    },
    async (req) => {
      // Company-scoped existence check first so a cross-tenant id reads as a 404,
      // never leaking that the row exists under another company.
      const existing = await app.repositories.vendors.findByIdScoped(
        req.params.id,
        requireCompanyForWrite(req.auth),
      );
      if (!existing) throw new NotFoundError("Vendor", { id: req.params.id });
      return app.repositories.vendors.update(req.params.id, req.body);
    },
  );

  r.delete(
    "/vendors/:id",
    {
      schema: { params: vendorIdParams },
      preHandler: requirePermission("vendor:manage"),
    },
    async (req, reply) => {
      const existing = await app.repositories.vendors.findByIdScoped(
        req.params.id,
        requireCompanyForWrite(req.auth),
      );
      if (!existing) throw new NotFoundError("Vendor", { id: req.params.id });

      // A vendor referenced by bills can't be hard-deleted (FK is RESTRICT and
      // the history must survive) — the caller should deactivate it instead.
      const billCount = await app.repositories.bills.count({
        vendorId: req.params.id,
      });
      if (billCount > 0) {
        throw new DomainError(
          "Vendor has bills and can't be deleted. Deactivate it instead.",
          409,
        );
      }

      await app.repositories.vendors.delete(req.params.id);
      return reply.code(204).send();
    },
  );
}

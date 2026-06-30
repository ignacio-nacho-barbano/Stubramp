import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createVendorInput,
  listVendorsQuery,
  vendorIdParams,
} from "../schemas/vendor.schema.js";

export async function vendorRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/vendors",
    { schema: { body: createVendorInput } },
    async (req, reply) => {
      const vendor = await app.repositories.vendors.create(req.body);
      return reply.code(201).send(vendor);
    },
  );

  r.get(
    "/vendors",
    { schema: { querystring: listVendorsQuery } },
    async (req) => {
      return app.repositories.vendors.getAll({
        page: req.query.page,
        pageSize: req.query.pageSize,
        orderBy: { createdAt: "desc" },
      });
    },
  );

  r.get("/vendors/:id", { schema: { params: vendorIdParams } }, async (req) => {
    return app.repositories.vendors.findByIdOrThrow(req.params.id);
  });
}

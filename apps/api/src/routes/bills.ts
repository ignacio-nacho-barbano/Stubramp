import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireTransitionPermission } from "../auth/bill-permissions.js";
import { requirePermission } from "../auth/permissions.js";
import {
  billIdParams,
  createBillInput,
  listBillsQuery,
  transitionInput,
} from "../schemas/bill.schema.js";

export async function billRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/bills",
    {
      schema: { body: createBillInput },
      preHandler: requirePermission("bill:create"),
    },
    async (req, reply) => {
      const bill = await app.services.bills.create(req.auth, req.body);
      return reply.code(201).send(bill);
    },
  );

  r.get(
    "/bills",
    {
      schema: { querystring: listBillsQuery },
      preHandler: requirePermission("bill:read"),
    },
    async (req) => {
      return app.services.bills.list(req.auth, req.query.status);
    },
  );

  r.get(
    "/bills/:id",
    {
      schema: { params: billIdParams },
      preHandler: requirePermission("bill:read"),
    },
    async (req) => {
      return app.services.bills.get(req.auth, req.params.id);
    },
  );

  // Drive the state machine. The required permission depends on the target
  // status (see requireTransitionPermission), e.g. APPROVER for "APPROVED".
  r.post(
    "/bills/:id/transitions",
    {
      schema: { params: billIdParams, body: transitionInput },
      preHandler: requireTransitionPermission,
    },
    async (req) => {
      return app.services.bills.transition(req.auth, req.params.id, req.body);
    },
  );
}

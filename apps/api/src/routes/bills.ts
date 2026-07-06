import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireTransitionPermission } from "../auth/bill-permissions.js";
import { requirePermission } from "../auth/permissions.js";
import { BadRequestError } from "../domain/errors.js";
import {
  billIdParams,
  createBillInput,
  listBillsQuery,
  parsedBillDocument,
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

  // Parse an uploaded invoice PDF into best-effort bill fields. Returns fields
  // only — it never persists; the client confirms + picks a vendor, then POSTs
  // /bills to create the draft. Multipart, so no zod body schema; the response is
  // serialized against parsedBillDocument.
  r.post(
    "/bills/parse",
    {
      schema: { response: { 200: parsedBillDocument } },
      preHandler: requirePermission("bill:create"),
    },
    async (req) => {
      const data = await req.file();
      if (!data) {
        throw new BadRequestError("No file uploaded");
      }
      if (data.mimetype !== "application/pdf") {
        throw new BadRequestError("Only PDF files are supported");
      }
      const buffer = await data.toBuffer();
      return app.services.parseDocument.parse({ type: "bill", file: buffer });
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

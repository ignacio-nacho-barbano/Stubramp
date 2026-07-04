import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { billService } from "../services/bill.service.js";
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
    { schema: { body: createBillInput } },
    async (req, reply) => {
      const bill = await billService.create(req.body);
      return reply.code(201).send(bill);
    },
  );

  r.get("/bills", { schema: { querystring: listBillsQuery } }, async (req) => {
    return billService.list(req.query.status);
  });

  r.get("/bills/:id", { schema: { params: billIdParams } }, async (req) => {
    return billService.get(req.params.id);
  });

  // Drive the state machine. e.g. POST /bills/:id/transitions { "to": "SUBMITTED", "actor": "alice" }
  r.post(
    "/bills/:id/transitions",
    { schema: { params: billIdParams, body: transitionInput } },
    async (req) => {
      return billService.transition(req.params.id, req.body);
    },
  );
}

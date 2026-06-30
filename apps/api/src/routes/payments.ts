import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { billIdParams } from "../schemas/bill.schema.js";
import {
  paymentIdParams,
  settlePaymentInput,
} from "../schemas/payment.schema.js";

export async function paymentRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/bills/:id/payments",
    { schema: { params: billIdParams } },
    async (req) => {
      return app.repositories.payments.findByBillId(req.params.id);
    },
  );

  // Settle a scheduled payment, driving the bill SCHEDULED -> PAID / FAILED.
  r.post(
    "/payments/:id/settle",
    { schema: { params: paymentIdParams, body: settlePaymentInput } },
    async (req) => {
      return app.services.bills.settlePayment(req.params.id, req.body);
    },
  );
}

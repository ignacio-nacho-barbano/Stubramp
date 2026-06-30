import { z } from "zod";

export const settlePaymentInput = z.object({
  // SUCCEEDED drives the bill SCHEDULED -> PAID; FAILED drives SCHEDULED -> FAILED.
  // actor is derived from the authenticated user, never the request body.
  outcome: z.enum(["SUCCEEDED", "FAILED"]),
});

export const paymentIdParams = z.object({
  id: z.string().uuid(),
});

export type SettlePaymentInput = z.infer<typeof settlePaymentInput>;

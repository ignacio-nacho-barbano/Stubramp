import { z } from "zod";

export const settlePaymentInput = z.object({
  // SUCCEEDED drives the bill SCHEDULED -> PAID; FAILED drives SCHEDULED -> FAILED.
  outcome: z.enum(["SUCCEEDED", "FAILED"]),
  actor: z.string().min(1),
});

export const paymentIdParams = z.object({
  id: z.string().uuid(),
});

export type SettlePaymentInput = z.infer<typeof settlePaymentInput>;

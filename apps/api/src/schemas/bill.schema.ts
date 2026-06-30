import { z } from "zod";
import { BILL_STATUSES } from "../domain/bill-state-machine.js";

const cents = z.number().int().nonnegative();

export const splitInput = z.object({
  costCenter: z.string().min(1),
  amountCents: cents,
});

export const lineItemInput = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  unitCents: cents,
  classification: z.enum(["EXPENSE", "ITEM"]).default("EXPENSE"),
  glAccount: z.string().optional(),
  splits: z.array(splitInput).min(1),
});

export const createBillInput = z.object({
  vendorId: z.string().uuid(),
  billNumber: z.string().min(1),
  source: z.enum(["MANUAL", "UPLOAD", "OCR", "EMAIL", "CSV"]).default("MANUAL"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).default("USD"),
  lines: z.array(lineItemInput).min(1),
});

export const transitionInput = z.object({
  to: z.enum(BILL_STATUSES),
  actor: z.string().min(1),
  // only consulted when scheduling a payment (APPROVED -> SCHEDULED)
  scheduledFor: z.coerce.date().optional(),
  method: z.enum(["ACH", "WIRE", "CHECK", "CARD"]).optional(),
});

export const listBillsQuery = z.object({
  status: z.enum(BILL_STATUSES).optional(),
});

export const billIdParams = z.object({
  id: z.string().uuid(),
});

export type CreateBillInput = z.infer<typeof createBillInput>;
export type TransitionInput = z.infer<typeof transitionInput>;

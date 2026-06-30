// The single source of truth for legal bill transitions.
// Everything else (routes, services, the audit log) defers to this table.
import type { BillStatus } from "../generated/prisma/client.js";

// Runtime list of statuses, used to build Zod enums. Kept in sync with the
// generated `BillStatus` enum by the `Record<BillStatus, ...>` typing on
// TRANSITIONS below — adding a status to the schema without adding it here is a
// compile error.
export const BILL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "SCHEDULED",
  "PAID",
  "REJECTED",
  "FAILED",
] as const satisfies readonly BillStatus[];

// from -> allowed next states. Anything not listed is illegal by construction.
export const TRANSITIONS: Record<BillStatus, readonly BillStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: ["SCHEDULED"],
  SCHEDULED: ["PAID", "FAILED"],
  FAILED: ["SCHEDULED"], // retry
  PAID: [],
  REJECTED: [],
};

export function canTransition(from: BillStatus, to: BillStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(status: BillStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

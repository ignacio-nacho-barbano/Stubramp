// The single source of truth for legal bill transitions.
// Everything else (routes, services, the audit log) defers to this table.

export const BILL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "SCHEDULED",
  "PAID",
  "REJECTED",
  "FAILED",
] as const;

export type BillStatus = (typeof BILL_STATUSES)[number];

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

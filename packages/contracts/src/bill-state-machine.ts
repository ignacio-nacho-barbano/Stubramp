// The single source of truth for legal bill transitions, shared by the API
// (which drives it) and the web client (which uses it to gate UI actions).
import type { BillStatus } from "./enums.js";

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

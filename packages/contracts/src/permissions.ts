// Role-based access control, shared by the API (source of truth, returns 403)
// and the web client (UX-only: hide/disable actions a role can't perform).
import type { BillStatus, Role } from "./enums.js";

// Every gated capability in the API. Keep granular enough to map roles cleanly.
export type Action =
  | "company:manage"
  | "user:manage"
  | "vendor:manage"
  | "vendor:read"
  | "bill:create"
  | "bill:read"
  | "bill:submit"
  | "bill:approve"
  | "bill:schedule"
  | "bill:pay"
  | "bill:delete"
  | "card:manage"
  | "card:read";

// Role -> allowed actions. SUPERUSER is handled in `can()` (implicitly all), so
// its entry is an empty sentinel. Tune these lists to taste — the structure, not
// the exact grants, is the contract.
export const MATRIX: Record<Role, readonly Action[]> = {
  SUPERUSER: [],
  ADMIN: [
    "user:manage",
    "vendor:manage",
    "vendor:read",
    "bill:create",
    "bill:read",
    "bill:submit",
    "bill:approve",
    "bill:schedule",
    "bill:pay",
    "bill:delete",
    "card:manage",
    "card:read",
  ],
  ACCOUNTANT: [
    "vendor:manage",
    "vendor:read",
    "bill:create",
    "bill:read",
    "bill:submit",
    "bill:schedule",
    "bill:pay",
    "bill:delete",
    "card:read",
  ],
  APPROVER: ["vendor:read", "bill:read", "bill:approve", "card:read"],
  EMPLOYEE: [
    "vendor:read",
    "bill:create",
    "bill:read",
    "bill:delete",
    "card:read",
  ],
};

export function can(role: Role, action: Action): boolean {
  if (role === "SUPERUSER") return true;
  return MATRIX[role].includes(action);
}

// Which permission a bill state transition requires. The target status lives in
// the request body, so the API gates transitions by looking the target up here.
export const TRANSITION_PERMISSION: Record<BillStatus, Action> = {
  DRAFT: "bill:create",
  SUBMITTED: "bill:submit",
  APPROVED: "bill:approve",
  REJECTED: "bill:approve",
  SCHEDULED: "bill:schedule",
  PAID: "bill:pay",
  FAILED: "bill:pay",
};

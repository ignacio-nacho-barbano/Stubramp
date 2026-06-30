import type { FastifyRequest } from "fastify";
import type { Role } from "../generated/prisma/client.js";
import { ForbiddenError } from "../domain/errors.js";

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
  | "card:manage"
  | "card:read";

// Role -> allowed actions. SUPERUSER is handled in `can()` (implicitly all), so
// its entry is an empty sentinel. Tune these lists to taste — the structure, not
// the exact grants, is the contract.
const MATRIX: Record<Role, readonly Action[]> = {
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
    "card:read",
  ],
  APPROVER: ["vendor:read", "bill:read", "bill:approve", "card:read"],
  EMPLOYEE: ["vendor:read", "bill:create", "bill:read", "card:read"],
};

export function can(role: Role, action: Action): boolean {
  if (role === "SUPERUSER") return true;
  return MATRIX[role].includes(action);
}

// preHandler factory: rejects with 403 unless the request's role has `action`.
// Runs after the global auth onRequest hook has populated request.auth.
export function requirePermission(action: Action) {
  return async (req: FastifyRequest) => {
    if (!can(req.auth.role, action)) {
      throw new ForbiddenError(`Missing permission: ${action}`);
    }
  };
}

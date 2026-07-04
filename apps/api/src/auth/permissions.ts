import type { FastifyRequest } from "fastify";
import { type Action, can } from "@stubramp/contracts/permissions";
import { ForbiddenError } from "../domain/errors.js";

// The RBAC matrix (Action, MATRIX, can) now lives in @stubramp/contracts so the
// API and the web client share one source of truth. Re-exported here so existing
// import paths keep working; this module owns the Fastify-specific gate.
export { type Action, MATRIX, can } from "@stubramp/contracts/permissions";

// preHandler factory: rejects with 403 unless the request's role has `action`.
// Runs after the global auth onRequest hook has populated request.auth.
export function requirePermission(action: Action) {
  return async (req: FastifyRequest) => {
    if (!can(req.auth.role, action)) {
      throw new ForbiddenError(`Missing permission: ${action}`);
    }
  };
}

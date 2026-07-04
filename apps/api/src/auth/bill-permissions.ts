import type { FastifyRequest } from "fastify";
import type { BillStatus } from "../generated/prisma/client.js";
import { TRANSITION_PERMISSION, can } from "@stubramp/contracts/permissions";
import { ForbiddenError } from "../domain/errors.js";

// TRANSITION_PERMISSION (target status -> required Action) is shared via
// @stubramp/contracts; re-exported here for the original import path. This module
// owns the Fastify preHandler: the target status lives in the request body, so
// the gate reads `req.body.to` rather than a static requirePermission(action).
export { TRANSITION_PERMISSION } from "@stubramp/contracts/permissions";

export async function requireTransitionPermission(
  req: FastifyRequest<{ Body: { to: BillStatus } }>,
) {
  const action = TRANSITION_PERMISSION[req.body.to];
  if (!action || !can(req.auth.role, action)) {
    throw new ForbiddenError(
      `Missing permission for transition to ${req.body.to}`,
    );
  }
}

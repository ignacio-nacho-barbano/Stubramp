import type { FastifyRequest } from "fastify";
import type { BillStatus } from "../generated/prisma/client.js";
import { ForbiddenError } from "../domain/errors.js";
import { type Action, can } from "./permissions.js";

// Which permission a bill state transition requires. The target status lives in
// the request body, so the gate is a preHandler that reads `req.body.to` rather
// than a static requirePermission(action).
export const TRANSITION_PERMISSION: Record<BillStatus, Action> = {
  DRAFT: "bill:create",
  SUBMITTED: "bill:submit",
  APPROVED: "bill:approve",
  REJECTED: "bill:approve",
  SCHEDULED: "bill:schedule",
  PAID: "bill:pay",
  FAILED: "bill:pay",
};

export async function requireTransitionPermission(
  req: FastifyRequest<{ Body: { to: BillStatus } }>,
) {
  const action = TRANSITION_PERMISSION[req.body.to];
  if (!action || !can(req.auth.role, action)) {
    throw new ForbiddenError(`Missing permission for transition to ${req.body.to}`);
  }
}

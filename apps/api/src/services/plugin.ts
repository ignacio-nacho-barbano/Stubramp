import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { BillService } from "./bill.service.js";
import { UserService } from "./user.service.js";

export interface Services {
  bills: BillService;
  users: UserService;
}

declare module "fastify" {
  interface FastifyInstance {
    services: Services;
  }
}

/**
 * Wires the payables service layer on top of the repositories and shared Prisma
 * client, exposing them as `fastify.services`. Wrapped in `fastify-plugin` so the
 * decorator escapes encapsulation and is visible to all routes.
 *
 * Requires `fastify.prisma` and `fastify.repositories` to be decorated first —
 * register this after `repositoriesPlugin`.
 */
export const servicesPlugin = fp(async (fastify: FastifyInstance) => {
  const { prisma, repositories } = fastify;
  fastify.decorate("services", {
    bills: new BillService(
      prisma,
      repositories.bills,
      repositories.payments,
      repositories.billEvents,
      repositories.vendors,
    ),
    users: new UserService(repositories.users),
  });
});

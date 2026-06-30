import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { BillEventRepository } from "./BillEventRepository.js";
import { BillRepository } from "./BillRepository.js";
import { CardRepository } from "./CardRepository.js";
import { PaymentRepository } from "./PaymentRepository.js";
import { TransactionRepository } from "./TransactionRepository.js";
import { UserRepository } from "./UserRepository.js";
import { VendorRepository } from "./VendorRepository.js";

export interface Repositories {
  users: UserRepository;
  cards: CardRepository;
  transactions: TransactionRepository;
  vendors: VendorRepository;
  bills: BillRepository;
  payments: PaymentRepository;
  billEvents: BillEventRepository;
}

declare module "fastify" {
  interface FastifyInstance {
    repositories: Repositories;
  }
}

/**
 * Instantiates each repository once against the shared Prisma client and exposes
 * them as `fastify.repositories`. Wrapped in `fastify-plugin` so the decorator
 * escapes Fastify's encapsulation and is visible to all routes/plugins.
 *
 * Requires `fastify.prisma` to be decorated before this plugin registers.
 */
export const repositoriesPlugin = fp(async (fastify: FastifyInstance) => {
  const { prisma } = fastify;
  fastify.decorate("repositories", {
    users: new UserRepository(prisma.user),
    cards: new CardRepository(prisma.card),
    transactions: new TransactionRepository(prisma.transaction),
    vendors: new VendorRepository(prisma.vendor),
    bills: new BillRepository(prisma.bill),
    payments: new PaymentRepository(prisma.payment),
    billEvents: new BillEventRepository(prisma.billEvent),
  });
});

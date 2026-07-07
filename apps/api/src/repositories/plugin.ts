import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { retryReads } from "../db-retry.js";
import { BillEventRepository } from "./BillEventRepository.js";
import { BillRepository } from "./BillRepository.js";
import { CardRepository } from "./CardRepository.js";
import { CompanyRepository } from "./CompanyRepository.js";
import { PaymentRepository } from "./PaymentRepository.js";
import { RefreshTokenRepository } from "./RefreshTokenRepository.js";
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
  companies: CompanyRepository;
  refreshTokens: RefreshTokenRepository;
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
  // Each delegate is wrapped so its READ methods retry on transient Neon/pool
  // connection blips (see db-retry.ts). Both BaseRepository's CRUD and every
  // repository's custom finder go through the wrapped delegate, so retry is
  // inherited everywhere without per-method changes. Writes pass through; the
  // multi-step writes are retried at the transaction level in the services.
  fastify.decorate("repositories", {
    users: new UserRepository(retryReads(prisma.user)),
    cards: new CardRepository(retryReads(prisma.card)),
    transactions: new TransactionRepository(retryReads(prisma.transaction)),
    vendors: new VendorRepository(retryReads(prisma.vendor)),
    bills: new BillRepository(retryReads(prisma.bill)),
    payments: new PaymentRepository(retryReads(prisma.payment)),
    billEvents: new BillEventRepository(retryReads(prisma.billEvent)),
    companies: new CompanyRepository(retryReads(prisma.company)),
    refreshTokens: new RefreshTokenRepository(retryReads(prisma.refreshToken)),
  });
});

import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { CardRepository } from "./CardRepository.js";
import { TransactionRepository } from "./TransactionRepository.js";
import { UserRepository } from "./UserRepository.js";

export interface Repositories {
  users: UserRepository;
  cards: CardRepository;
  transactions: TransactionRepository;
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
  });
});

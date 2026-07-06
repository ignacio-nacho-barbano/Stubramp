import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";
import { PrismaClient } from "./generated/prisma/client.js";
const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    idleTimeoutMillis: 30_000,
    maxUses: 500,
    max: 10,
    connectionTimeoutMillis: 10_000,
  },
  {
    onPoolError: (err) =>
      console.error({ err }, "postgres pool error (idle client)"),
    onConnectionError: (err) =>
      console.error({ err }, "postgres connection error"),
  },
);

export const prisma = new PrismaClient({ adapter });

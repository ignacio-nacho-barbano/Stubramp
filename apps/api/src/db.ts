import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";
import { PrismaClient } from "./generated/prisma/client.js";
// Prisma 7 client wired to Neon over the pg driver adapter, on a long-running
// host (Fly.io): a node-postgres pool opened once at module scope and reused
// across requests. Uses the POOLED DATABASE_URL (PgBouncer).
//
// The Neon compute autosuspends (scale-to-zero). Opening a fresh connection to a
// suspended compute has to wake it, which can take well over 10s. So the connect
// timeout MUST be generous — a short one turns a slow-but-successful cold start
// into a hard "Connection terminated due to connection timeout" failure, which
// then fails /health, drops the machine out of Fly's rotation, and starves the
// keep-alive ping that warms Neon (a self-reinforcing outage). For the same
// reason we don't drop idle connections aggressively: keeping one warm avoids
// the cold reconnect entirely.
const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    idleTimeoutMillis: 60_000,
    maxUses: 500,
    max: 10,
    // Must exceed the worst-case Neon cold-start wake (see above).
    connectionTimeoutMillis: 30_000,
  },
  {
    onPoolError: (err) =>
      console.error({ err }, "postgres pool error (idle client)"),
    onConnectionError: (err) =>
      console.error({ err }, "postgres connection error"),
  },
);

export const prisma = new PrismaClient({ adapter });

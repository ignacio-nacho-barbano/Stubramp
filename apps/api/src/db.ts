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
    // Server-side ceilings so a single slow/wedged query can't pin one of the
    // (only) `max` pool slots indefinitely and starve every other request — the
    // pool-exhaustion cascade the /health self-heal exists to escape. These bound
    // query *execution* time, not the cold-start *connect* (that's covered by
    // connectionTimeoutMillis above), so they don't interfere with a Neon wake:
    // once connected, real queries finish in well under a second.
    statement_timeout: 20_000,
    idle_in_transaction_session_timeout: 30_000,
  },
  {
    onPoolError: (err) =>
      console.error({ err }, "postgres pool error (idle client)"),
    onConnectionError: (err) =>
      console.error({ err }, "postgres connection error"),
  },
);

export const prisma = new PrismaClient({ adapter });

// Bounded liveness probe used by GET /health. Races `SELECT 1` against a timer
// so a wedged pool fails fast instead of blocking for the full pool
// `connectionTimeoutMillis` (30s). `timeoutMs` MUST sit between the worst-case
// Neon cold-start wake (a slow-but-healthy connect, ~10-15s) and the pool
// connect timeout, so a genuine cold start still resolves as a success while a
// truly stuck pool trips the timer. The timer is unref'd so it never keeps the
// event loop alive on its own.
export async function pingDb(timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`db ping timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
    timer.unref();
  });
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

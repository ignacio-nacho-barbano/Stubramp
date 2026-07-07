// Transient database-error handling.
//
// Neon autosuspends (scale-to-zero) and sits behind PgBouncer, so the long-lived
// pool routinely hands out connections that the server has since dropped, or that
// die mid-flight. node-postgres surfaces these as connection errors that are
// *transient*: the identical operation on a fresh connection succeeds. Without a
// retry these each become a user-facing 500 — the main source of "the API fails
// a lot" intermittently even while /health looks fine.
//
// Two entry points:
//   - `withDbRetry(fn)`  — retries an operation on a transient error. Used to wrap
//     whole interactive transactions (safe: they're atomic, and our writes are
//     compare-and-swap so re-running can't double-apply).
//   - `retryReads(delegate)` — wraps a Prisma model delegate so its READ methods
//     retry automatically. Writes pass through untouched (blindly retrying a
//     non-transactional write risks a duplicate if the first attempt committed
//     but the ack was lost). Applied once per delegate in repositories/plugin.ts,
//     so both the BaseRepository CRUD and every custom finder inherit it.

// Postgres SQLSTATEs that mean "connection/server went away" or "retry me".
const TRANSIENT_PG_SQLSTATES = new Set([
  "08000", // connection_exception
  "08001", // sqlclient_unable_to_establish_sqlconnection
  "08003", // connection_does_not_exist
  "08004", // sqlserver_rejected_establishment_of_sqlconnection
  "08006", // connection_failure
  "08007", // connection_failure_during_transaction
  "40001", // serialization_failure
  "40P01", // deadlock_detected
  "53300", // too_many_connections
  "57P01", // admin_shutdown (Neon dropping the connection on suspend)
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now (server still starting up)
]);

// Node/libuv socket-level error codes.
const TRANSIENT_NODE_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "ENETUNREACH",
  "EAI_AGAIN", // transient DNS failure
]);

// Prisma engine error codes for connectivity / pool / transaction-timeout faults.
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // can't reach database server
  "P1002", // database server reached but timed out
  "P1008", // operations timed out
  "P1017", // server has closed the connection
  "P2024", // timed out fetching a connection from the pool
  "P2028", // transaction API error (includes transaction timeout)
]);

// Fallback substring match for driver errors that don't carry a machine code.
const TRANSIENT_MESSAGE_RE =
  /connection terminated|connection reset|connection closed|not queryable|timeout exceeded when trying to connect|terminating connection|server closed the connection|could not connect|connection refused|read econnreset|socket hang up/i;

/**
 * True if `err` (or anything in its `.cause` chain) looks like a transient DB
 * connectivity fault that is safe to retry. Errors bubble up wrapped — a pg
 * error nested inside a Prisma error inside the adapter — so we walk the chain
 * and check codes, SQLSTATE, error name, and finally the message.
 */
export function isTransientDbError(err: unknown): boolean {
  let current: unknown = err;
  // Bounded walk so a self-referential cause can't loop forever.
  for (let depth = 0; current != null && depth < 10; depth++) {
    const e = current as {
      code?: unknown;
      errorCode?: unknown;
      name?: unknown;
      message?: unknown;
      cause?: unknown;
    };

    const code = typeof e.code === "string" ? e.code : undefined;
    if (code) {
      if (TRANSIENT_PG_SQLSTATES.has(code)) return true;
      if (TRANSIENT_NODE_CODES.has(code)) return true;
      if (TRANSIENT_PRISMA_CODES.has(code)) return true;
    }
    const errorCode = typeof e.errorCode === "string" ? e.errorCode : undefined;
    if (errorCode && TRANSIENT_PRISMA_CODES.has(errorCode)) return true;

    // Prisma raises these when the engine can't establish/keep a connection;
    // they don't always carry a `code`.
    if (
      e.name === "PrismaClientInitializationError" ||
      e.name === "PrismaClientRustPanicError"
    ) {
      return true;
    }

    if (typeof e.message === "string" && TRANSIENT_MESSAGE_RE.test(e.message)) {
      return true;
    }

    current = e.cause;
  }
  return false;
}

/**
 * Options for Prisma interactive transactions. The defaults (maxWait 2s /
 * timeout 5s) are too tight for Neon: a transaction that opens while the compute
 * is still waking, or that waits on a busy pool, blows the 5s budget and aborts
 * with P2028 — a spurious failure on a write the user expects to succeed. These
 * give a cold start room to breathe while still bounding a genuinely stuck
 * transaction. Pair with `withDbRetry`, which re-runs the whole transaction if it
 * still trips a transient fault.
 */
export const TX_OPTIONS = {
  maxWait: 10_000, // max time to wait for a connection from the pool
  timeout: 20_000, // max time the interactive transaction may run
} as const;

export interface RetryOptions {
  /** Total attempts including the first. Default 3. */
  attempts?: number;
  /** Base backoff before the first retry, doubled each attempt. Default 100ms. */
  baseDelayMs?: number;
  /** Backoff ceiling. Default 1000ms. */
  maxDelayMs?: number;
  /** Label used in the retry log line, e.g. "bill.transition". */
  label?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `fn`, retrying on transient DB errors with exponential backoff + jitter.
 * Non-transient errors (domain errors, validation, unique-constraint, etc.) are
 * rethrown immediately so business logic still fails fast. The final attempt's
 * error propagates unchanged.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 100;
  const maxDelayMs = opts.maxDelayMs ?? 1000;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= attempts || !isTransientDbError(err)) throw err;
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delay = backoff + Math.random() * baseDelayMs; // jitter
      console.warn(
        {
          err,
          attempt,
          attempts,
          delayMs: Math.round(delay),
          label: opts.label,
        },
        "transient DB error — retrying",
      );
      await sleep(delay);
    }
  }
}

// Prisma model-delegate read methods. Retrying these is always safe (no state
// change). Writes (create/update/delete/updateMany/upsert/…) are deliberately
// excluded — see the module header.
const READ_METHODS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * Wrap a Prisma model delegate (e.g. `prisma.bill`) so its read methods retry on
 * transient errors. A transparent Proxy: same type in, same type out, so call
 * sites and repository constructors are unaffected. Only delegates bound to the
 * shared (non-transaction) client are wrapped — in-transaction delegates come
 * from `tx.*` and are retried at the whole-transaction level instead.
 */
export function retryReads<T extends object>(delegate: T): T {
  return new Proxy(delegate, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      if (typeof prop === "string" && READ_METHODS.has(prop)) {
        return (...args: unknown[]) =>
          withDbRetry(() => value.apply(target, args), {
            label: `${String(prop)}`,
          });
      }
      // Preserve `this` for the delegate's own methods.
      return value.bind(target);
    },
  });
}

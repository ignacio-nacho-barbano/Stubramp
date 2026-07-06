// Sentry initialization. This module MUST be loaded before any other module so
// the SDK's auto-instrumentation can hook into http, pg, etc. It is wired up via
// Node's `--import` flag in the dev/start scripts (see package.json), which runs
// it before src/index.ts is evaluated.
//
// It loads env vars itself (mirroring env.ts) because env.ts — which normally
// runs dotenv — is evaluated *after* this file, so process.env is otherwise bare
// at this point.
import * as Sentry from "@sentry/node";
import { config as loadEnv } from "dotenv";

const dbEnvFile =
  process.env.USE_LOCAL_DB === "1" ? ".env.docker" : ".env.local";
loadEnv({ path: [dbEnvFile, ".env"] });

// When SENTRY_DSN is unset, Sentry.init is a no-op (no events sent), so this is
// safe to leave in place for local dev / tests without a DSN configured.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  // Attach request/user context (matches the frontend's sendDefaultPii).
  sendDefaultPii: true,
  // Performance tracing: full sampling everywhere except production, where 10%
  // keeps volume sane. Trace headers stitch to the frontend's spans.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Surface local variables in stack traces and forward console logs as logs.
  includeLocalVariables: true,
  enableLogs: true,
});

// Runtime environment loading + validation.
// Default: Neon writes DATABASE_URL / DATABASE_URL_UNPOOLED into .env.local.
// USE_LOCAL_DB=1: use the local Docker Postgres (.env.docker) instead.
import { config as loadEnv } from "dotenv";

const dbEnvFile = process.env.USE_LOCAL_DB === "1" ? ".env.docker" : ".env.local";
loadEnv({ path: [dbEnvFile, ".env"] });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // Pooled connection (PgBouncer) — correct for the long-running app runtime.
  DATABASE_URL: required("DATABASE_URL"),
  // Fly.io requires binding to 0.0.0.0 so the proxy can reach the app.
  HOST: process.env.HOST ?? "0.0.0.0",
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // Signs short-lived access JWTs. Refresh tokens are opaque + stored server-side.
  JWT_SECRET: required("JWT_SECRET"),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? "15m",
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL ?? "30d",
  // Server-side secret mixed into every password hash (never stored in the DB).
  PASSWORD_PEPPER: required("PASSWORD_PEPPER"),
  // The browser SPA origin — the single allowed CORS origin (credentials mode
  // forbids the `*` wildcard). e.g. https://app.stubramp.barbano.uy
  APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  // Parent domain the session cookies are scoped to, so they're shared across
  // the app + api subdomains (e.g. `.stubramp.barbano.uy`). Left unset locally
  // (localhost), where the browser scopes cookies to the exact host.
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
} as const;

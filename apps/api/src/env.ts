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
} as const;

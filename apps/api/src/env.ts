// Runtime environment loading + validation.
// Default: Neon writes DATABASE_URL / DATABASE_URL_UNPOOLED into .env.local.
// USE_LOCAL_DB=1: use the local Docker Postgres (.env.docker) instead.
import { config as loadEnv } from "dotenv";
import { z } from "zod";

const dbEnvFile =
  process.env.USE_LOCAL_DB === "1" ? ".env.docker" : ".env.local";
loadEnv({ path: [dbEnvFile, ".env"] });

// Fail-fast schema: a missing/malformed var stops the process at boot with a
// readable message instead of surfacing as a confusing runtime error later.
// Secret floor is 16 (matches the provisioned dev secrets); use 32+ in prod.
const envSchema = z.object({
  // Pooled connection (PgBouncer) — correct for the long-running app runtime.
  DATABASE_URL: z.string().min(1),
  // Fly.io requires binding to 0.0.0.0 so the proxy can reach the app.
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Signs short-lived access JWTs. Refresh tokens are opaque + stored server-side.
  JWT_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  // Server-side secret mixed into every password hash (never stored in the DB).
  PASSWORD_PEPPER: z.string().min(16),
  // The browser SPA origin. e.g. https://app.stubramp.barbano.uy
  APP_URL: z.string().url().default("http://localhost:3000"),
  // Comma-separated list of allowed browser origins — one or more. One domain in
  // prod; the two local dev servers locally. Credentials mode forbids the `*`
  // wildcard, so every allowed origin is listed explicitly.
  CORS_WHITELIST: z
    .string()
    .default("http://localhost:3000,http://localhost:3002")
    .transform((s) =>
      s
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().url()).min(1)),
  // Parent domain the session cookies are scoped to, so they're shared across
  // the app + api subdomains (e.g. `.stubramp.barbano.uy`). Left unset locally
  // (localhost), where the browser scopes cookies to the exact host.
  COOKIE_DOMAIN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const fieldErrors = z.flattenError(parsed.error).fieldErrors;
  console.error(
    `❌ Invalid environment configuration:\n${JSON.stringify(fieldErrors, null, 2)}`,
  );
  process.exit(1);
}

export const env = parsed.data;

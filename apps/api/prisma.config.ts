// Prisma CLI config (migrations, db pull, studio, ...).
// Neon pulls connection vars into .env.local via `neonctl env pull`.
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Default: Neon's pulled vars (.env.local). USE_LOCAL_DB=1 → local Docker (.env.docker).
const dbEnvFile =
  process.env.USE_LOCAL_DB === "1" ? ".env.docker" : ".env.local";
loadEnv({ path: [dbEnvFile, ".env"] });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations/DDL must run over a DIRECT (unpooled) connection — the pooled
    // PgBouncer endpoint can't run them reliably. The app runtime uses the
    // pooled DATABASE_URL via the pg driver adapter (see src/db.ts).
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});

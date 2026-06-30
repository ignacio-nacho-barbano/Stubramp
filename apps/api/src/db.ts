// Prisma 7 client wired to Neon over the pg driver adapter.
// Long-running host (Fly.io) → node-postgres pool, opened once at module scope
// and reused across requests. Uses the POOLED DATABASE_URL (PgBouncer).
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });

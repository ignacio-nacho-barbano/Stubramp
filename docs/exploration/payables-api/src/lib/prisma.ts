import { PrismaClient } from '@prisma/client';

// Single shared client. On a long-lived Fastify process (Fly/Render) a normal
// connection pool is fine — no serverless driver needed. Keep the pool modest
// via the connection string, e.g. ?connection_limit=5 against Neon.
export const prisma = new PrismaClient();

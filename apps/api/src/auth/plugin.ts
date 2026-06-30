import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env.js";
import type { AuthContext } from "./context.js";
import { type AccessTokenPayload, TokenService } from "./tokens.js";

declare module "fastify" {
  interface FastifyInstance {
    tokenService: TokenService;
  }
  interface FastifyRequest {
    auth: AuthContext;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

// Routes reachable without an access token. Matched by `${METHOD}:${routeUrl}`.
const PUBLIC_ROUTES = new Set([
  "GET:/",
  "GET:/health",
  "POST:/auth/login",
  "POST:/auth/refresh",
]);

const DURATION_UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function durationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  const unit = match ? DURATION_UNITS[match[2]!] : undefined;
  if (!match || unit === undefined) {
    throw new Error(`Invalid duration: ${value}`);
  }
  return Number(match[1]) * unit;
}

/**
 * Registers @fastify/jwt, builds the TokenService (needs the jwt signer + the
 * refresh-token/user repos), and verifies the access token on every non-public
 * request, populating `request.auth`. Register AFTER repositoriesPlugin (needs
 * fastify.repositories) and BEFORE the route plugins.
 */
export const authPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, { secret: env.JWT_SECRET });

  const { repositories } = fastify;
  fastify.decorate(
    "tokenService",
    new TokenService(
      (payload) => fastify.jwt.sign(payload, { expiresIn: env.ACCESS_TOKEN_TTL }),
      repositories.refreshTokens,
      async (id) => {
        const user = await repositories.users.findById(id);
        return user
          ? { id: user.id, companyId: user.companyId, role: user.role }
          : null;
      },
      durationToMs(env.REFRESH_TOKEN_TTL),
    ),
  );

  fastify.addHook("onRequest", async (request) => {
    const key = `${request.method}:${request.routeOptions.url}`;
    if (PUBLIC_ROUTES.has(key)) return;

    await request.jwtVerify(); // throws (401) on missing/invalid token
    const { sub, role, companyId } = request.user;
    const header = request.headers["x-company-id"];
    request.auth = {
      userId: sub,
      role,
      companyId,
      isSuperuser: role === "SUPERUSER",
      requestedCompanyId: typeof header === "string" ? header : null,
    };
  });
});

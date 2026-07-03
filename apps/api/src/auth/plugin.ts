import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env.js";
import { ACCESS_COOKIE } from "./cookies.js";
import { durationToMs } from "./duration.js";
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
  "POST:/auth/signup",
  // Logout authenticates via the refresh cookie + just clears cookies, so it
  // must work even once the access token has expired.
  "POST:/auth/logout",
]);

/**
 * Registers @fastify/cookie + @fastify/jwt, builds the TokenService (needs the
 * jwt signer + the refresh-token/user repos), and verifies the access token on
 * every non-public request, populating `request.auth`. The access token is read
 * from the `Authorization: Bearer` header OR the `sr_access` httpOnly cookie (so
 * the browser SPA authenticates purely by cookie). Register AFTER
 * repositoriesPlugin (needs fastify.repositories) and BEFORE the route plugins.
 */
export const authPlugin = fp(async (fastify: FastifyInstance) => {
  // Cookie plugin must precede jwt so jwt's cookie extraction can read it.
  await fastify.register(fastifyCookie);
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: ACCESS_COOKIE, signed: false },
  });

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

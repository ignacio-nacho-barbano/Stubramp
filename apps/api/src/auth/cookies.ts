import type { FastifyReply } from "fastify";
import { env } from "../env.js";
import { durationToMs } from "./duration.js";
import type { TokenPair } from "./tokens.js";

// ---------------------------------------------------------------------------
// Session cookie handling (server-only).
//
// The browser SPA never sees the raw tokens: login/signup/refresh set these
// httpOnly cookies, and the auth plugin reads the access token back out of the
// `sr_access` cookie. Scoped to COOKIE_DOMAIN so they're shared across the app
// and api subdomains; `SameSite=Lax` is enough because both live under one
// registrable domain (same-site), so the cookies ride cross-subdomain requests.
// ---------------------------------------------------------------------------

export const ACCESS_COOKIE = "sr_access";
export const REFRESH_COOKIE = "sr_refresh";

const IS_PROD = env.NODE_ENV === "production";

function baseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: IS_PROD,
    domain: env.COOKIE_DOMAIN,
  };
}

export function persistSession(reply: FastifyReply, tokens: TokenPair) {
  reply.setCookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    maxAge: Math.floor(durationToMs(env.ACCESS_TOKEN_TTL) / 1000),
  });
  reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    maxAge: Math.floor(durationToMs(env.REFRESH_TOKEN_TTL) / 1000),
  });
}

export function clearSession(reply: FastifyReply) {
  reply.clearCookie(ACCESS_COOKIE, { ...baseOptions(), maxAge: undefined });
  reply.clearCookie(REFRESH_COOKIE, { ...baseOptions(), maxAge: undefined });
}

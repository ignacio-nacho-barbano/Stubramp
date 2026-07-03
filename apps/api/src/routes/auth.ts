import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { UnauthorizedError } from "../domain/errors.js";
import { verifyPassword } from "../auth/password.js";
import {
  REFRESH_COOKIE,
  clearSession,
  persistSession,
} from "../auth/cookies.js";
import { env } from "../env.js";
import { loginInput, signupInput } from "../schemas/auth.schema.js";

export async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Public: self-serve signup. Creates a new company + its first ADMIN user and
  // sets the session cookies so the client is logged straight in.
  r.post("/auth/signup", { schema: { body: signupInput } }, async (req, reply) => {
    const { user, company } = await app.services.auth.signup(req.body);
    const tokens = await app.tokenService.issuePair({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
    });
    persistSession(reply, tokens);
    return reply.code(201).send({ user, company });
  });

  // Public: exchange credentials for a session (set as httpOnly cookies).
  r.post("/auth/login", { schema: { body: loginInput } }, async (req, reply) => {
    const user = await app.repositories.users.findByEmail(req.body.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid credentials");
    }
    const ok = await verifyPassword(
      req.body.password,
      user.passwordHash,
      env.PASSWORD_PEPPER,
    );
    if (!ok) throw new UnauthorizedError("Invalid credentials");

    const tokens = await app.tokenService.issuePair({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
    });
    persistSession(reply, tokens);
    return { ok: true };
  });

  // Public: rotate the refresh-token cookie for a fresh session.
  r.post("/auth/refresh", async (req, reply) => {
    const presented = req.cookies[REFRESH_COOKIE];
    if (!presented) throw new UnauthorizedError("Missing refresh token");
    const tokens = await app.tokenService.rotate(presented);
    persistSession(reply, tokens);
    return { ok: true };
  });

  // Revoke the refresh token (logout) and clear the session cookies. Best-effort
  // revoke: clearing the cookies is what actually ends the browser session.
  r.post("/auth/logout", async (req, reply) => {
    const presented = req.cookies[REFRESH_COOKIE];
    if (presented) await app.tokenService.revoke(presented);
    clearSession(reply);
    return { ok: true };
  });

  // Authed: the current user (sans passwordHash).
  r.get("/auth/me", async (req) => {
    const user = await app.repositories.users.findById(req.auth.userId);
    if (!user) throw new UnauthorizedError();
    const { passwordHash: _omit, ...safe } = user;
    return safe;
  });
}

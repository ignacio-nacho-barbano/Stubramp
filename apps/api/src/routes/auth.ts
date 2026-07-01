import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { UnauthorizedError } from "../domain/errors.js";
import { verifyPassword } from "../auth/password.js";
import { env } from "../env.js";
import {
  loginInput,
  refreshInput,
  signupInput,
} from "../schemas/auth.schema.js";

export async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Public: self-serve signup. Creates a new company + its first ADMIN user and
  // returns a token pair so the client is logged straight in.
  r.post("/auth/signup", { schema: { body: signupInput } }, async (req, reply) => {
    const { user, company } = await app.services.auth.signup(req.body);
    const tokens = await app.tokenService.issuePair({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
    });
    return reply.code(201).send({ ...tokens, user, company });
  });

  // Public: exchange credentials for an access + refresh token pair.
  r.post("/auth/login", { schema: { body: loginInput } }, async (req) => {
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

    return app.tokenService.issuePair({
      id: user.id,
      companyId: user.companyId,
      role: user.role,
    });
  });

  // Public: rotate a refresh token for a new pair.
  r.post("/auth/refresh", { schema: { body: refreshInput } }, async (req) => {
    return app.tokenService.rotate(req.body.refreshToken);
  });

  // Authed: revoke a refresh token (logout).
  r.post("/auth/logout", { schema: { body: refreshInput } }, async (req) => {
    await app.tokenService.revoke(req.body.refreshToken);
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

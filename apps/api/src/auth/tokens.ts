import { createHash, randomBytes } from "node:crypto";
import type { Role } from "../generated/prisma/client.js";
import { UnauthorizedError } from "../domain/errors.js";
import type { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";

export interface AccessTokenPayload {
  sub: string;
  companyId: string | null;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// The minimal user shape needed to mint tokens.
export interface TokenUser {
  id: string;
  companyId: string | null;
  role: Role;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Owns the access + refresh token lifecycle. Access tokens are short-lived,
// stateless JWTs (signed via the injected `signAccessToken`); refresh tokens are
// opaque random strings whose SHA-256 hash is persisted so they can be rotated
// and revoked. Collaborators are injected (signer, repo, user loader) so this is
// unit-testable with fakes — no Fastify or DB required.
export class TokenService {
  constructor(
    private readonly signAccessToken: (payload: AccessTokenPayload) => string,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly loadUser: (id: string) => Promise<TokenUser | null>,
    private readonly refreshTtlMs: number,
  ) {}

  async issuePair(user: TokenUser): Promise<TokenPair> {
    const accessToken = this.signAccessToken({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });
    const refreshToken = randomBytes(32).toString("hex");
    await this.refreshTokens.create({
      user: { connect: { id: user.id } },
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
    });
    return { accessToken, refreshToken };
  }

  // Validate a presented refresh token, revoke it (rotation), and issue a fresh
  // pair. Reusing a rotated/expired/unknown token is rejected.
  async rotate(presented: string): Promise<TokenPair> {
    const record = await this.refreshTokens.findByTokenHash(sha256(presented));
    if (!record) throw new UnauthorizedError("Invalid refresh token");

    // Reuse detection: a token that was already rotated (revoked) is being
    // presented again — a strong signal it was stolen (both the legitimate
    // client and the attacker hold a copy). Revoke the user's entire live token
    // family so the compromised chain can't be used, and force re-login.
    if (record.revokedAt) {
      await this.refreshTokens.revokeAllForUser(record.userId);
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.loadUser(record.userId);
    if (!user) throw new UnauthorizedError("Invalid refresh token");

    await this.refreshTokens.update(record.id, { revokedAt: new Date() });
    return this.issuePair(user);
  }

  // Logout: revoke the presented refresh token if it exists. Idempotent.
  async revoke(presented: string): Promise<void> {
    const record = await this.refreshTokens.findByTokenHash(sha256(presented));
    if (record && !record.revokedAt) {
      await this.refreshTokens.update(record.id, { revokedAt: new Date() });
    }
  }
}

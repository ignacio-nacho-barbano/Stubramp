import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../domain/errors.js";
import type { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { TokenService, type TokenUser } from "./tokens.js";

const TTL_MS = 30 * 86_400_000;

describe("TokenService", () => {
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let findByTokenHash: ReturnType<typeof vi.fn>;
  let revokeAllForUser: ReturnType<typeof vi.fn>;
  let loadUser: ReturnType<typeof vi.fn>;
  let refreshTokens: {
    create: typeof create;
    update: typeof update;
    findByTokenHash: typeof findByTokenHash;
    revokeAllForUser: typeof revokeAllForUser;
  };
  let service: TokenService;

  beforeEach(() => {
    create = vi.fn(async (_data: any) => ({}));
    update = vi.fn(async (_id: string, _data: any) => ({}));
    findByTokenHash = vi.fn();
    revokeAllForUser = vi.fn(async (_userId: string) => 1);
    loadUser = vi.fn(async (id: string) => ({ id, companyId: "c1", role: "ADMIN" }));
    refreshTokens = { create, update, findByTokenHash, revokeAllForUser };
    service = new TokenService(
      () => "access-token",
      refreshTokens as unknown as RefreshTokenRepository,
      loadUser as unknown as (id: string) => Promise<TokenUser | null>,
      TTL_MS,
    );
  });

  it("issues a pair and persists the refresh token hash", async () => {
    const pair = await service.issuePair({ id: "u1", companyId: "c1", role: "ADMIN" });
    expect(pair.accessToken).toBe("access-token");
    expect(pair.refreshToken).toMatch(/^[0-9a-f]{64}$/);
    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0]![0];
    expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(data.tokenHash).not.toBe(pair.refreshToken); // stored hash != raw token
    expect(data.expiresAt).toBeInstanceOf(Date);
  });

  it("rotates a valid refresh token: revokes the old, issues a new pair", async () => {
    findByTokenHash.mockResolvedValueOnce({
      id: "rt1",
      userId: "u1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + TTL_MS),
    });
    const pair = await service.rotate("whatever-raw-token");
    expect(update).toHaveBeenCalledWith("rt1", { revokedAt: expect.any(Date) });
    expect(loadUser).toHaveBeenCalledWith("u1");
    expect(pair.refreshToken).toMatch(/^[0-9a-f]{64}$/);
    expect(create).toHaveBeenCalledTimes(1); // the new token
  });

  it("rejects an unknown refresh token", async () => {
    findByTokenHash.mockResolvedValueOnce(null);
    await expect(service.rotate("x")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a revoked refresh token and revokes the whole family (reuse detection)", async () => {
    findByTokenHash.mockResolvedValueOnce({
      id: "rt1",
      userId: "u1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + TTL_MS),
    });
    await expect(service.rotate("x")).rejects.toBeInstanceOf(UnauthorizedError);
    // Presenting an already-rotated token = likely theft: nuke the family.
    expect(revokeAllForUser).toHaveBeenCalledWith("u1");
    expect(create).not.toHaveBeenCalled(); // no new pair issued
  });

  it("rejects an expired refresh token", async () => {
    findByTokenHash.mockResolvedValueOnce({
      id: "rt1",
      userId: "u1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.rotate("x")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

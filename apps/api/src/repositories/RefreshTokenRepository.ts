import type { Prisma, RefreshToken } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface RefreshTokenTypes extends ModelTypes {
  Model: RefreshToken;
  WhereUnique: Prisma.RefreshTokenWhereUniqueInput;
  Where: Prisma.RefreshTokenWhereInput;
  Create: Prisma.RefreshTokenCreateInput;
  Update: Prisma.RefreshTokenUpdateInput;
  OrderBy:
    | Prisma.RefreshTokenOrderByWithRelationInput
    | Prisma.RefreshTokenOrderByWithRelationInput[];
}

export class RefreshTokenRepository extends BaseRepository<RefreshTokenTypes> {
  constructor(
    private readonly tokens: Prisma.TransactionClient["refreshToken"],
  ) {
    super(tokens as unknown as ModelDelegate, "RefreshToken");
  }

  // tokenHash is @unique, so findUnique is correct.
  findByTokenHash(tokenHash: string) {
    return this.tokens.findUnique({ where: { tokenHash } });
  }

  // Revoke every still-live refresh token for a user. Used as the theft response
  // when a rotated (already-revoked) token is presented again, and for logout-all.
  // Returns the number of tokens revoked.
  async revokeAllForUser(userId: string): Promise<number> {
    const { count } = await this.tokens.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  withTx(tx: Prisma.TransactionClient): RefreshTokenRepository {
    return new RefreshTokenRepository(tx.refreshToken);
  }
}

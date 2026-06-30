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
  constructor(private readonly tokens: Prisma.TransactionClient["refreshToken"]) {
    super(tokens as unknown as ModelDelegate, "RefreshToken");
  }

  // tokenHash is @unique, so findUnique is correct.
  findByTokenHash(tokenHash: string) {
    return this.tokens.findUnique({ where: { tokenHash } });
  }

  withTx(tx: Prisma.TransactionClient): RefreshTokenRepository {
    return new RefreshTokenRepository(tx.refreshToken);
  }
}

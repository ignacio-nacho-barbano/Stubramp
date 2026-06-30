import type { Card, Prisma } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface CardTypes extends ModelTypes {
  Model: Card;
  WhereUnique: Prisma.CardWhereUniqueInput;
  Where: Prisma.CardWhereInput;
  Create: Prisma.CardCreateInput;
  Update: Prisma.CardUpdateInput;
  OrderBy:
    | Prisma.CardOrderByWithRelationInput
    | Prisma.CardOrderByWithRelationInput[];
}

export class CardRepository extends BaseRepository<CardTypes> {
  constructor(private readonly cards: Prisma.TransactionClient["card"]) {
    super(cards as unknown as ModelDelegate, "Card");
  }

  // Uses @@index([ownerId]). Optionally filters by status, company-scoped.
  findByOwnerId(
    ownerId: string,
    companyId: string | null,
    opts?: { status?: Prisma.CardWhereInput["status"] },
  ) {
    return this.cards.findMany({
      where: {
        ownerId,
        ...(companyId ? { companyId } : {}),
        ...(opts?.status ? { status: opts.status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Company-scoped single lookup; null companyId = no filter (superuser).
  findByIdScoped(id: string, companyId: string | null) {
    return this.cards.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
  }

  withTx(tx: Prisma.TransactionClient): CardRepository {
    return new CardRepository(tx.card);
  }
}

import type { Prisma, Transaction } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface TransactionTypes extends ModelTypes {
  Model: Transaction;
  WhereUnique: Prisma.TransactionWhereUniqueInput;
  Where: Prisma.TransactionWhereInput;
  Create: Prisma.TransactionCreateInput;
  Update: Prisma.TransactionUpdateInput;
  OrderBy:
    | Prisma.TransactionOrderByWithRelationInput
    | Prisma.TransactionOrderByWithRelationInput[];
}

export class TransactionRepository extends BaseRepository<TransactionTypes> {
  constructor(
    private readonly txns: Prisma.TransactionClient["transaction"],
  ) {
    super(txns as unknown as ModelDelegate, "Transaction");
  }

  // Uses @@index([cardId]).
  findByCardId(cardId: string) {
    return this.txns.findMany({
      where: { cardId },
      orderBy: { createdAt: "desc" },
    });
  }

  withTx(tx: Prisma.TransactionClient): TransactionRepository {
    return new TransactionRepository(tx.transaction);
  }
}

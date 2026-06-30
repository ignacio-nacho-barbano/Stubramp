import type { BillEvent, Prisma } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface BillEventTypes extends ModelTypes {
  Model: BillEvent;
  WhereUnique: Prisma.BillEventWhereUniqueInput;
  Where: Prisma.BillEventWhereInput;
  Create: Prisma.BillEventCreateInput;
  Update: Prisma.BillEventUpdateInput;
  OrderBy:
    | Prisma.BillEventOrderByWithRelationInput
    | Prisma.BillEventOrderByWithRelationInput[];
}

// Append-only audit log of bill status changes. Events are only ever created
// (inside a BillService transition transaction), never updated or deleted.
export class BillEventRepository extends BaseRepository<BillEventTypes> {
  constructor(private readonly events: Prisma.TransactionClient["billEvent"]) {
    super(events as unknown as ModelDelegate, "BillEvent");
  }

  // Uses @@index([billId]). Chronological for a readable audit trail.
  findByBillId(billId: string) {
    return this.events.findMany({
      where: { billId },
      orderBy: { createdAt: "asc" },
    });
  }

  withTx(tx: Prisma.TransactionClient): BillEventRepository {
    return new BillEventRepository(tx.billEvent);
  }
}

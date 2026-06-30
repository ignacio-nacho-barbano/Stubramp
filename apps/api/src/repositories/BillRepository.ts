import type { Bill, BillStatus, Prisma } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface BillTypes extends ModelTypes {
  Model: Bill;
  WhereUnique: Prisma.BillWhereUniqueInput;
  Where: Prisma.BillWhereInput;
  Create: Prisma.BillCreateInput;
  Update: Prisma.BillUpdateInput;
  OrderBy:
    | Prisma.BillOrderByWithRelationInput
    | Prisma.BillOrderByWithRelationInput[];
}

// The bill aggregate: everything the guards and API responses reason about.
export const BILL_INCLUDE = {
  vendor: true,
  lineItems: { include: { splits: true } },
  payments: true,
  events: true,
} satisfies Prisma.BillInclude;

export type BillWithRelations = Prisma.BillGetPayload<{
  include: typeof BILL_INCLUDE;
}>;

export class BillRepository extends BaseRepository<BillTypes> {
  constructor(private readonly bills: Prisma.TransactionClient["bill"]) {
    super(bills as unknown as ModelDelegate, "Bill");
  }

  // Loads the full aggregate (lineItems + splits, payments, events, vendor).
  findByIdWithRelations(id: string): Promise<BillWithRelations | null> {
    return this.bills.findUnique({ where: { id }, include: BILL_INCLUDE });
  }

  // Uses @@index([status]) + @@index([dueDate]) for AP-aging ordering.
  findByStatus(status?: BillStatus) {
    return this.bills.findMany({
      where: status ? { status } : undefined,
      orderBy: { dueDate: "asc" },
    });
  }

  // Uses @@index([vendorId]).
  findByVendorId(vendorId: string) {
    return this.bills.findMany({
      where: { vendorId },
      orderBy: { dueDate: "asc" },
    });
  }

  withTx(tx: Prisma.TransactionClient): BillRepository {
    return new BillRepository(tx.bill);
  }
}

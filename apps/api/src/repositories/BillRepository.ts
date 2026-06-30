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

  // Loads the full aggregate, company-scoped. `companyId` null = no filter
  // (superuser). findFirst (not findUnique) because { id, companyId } isn't a
  // unique index; a cross-tenant row returns null → caller 404s (no leak).
  findByIdScoped(
    id: string,
    companyId: string | null,
  ): Promise<BillWithRelations | null> {
    return this.bills.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: BILL_INCLUDE,
    });
  }

  // Uses @@index([companyId]) + @@index([status]) + @@index([dueDate]).
  findByStatus(companyId: string | null, status?: BillStatus) {
    return this.bills.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(status ? { status } : {}),
      },
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

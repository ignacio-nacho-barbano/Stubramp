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
  // Includes the vendor and a line-item count so the list view can render
  // vendor name + "N lines" without loading the full aggregate per row.
  findByStatus(companyId: string | null, status?: BillStatus) {
    return this.bills.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(status ? { status } : {}),
      },
      include: { vendor: true, _count: { select: { lineItems: true } } },
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

  // Compare-and-swap the status: flips `id` from `from` to `to` only if the row
  // is *still* in `from`. Returns the number of rows changed — 0 means another
  // request already moved it (lost the race), so the caller must not proceed.
  // This is the atomic gate that prevents two concurrent transitions from both
  // applying (e.g. double-scheduling a payment). Call inside a transaction via
  // `withTx(tx)`.
  async casStatus(
    id: string,
    from: BillStatus,
    to: BillStatus,
  ): Promise<number> {
    const { count } = await this.bills.updateMany({
      where: { id, status: from },
      data: { status: to },
    });
    return count;
  }

  // Race-safe, company-scoped delete: removes the bill only if it's *still* in
  // `status`, mirroring the casStatus gate. Returns rows deleted — 0 means a
  // concurrent transition already moved it out of `status` (or the id/company
  // didn't match). DB-level ON DELETE CASCADE removes the line items, splits,
  // payments, and events along with it.
  async deleteScopedIfStatus(
    id: string,
    companyId: string,
    status: BillStatus,
  ): Promise<number> {
    const { count } = await this.bills.deleteMany({
      where: { id, companyId, status },
    });
    return count;
  }

  withTx(tx: Prisma.TransactionClient): BillRepository {
    return new BillRepository(tx.bill);
  }
}

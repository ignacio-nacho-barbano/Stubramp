import type {
  Payment,
  PaymentStatus,
  Prisma,
} from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface PaymentTypes extends ModelTypes {
  Model: Payment;
  WhereUnique: Prisma.PaymentWhereUniqueInput;
  Where: Prisma.PaymentWhereInput;
  Create: Prisma.PaymentCreateInput;
  Update: Prisma.PaymentUpdateInput;
  OrderBy:
    | Prisma.PaymentOrderByWithRelationInput
    | Prisma.PaymentOrderByWithRelationInput[];
}

export class PaymentRepository extends BaseRepository<PaymentTypes> {
  constructor(private readonly payments: Prisma.TransactionClient["payment"]) {
    super(payments as unknown as ModelDelegate, "Payment");
  }

  // Uses @@index([billId]) + @@index([companyId]). null companyId = no filter.
  findByBillId(billId: string, companyId: string | null) {
    return this.payments.findMany({
      where: { billId, ...(companyId ? { companyId } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  // Company-scoped single lookup; null companyId = no filter (superuser).
  findByIdScoped(id: string, companyId: string | null) {
    return this.payments.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
  }

  // Compare-and-swap settle: transitions the payment out of PENDING only if it's
  // still PENDING. Returns rows changed — 0 means it was already settled (a
  // concurrent/duplicate settle). Call inside a transaction via `withTx(tx)`.
  async casSettle(
    id: string,
    data: { status: PaymentStatus; paidAt: Date | null },
  ): Promise<number> {
    const { count } = await this.payments.updateMany({
      where: { id, status: "PENDING" },
      data,
    });
    return count;
  }

  withTx(tx: Prisma.TransactionClient): PaymentRepository {
    return new PaymentRepository(tx.payment);
  }
}

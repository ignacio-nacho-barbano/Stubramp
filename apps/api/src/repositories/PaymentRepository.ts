import type { Payment, Prisma } from "../generated/prisma/client.js";
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

  withTx(tx: Prisma.TransactionClient): PaymentRepository {
    return new PaymentRepository(tx.payment);
  }
}

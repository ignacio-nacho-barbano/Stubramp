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

  // Uses @@index([billId]).
  findByBillId(billId: string) {
    return this.payments.findMany({
      where: { billId },
      orderBy: { createdAt: "desc" },
    });
  }

  withTx(tx: Prisma.TransactionClient): PaymentRepository {
    return new PaymentRepository(tx.payment);
  }
}

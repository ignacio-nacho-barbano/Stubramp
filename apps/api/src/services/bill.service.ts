import type { BillStatus, PrismaClient } from "../generated/prisma/client.js";
import { canTransition } from "../domain/bill-state-machine.js";
import {
  GuardFailedError,
  IllegalTransitionError,
  NotFoundError,
} from "../domain/errors.js";
import type { BillEventRepository } from "../repositories/BillEventRepository.js";
import {
  BILL_INCLUDE,
  type BillRepository,
  type BillWithRelations,
} from "../repositories/BillRepository.js";
import type { PaymentRepository } from "../repositories/PaymentRepository.js";
import type {
  CreateBillInput,
  TransitionInput,
} from "../schemas/bill.schema.js";
import type { SettlePaymentInput } from "../schemas/payment.schema.js";

// Orchestrates the payables domain: enforces the splits-sum-to-line invariant on
// creation, drives the bill state machine, and keeps the audit log + payments
// consistent inside transactions. The single place a bill's status ever changes.
export class BillService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly bills: BillRepository,
    private readonly payments: PaymentRepository,
    private readonly billEvents: BillEventRepository,
  ) {}

  async create(input: CreateBillInput) {
    // Invariant: each line's splits must sum exactly to that line's amount.
    const lines = input.lines.map((line) => {
      const amountCents = line.quantity * line.unitCents;
      const splitTotal = line.splits.reduce((s, sp) => s + sp.amountCents, 0);
      if (splitTotal !== amountCents) {
        throw new GuardFailedError(
          `Line "${line.description}": splits total ${splitTotal} != line amount ${amountCents}`,
        );
      }
      return { ...line, amountCents };
    });

    const totalCents = lines.reduce((s, l) => s + l.amountCents, 0);

    return this.bills.create(
      {
        vendor: { connect: { id: input.vendorId } },
        billNumber: input.billNumber,
        source: input.source,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        currency: input.currency,
        totalCents,
        lineItems: {
          create: lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitCents: l.unitCents,
            amountCents: l.amountCents,
            classification: l.classification,
            glAccount: l.glAccount,
            splits: {
              create: l.splits.map((s) => ({
                costCenter: s.costCenter,
                amountCents: s.amountCents,
              })),
            },
          })),
        },
        events: { create: { toStatus: "DRAFT", actor: input.source } },
      },
      { include: BILL_INCLUDE },
    );
  }

  list(status?: BillStatus) {
    return this.bills.findByStatus(status);
  }

  async get(id: string) {
    const bill = await this.bills.findByIdWithRelations(id);
    if (!bill) throw new NotFoundError("Bill", id);
    return bill;
  }

  async transition(id: string, input: TransitionInput) {
    const bill = await this.bills.findByIdWithRelations(id);
    if (!bill) throw new NotFoundError("Bill", id);

    const from = bill.status;
    const to = input.to;

    if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
    runGuard(from, to, bill, input);

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.bills.withTx(tx).update(id, { status: to });

      await this.billEvents.withTx(tx).create({
        bill: { connect: { id } },
        fromStatus: from,
        toStatus: to,
        actor: input.actor,
      });

      // Scheduling is the one transition with a side effect: it materializes a
      // pending payment for the bill's full amount.
      if (to === "SCHEDULED") {
        await this.payments.withTx(tx).create({
          bill: { connect: { id } },
          amountCents: bill.totalCents,
          method: input.method ?? "ACH",
          status: "PENDING",
          scheduledFor: input.scheduledFor,
        });
      }

      return updated;
    });
  }

  // Settle a scheduled payment and drive the bill to its terminal/retry state
  // through the same state machine: SUCCEEDED -> PAID, FAILED -> FAILED.
  async settlePayment(
    paymentId: string,
    input: SettlePaymentInput,
  ): Promise<BillWithRelations> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) throw new NotFoundError("Payment", paymentId);

    const bill = await this.bills.findByIdWithRelations(payment.billId);
    if (!bill) throw new NotFoundError("Bill", payment.billId);

    const to: BillStatus = input.outcome === "SUCCEEDED" ? "PAID" : "FAILED";
    const from = bill.status;
    if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);

    await this.prisma.$transaction(async (tx) => {
      await this.payments.withTx(tx).update(paymentId, {
        status: input.outcome,
        paidAt: input.outcome === "SUCCEEDED" ? new Date() : null,
      });
      await this.bills.withTx(tx).update(bill.id, { status: to });
      await this.billEvents.withTx(tx).create({
        bill: { connect: { id: bill.id } },
        fromStatus: from,
        toStatus: to,
        actor: input.actor,
      });
    });

    return this.get(bill.id);
  }
}

// Guards encode the business rules a structurally-legal transition must still pass.
function runGuard(
  from: BillStatus,
  to: BillStatus,
  bill: BillWithRelations,
  input: TransitionInput,
): void {
  if (from === "DRAFT" && to === "SUBMITTED") {
    if (bill.lineItems.length === 0) {
      throw new GuardFailedError("Cannot submit a bill with no line items");
    }
    for (const line of bill.lineItems) {
      const splitTotal = line.splits.reduce((s, sp) => s + sp.amountCents, 0);
      if (splitTotal !== line.amountCents) {
        throw new GuardFailedError(
          `Line "${line.description}" splits no longer sum to the line amount`,
        );
      }
    }
  }

  if (from === "APPROVED" && to === "SCHEDULED") {
    if (!input.scheduledFor) {
      throw new GuardFailedError("scheduledFor is required to schedule a payment");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (input.scheduledFor < today) {
      throw new GuardFailedError("scheduledFor cannot be in the past");
    }
  }
}

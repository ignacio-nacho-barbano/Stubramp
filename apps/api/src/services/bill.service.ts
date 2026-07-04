import type { BillStatus, PrismaClient } from "../generated/prisma/client.js";
import type { AuthContext } from "../auth/context.js";
import { requireCompanyForWrite, resolveCompanyId } from "../auth/scope.js";
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
import type { VendorRepository } from "../repositories/VendorRepository.js";
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
    private readonly vendors: VendorRepository,
  ) {}

  async create(auth: AuthContext, input: CreateBillInput) {
    const companyId = requireCompanyForWrite(auth);

    // The vendor must belong to the same company — no attaching a bill to
    // another tenant's vendor.
    const vendorOk = await this.vendors.exists({ id: input.vendorId, companyId });
    if (!vendorOk) {
      throw new NotFoundError("Vendor", input.vendorId);
    }

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
        company: { connect: { id: companyId } },
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
        events: { create: { toStatus: "DRAFT", actor: auth.userId } },
      },
      { include: BILL_INCLUDE },
    );
  }

  list(auth: AuthContext, status?: BillStatus) {
    return this.bills.findByStatus(resolveCompanyId(auth), status);
  }

  async get(auth: AuthContext, id: string) {
    const bill = await this.bills.findByIdScoped(id, resolveCompanyId(auth));
    if (!bill) throw new NotFoundError("Bill", id); // 404 for cross-tenant — no leak
    return bill;
  }

  async transition(auth: AuthContext, id: string, input: TransitionInput) {
    const bill = await this.bills.findByIdScoped(id, resolveCompanyId(auth));
    if (!bill) throw new NotFoundError("Bill", id);

    const from = bill.status;
    const to = input.to;

    if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
    runGuard(from, to, bill, input);

    await this.prisma.$transaction(async (tx) => {
      // Compare-and-swap on the status is the atomic gate: if a concurrent
      // request already moved the bill out of `from`, this changes 0 rows and we
      // abort — so two racing transitions can't both apply (no double payment).
      const changed = await this.bills.withTx(tx).casStatus(id, from, to);
      if (changed === 0) throw new IllegalTransitionError(from, to);

      await this.billEvents.withTx(tx).create({
        bill: { connect: { id } },
        fromStatus: from,
        toStatus: to,
        actor: auth.userId,
      });

      // Scheduling is the one transition with a side effect: it materializes a
      // pending payment for the bill's full amount (stamped with the bill's company).
      if (to === "SCHEDULED") {
        await this.payments.withTx(tx).create({
          company: { connect: { id: bill.companyId } },
          bill: { connect: { id } },
          amountCents: bill.totalCents,
          method: input.method ?? "ACH",
          status: "PENDING",
          scheduledFor: input.scheduledFor,
        });
      }
    });

    // Return the fresh aggregate (with relations), matching settlePayment.
    return this.get(auth, id);
  }

  // Settle a scheduled payment and drive the bill to its terminal/retry state
  // through the same state machine: SUCCEEDED -> PAID, FAILED -> FAILED.
  async settlePayment(
    auth: AuthContext,
    paymentId: string,
    input: SettlePaymentInput,
  ): Promise<BillWithRelations> {
    const companyId = resolveCompanyId(auth);
    const payment = await this.payments.findByIdScoped(paymentId, companyId);
    if (!payment) throw new NotFoundError("Payment", paymentId);

    const bill = await this.bills.findByIdScoped(payment.billId, companyId);
    if (!bill) throw new NotFoundError("Bill", payment.billId);

    const to: BillStatus = input.outcome === "SUCCEEDED" ? "PAID" : "FAILED";
    const from = bill.status;
    if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);

    await this.prisma.$transaction(async (tx) => {
      // CAS the payment out of PENDING first: 0 rows means it was already
      // settled by a concurrent/duplicate request, so we abort before touching
      // the bill.
      const settled = await this.payments.withTx(tx).casSettle(paymentId, {
        status: input.outcome,
        paidAt: input.outcome === "SUCCEEDED" ? new Date() : null,
      });
      if (settled === 0) {
        throw new GuardFailedError("Payment is not pending (already settled)");
      }

      // CAS the bill status too, so a racing transition can't double-apply.
      const changed = await this.bills.withTx(tx).casStatus(bill.id, from, to);
      if (changed === 0) throw new IllegalTransitionError(from, to);

      await this.billEvents.withTx(tx).create({
        bill: { connect: { id: bill.id } },
        fromStatus: from,
        toStatus: to,
        actor: auth.userId,
      });
    });

    return this.get(auth, bill.id);
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

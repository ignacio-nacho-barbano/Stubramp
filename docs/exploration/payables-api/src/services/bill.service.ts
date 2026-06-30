import { prisma } from '../lib/prisma.js';
import {
  type BillStatus,
  canTransition,
} from '../domain/bill-state-machine.js';
import {
  GuardFailedError,
  IllegalTransitionError,
  NotFoundError,
} from '../domain/errors.js';
import type { CreateBillInput, TransitionInput } from '../schemas/bill.schema.js';

// A bill loaded with the relations the guards need to reason about.
type BillWithLines = Awaited<ReturnType<typeof loadBill>>;

async function loadBill(id: string) {
  return prisma.bill.findUnique({
    where: { id },
    include: { lineItems: { include: { splits: true } } },
  });
}

export const billService = {
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

    return prisma.bill.create({
      data: {
        vendorId: input.vendorId,
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
        events: { create: { toStatus: 'DRAFT', actor: input.source } },
      },
      include: { lineItems: { include: { splits: true } } },
    });
  },

  list(status?: BillStatus) {
    return prisma.bill.findMany({
      where: status ? { status } : undefined,
      orderBy: { dueDate: 'asc' },
    });
  },

  async get(id: string) {
    const bill = await loadBill(id);
    if (!bill) throw new NotFoundError('Bill', id);
    return bill;
  },

  // The one place a bill's status ever changes.
  async transition(id: string, input: TransitionInput) {
    const bill = await loadBill(id);
    if (!bill) throw new NotFoundError('Bill', id);

    const from = bill.status;
    const to = input.to;

    if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
    runGuard(from, to, bill, input);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.bill.update({
        where: { id },
        data: { status: to },
      });

      await tx.billEvent.create({
        data: { billId: id, fromStatus: from, toStatus: to, actor: input.actor },
      });

      // Scheduling a payment is the one transition with a side effect.
      if (to === 'SCHEDULED') {
        await tx.payment.create({
          data: {
            billId: id,
            amountCents: bill.totalCents,
            method: input.method ?? 'ACH',
            status: 'PENDING',
            scheduledFor: input.scheduledFor,
          },
        });
      }

      return updated;
    });
  },
};

// Guards encode the business rules a structurally-legal transition must still pass.
function runGuard(
  from: BillStatus,
  to: BillStatus,
  bill: NonNullable<BillWithLines>,
  input: TransitionInput,
): void {
  if (from === 'DRAFT' && to === 'SUBMITTED') {
    if (bill.lineItems.length === 0) {
      throw new GuardFailedError('Cannot submit a bill with no line items');
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

  if (from === 'APPROVED' && to === 'SCHEDULED') {
    if (!input.scheduledFor) {
      throw new GuardFailedError('scheduledFor is required to schedule a payment');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (input.scheduledFor < today) {
      throw new GuardFailedError('scheduledFor cannot be in the past');
    }
  }
}

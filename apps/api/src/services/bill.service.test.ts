import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuardFailedError, IllegalTransitionError } from "../domain/errors.js";
import type { BillEventRepository } from "../repositories/BillEventRepository.js";
import type { BillRepository } from "../repositories/BillRepository.js";
import type { PaymentRepository } from "../repositories/PaymentRepository.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { BillService } from "./bill.service.js";

// A bill aggregate with one balanced line (1 x 1000c, split fully to ENG).
function makeBill(overrides: Record<string, unknown> = {}) {
  return {
    id: "bill-1",
    vendorId: "vendor-1",
    billNumber: "INV-1",
    status: "DRAFT",
    source: "MANUAL",
    issueDate: new Date("2026-06-01"),
    dueDate: new Date("2026-07-01"),
    currency: "USD",
    totalCents: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    vendor: { id: "vendor-1", name: "Acme" },
    payments: [],
    events: [],
    lineItems: [
      {
        id: "li-1",
        billId: "bill-1",
        description: "AWS",
        quantity: 1,
        unitCents: 1000,
        amountCents: 1000,
        classification: "EXPENSE",
        glAccount: null,
        splits: [
          {
            id: "sp-1",
            lineItemId: "li-1",
            templateId: null,
            costCenter: "ENG",
            amountCents: 1000,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function makeBillInput(overrides: Record<string, unknown> = {}) {
  return {
    vendorId: "11111111-1111-1111-1111-111111111111",
    billNumber: "INV-1",
    source: "MANUAL" as const,
    issueDate: new Date("2026-06-01"),
    dueDate: new Date("2026-07-01"),
    currency: "USD",
    lines: [
      {
        description: "AWS",
        quantity: 1,
        unitCents: 1000,
        classification: "EXPENSE" as const,
        splits: [{ costCenter: "ENG", amountCents: 1000 }],
      },
    ],
    ...overrides,
  };
}

describe("BillService", () => {
  // Repo write mocks (the methods reached via withTx inside transactions).
  let billUpdate: ReturnType<typeof vi.fn>;
  let paymentCreate: ReturnType<typeof vi.fn>;
  let paymentUpdate: ReturnType<typeof vi.fn>;
  let eventCreate: ReturnType<typeof vi.fn>;

  let bills: {
    create: ReturnType<typeof vi.fn>;
    findByStatus: ReturnType<typeof vi.fn>;
    findByIdWithRelations: ReturnType<typeof vi.fn>;
    withTx: ReturnType<typeof vi.fn>;
  };
  let payments: {
    findById: ReturnType<typeof vi.fn>;
    withTx: ReturnType<typeof vi.fn>;
  };
  let billEvents: { withTx: ReturnType<typeof vi.fn> };
  let prisma: { $transaction: ReturnType<typeof vi.fn> };
  let service: BillService;

  beforeEach(() => {
    billUpdate = vi.fn(async (_id: string, _data: any) => makeBill());
    paymentCreate = vi.fn(async (_data: any) => ({}));
    paymentUpdate = vi.fn(async (_id: string, _data: any) => ({}));
    eventCreate = vi.fn(async (_data: any) => ({}));

    bills = {
      create: vi.fn(async (_data: any, _args?: any) => makeBill()),
      findByStatus: vi.fn(async () => [makeBill()]),
      findByIdWithRelations: vi.fn(async () => makeBill()),
      withTx: vi.fn(() => ({ update: billUpdate })),
    };
    payments = {
      findById: vi.fn(),
      withTx: vi.fn(() => ({ create: paymentCreate, update: paymentUpdate })),
    };
    billEvents = { withTx: vi.fn(() => ({ create: eventCreate })) };
    // The tx double is opaque: every write goes through a repo's withTx, which
    // ignores it here. $transaction just runs the callback.
    prisma = { $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb({})) };

    service = new BillService(
      prisma as unknown as PrismaClient,
      bills as unknown as BillRepository,
      payments as unknown as PaymentRepository,
      billEvents as unknown as BillEventRepository,
    );
  });

  describe("create", () => {
    it("rejects a line whose splits don't sum to the line amount", async () => {
      const input = makeBillInput({
        lines: [
          {
            description: "AWS",
            quantity: 1,
            unitCents: 1000,
            classification: "EXPENSE" as const,
            splits: [{ costCenter: "ENG", amountCents: 600 }], // 600 != 1000
          },
        ],
      });
      await expect(service.create(input as never)).rejects.toBeInstanceOf(
        GuardFailedError,
      );
      expect(bills.create).not.toHaveBeenCalled();
    });

    it("computes totalCents and persists a balanced bill", async () => {
      const input = makeBillInput({
        lines: [
          {
            description: "AWS",
            quantity: 2,
            unitCents: 500,
            classification: "EXPENSE" as const,
            splits: [{ costCenter: "ENG", amountCents: 1000 }],
          },
        ],
      });
      await service.create(input as never);
      expect(bills.create).toHaveBeenCalledTimes(1);
      const data = bills.create.mock.calls[0]![0];
      expect(data.totalCents).toBe(1000);
    });
  });

  describe("transition", () => {
    it("rejects an illegal jump", async () => {
      bills.findByIdWithRelations.mockResolvedValueOnce(
        makeBill({ status: "DRAFT" }),
      );
      await expect(
        service.transition("bill-1", { to: "APPROVED", actor: "alice" } as never),
      ).rejects.toBeInstanceOf(IllegalTransitionError);
    });

    it("requires scheduledFor when scheduling", async () => {
      bills.findByIdWithRelations.mockResolvedValueOnce(
        makeBill({ status: "APPROVED" }),
      );
      await expect(
        service.transition("bill-1", { to: "SCHEDULED", actor: "alice" } as never),
      ).rejects.toBeInstanceOf(GuardFailedError);
    });

    it("rejects a scheduledFor in the past", async () => {
      bills.findByIdWithRelations.mockResolvedValueOnce(
        makeBill({ status: "APPROVED" }),
      );
      await expect(
        service.transition("bill-1", {
          to: "SCHEDULED",
          actor: "alice",
          scheduledFor: new Date("2000-01-01"),
        } as never),
      ).rejects.toBeInstanceOf(GuardFailedError);
    });

    it("submits a bill with valid lines and writes an event", async () => {
      bills.findByIdWithRelations.mockResolvedValueOnce(
        makeBill({ status: "DRAFT" }),
      );
      await service.transition("bill-1", {
        to: "SUBMITTED",
        actor: "alice",
      } as never);
      expect(billUpdate).toHaveBeenCalledWith("bill-1", { status: "SUBMITTED" });
      expect(eventCreate).toHaveBeenCalledTimes(1);
      expect(paymentCreate).not.toHaveBeenCalled();
    });

    it("materializes a pending payment when scheduling", async () => {
      bills.findByIdWithRelations.mockResolvedValueOnce(
        makeBill({ status: "APPROVED", totalCents: 1000 }),
      );
      await service.transition("bill-1", {
        to: "SCHEDULED",
        actor: "alice",
        scheduledFor: new Date("2999-01-01"),
      } as never);
      expect(paymentCreate).toHaveBeenCalledTimes(1);
      const data = paymentCreate.mock.calls[0]![0];
      expect(data).toMatchObject({
        bill: { connect: { id: "bill-1" } },
        amountCents: 1000,
        method: "ACH",
        status: "PENDING",
      });
    });
  });

  describe("settlePayment", () => {
    it("drives the bill to PAID and stamps paidAt on success", async () => {
      payments.findById.mockResolvedValueOnce({ id: "pay-1", billId: "bill-1" });
      bills.findByIdWithRelations.mockResolvedValue(
        makeBill({ status: "SCHEDULED" }),
      );
      await service.settlePayment("pay-1", { outcome: "SUCCEEDED", actor: "bob" });
      expect(paymentUpdate).toHaveBeenCalledTimes(1);
      const [id, data] = paymentUpdate.mock.calls[0]!;
      expect(id).toBe("pay-1");
      expect(data.status).toBe("SUCCEEDED");
      expect(data.paidAt).toBeInstanceOf(Date);
      expect(billUpdate).toHaveBeenCalledWith("bill-1", { status: "PAID" });
    });

    it("drives the bill to FAILED on failure", async () => {
      payments.findById.mockResolvedValueOnce({ id: "pay-1", billId: "bill-1" });
      bills.findByIdWithRelations.mockResolvedValue(
        makeBill({ status: "SCHEDULED" }),
      );
      await service.settlePayment("pay-1", { outcome: "FAILED", actor: "bob" });
      const data = paymentUpdate.mock.calls[0]![1];
      expect(data.status).toBe("FAILED");
      expect(data.paidAt).toBeNull();
      expect(billUpdate).toHaveBeenCalledWith("bill-1", { status: "FAILED" });
    });
  });
});

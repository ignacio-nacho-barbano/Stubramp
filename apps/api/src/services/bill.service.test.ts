import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "../auth/context.js";
import { GuardFailedError, IllegalTransitionError } from "../domain/errors.js";
import type { BillEventRepository } from "../repositories/BillEventRepository.js";
import type { BillRepository } from "../repositories/BillRepository.js";
import type { PaymentRepository } from "../repositories/PaymentRepository.js";
import type { VendorRepository } from "../repositories/VendorRepository.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { BillService } from "./bill.service.js";

// A company-scoped ADMIN actor used across the cases.
const auth: AuthContext = {
  userId: "u1",
  role: "ADMIN",
  companyId: "company-1",
  isSuperuser: false,
  requestedCompanyId: null,
};

// A bill aggregate with one balanced line (1 x 1000c, split fully to ENG).
function makeBill(overrides: Record<string, unknown> = {}) {
  return {
    id: "bill-1",
    companyId: "company-1",
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
  // Status changes go through compare-and-swap (casStatus/casSettle), which
  // return the number of rows changed — 1 = applied, 0 = lost the race.
  let billCas: ReturnType<typeof vi.fn>;
  let paymentCas: ReturnType<typeof vi.fn>;
  let paymentCreate: ReturnType<typeof vi.fn>;
  let eventCreate: ReturnType<typeof vi.fn>;

  let bills: {
    create: ReturnType<typeof vi.fn>;
    findByStatus: ReturnType<typeof vi.fn>;
    findByIdScoped: ReturnType<typeof vi.fn>;
    withTx: ReturnType<typeof vi.fn>;
  };
  let payments: {
    findByIdScoped: ReturnType<typeof vi.fn>;
    withTx: ReturnType<typeof vi.fn>;
  };
  let billEvents: { withTx: ReturnType<typeof vi.fn> };
  let vendors: { exists: ReturnType<typeof vi.fn> };
  let prisma: { $transaction: ReturnType<typeof vi.fn> };
  let service: BillService;

  beforeEach(() => {
    billCas = vi.fn(async (_id: string, _from: any, _to: any) => 1);
    paymentCas = vi.fn(async (_id: string, _data: any) => 1);
    paymentCreate = vi.fn(async (_data: any) => ({}));
    eventCreate = vi.fn(async (_data: any) => ({}));

    bills = {
      create: vi.fn(async (_data: any, _args?: any) => makeBill()),
      findByStatus: vi.fn(async () => [makeBill()]),
      findByIdScoped: vi.fn(async () => makeBill()),
      withTx: vi.fn(() => ({ casStatus: billCas })),
    };
    payments = {
      findByIdScoped: vi.fn(),
      withTx: vi.fn(() => ({ create: paymentCreate, casSettle: paymentCas })),
    };
    billEvents = { withTx: vi.fn(() => ({ create: eventCreate })) };
    vendors = { exists: vi.fn(async () => true) };
    // The tx double is opaque: every write goes through a repo's withTx, which
    // ignores it here. $transaction just runs the callback.
    prisma = {
      $transaction: vi.fn(async (cb: (t: unknown) => unknown) => cb({})),
    };

    service = new BillService(
      prisma as unknown as PrismaClient,
      bills as unknown as BillRepository,
      payments as unknown as PaymentRepository,
      billEvents as unknown as BillEventRepository,
      vendors as unknown as VendorRepository,
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
      await expect(service.create(auth, input as never)).rejects.toBeInstanceOf(
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
      await service.create(auth, input as never);
      expect(bills.create).toHaveBeenCalledTimes(1);
      const data = bills.create.mock.calls[0]![0];
      expect(data.totalCents).toBe(1000);
      expect(data.company).toEqual({ connect: { id: "company-1" } });
    });
  });

  describe("transition", () => {
    it("rejects an illegal jump", async () => {
      bills.findByIdScoped.mockResolvedValueOnce(makeBill({ status: "DRAFT" }));
      await expect(
        service.transition(auth, "bill-1", { to: "APPROVED" } as never),
      ).rejects.toBeInstanceOf(IllegalTransitionError);
    });

    it("requires scheduledFor when scheduling", async () => {
      bills.findByIdScoped.mockResolvedValueOnce(
        makeBill({ status: "APPROVED" }),
      );
      await expect(
        service.transition(auth, "bill-1", { to: "SCHEDULED" } as never),
      ).rejects.toBeInstanceOf(GuardFailedError);
    });

    it("rejects a scheduledFor in the past", async () => {
      bills.findByIdScoped.mockResolvedValueOnce(
        makeBill({ status: "APPROVED" }),
      );
      await expect(
        service.transition(auth, "bill-1", {
          to: "SCHEDULED",
          scheduledFor: new Date("2000-01-01"),
        } as never),
      ).rejects.toBeInstanceOf(GuardFailedError);
    });

    it("submits a bill with valid lines and writes an event", async () => {
      bills.findByIdScoped.mockResolvedValueOnce(makeBill({ status: "DRAFT" }));
      await service.transition(auth, "bill-1", { to: "SUBMITTED" } as never);
      expect(billCas).toHaveBeenCalledWith("bill-1", "DRAFT", "SUBMITTED");
      expect(eventCreate).toHaveBeenCalledTimes(1);
      // actor is the authenticated user, not request input.
      expect(eventCreate.mock.calls[0]![0].actor).toBe("u1");
      expect(paymentCreate).not.toHaveBeenCalled();
    });

    it("aborts (no event, no payment) when a concurrent transition won the race", async () => {
      bills.findByIdScoped.mockResolvedValueOnce(makeBill({ status: "DRAFT" }));
      // CAS changes 0 rows: another request already moved the bill out of DRAFT.
      billCas.mockResolvedValueOnce(0);
      await expect(
        service.transition(auth, "bill-1", { to: "SUBMITTED" } as never),
      ).rejects.toBeInstanceOf(IllegalTransitionError);
      expect(eventCreate).not.toHaveBeenCalled();
      expect(paymentCreate).not.toHaveBeenCalled();
    });

    it("materializes a pending payment when scheduling", async () => {
      bills.findByIdScoped.mockResolvedValueOnce(
        makeBill({ status: "APPROVED", totalCents: 1000 }),
      );
      await service.transition(auth, "bill-1", {
        to: "SCHEDULED",
        scheduledFor: new Date("2999-01-01"),
      } as never);
      expect(paymentCreate).toHaveBeenCalledTimes(1);
      const data = paymentCreate.mock.calls[0]![0];
      expect(data).toMatchObject({
        company: { connect: { id: "company-1" } },
        bill: { connect: { id: "bill-1" } },
        amountCents: 1000,
        method: "ACH",
        status: "PENDING",
      });
    });
  });

  describe("settlePayment", () => {
    it("drives the bill to PAID and stamps paidAt on success", async () => {
      payments.findByIdScoped.mockResolvedValueOnce({
        id: "pay-1",
        billId: "bill-1",
      });
      bills.findByIdScoped.mockResolvedValue(makeBill({ status: "SCHEDULED" }));
      await service.settlePayment(auth, "pay-1", { outcome: "SUCCEEDED" });
      expect(paymentCas).toHaveBeenCalledTimes(1);
      const [id, data] = paymentCas.mock.calls[0]!;
      expect(id).toBe("pay-1");
      expect(data.status).toBe("SUCCEEDED");
      expect(data.paidAt).toBeInstanceOf(Date);
      expect(billCas).toHaveBeenCalledWith("bill-1", "SCHEDULED", "PAID");
    });

    it("drives the bill to FAILED on failure", async () => {
      payments.findByIdScoped.mockResolvedValueOnce({
        id: "pay-1",
        billId: "bill-1",
      });
      bills.findByIdScoped.mockResolvedValue(makeBill({ status: "SCHEDULED" }));
      await service.settlePayment(auth, "pay-1", { outcome: "FAILED" });
      const data = paymentCas.mock.calls[0]![1];
      expect(data.status).toBe("FAILED");
      expect(data.paidAt).toBeNull();
      expect(billCas).toHaveBeenCalledWith("bill-1", "SCHEDULED", "FAILED");
    });

    it("rejects settling a payment that is no longer pending", async () => {
      payments.findByIdScoped.mockResolvedValueOnce({
        id: "pay-1",
        billId: "bill-1",
      });
      bills.findByIdScoped.mockResolvedValue(makeBill({ status: "SCHEDULED" }));
      // CAS changes 0 rows: the payment was already settled concurrently.
      paymentCas.mockResolvedValueOnce(0);
      await expect(
        service.settlePayment(auth, "pay-1", { outcome: "SUCCEEDED" }),
      ).rejects.toBeInstanceOf(GuardFailedError);
      expect(billCas).not.toHaveBeenCalled();
    });
  });
});

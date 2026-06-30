import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthContext } from "../auth/context.js";
import { NotFoundError } from "../domain/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import type { BillEventRepository } from "../repositories/BillEventRepository.js";
import type { BillRepository } from "../repositories/BillRepository.js";
import type { PaymentRepository } from "../repositories/PaymentRepository.js";
import type { VendorRepository } from "../repositories/VendorRepository.js";
import { BillService } from "./bill.service.js";

const BILL = { id: "bill-1", companyId: "company-A", status: "DRAFT", lineItems: [] };

function ctx(over: Partial<AuthContext>): AuthContext {
  return {
    userId: "u1",
    role: "ADMIN",
    companyId: "company-A",
    isSuperuser: false,
    requestedCompanyId: null,
    ...over,
  };
}

describe("BillService tenant scoping", () => {
  let findByIdScoped: ReturnType<typeof vi.fn>;
  let service: BillService;

  beforeEach(() => {
    // The fake mirrors the repo contract: null companyId (superuser) matches any
    // row; otherwise the row is returned only when its company matches.
    findByIdScoped = vi.fn(async (_id: string, companyId: string | null) => {
      if (companyId === null) return BILL;
      return companyId === BILL.companyId ? BILL : null;
    });
    const bills = { findByIdScoped } as unknown as BillRepository;
    service = new BillService(
      {} as unknown as PrismaClient,
      bills,
      {} as unknown as PaymentRepository,
      {} as unknown as BillEventRepository,
      {} as unknown as VendorRepository,
    );
  });

  it("returns the bill for a same-company user (scoped by their companyId)", async () => {
    const bill = await service.get(ctx({ companyId: "company-A" }), "bill-1");
    expect(bill).toBe(BILL);
    expect(findByIdScoped).toHaveBeenCalledWith("bill-1", "company-A");
  });

  it("404s (not 403) when a user reads another company's bill — no leak", async () => {
    await expect(
      service.get(ctx({ companyId: "company-B" }), "bill-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(findByIdScoped).toHaveBeenCalledWith("bill-1", "company-B");
  });

  it("lets a superuser read across companies (no company filter)", async () => {
    const bill = await service.get(
      ctx({ role: "SUPERUSER", companyId: null, isSuperuser: true }),
      "bill-1",
    );
    expect(bill).toBe(BILL);
    expect(findByIdScoped).toHaveBeenCalledWith("bill-1", null);
  });
});

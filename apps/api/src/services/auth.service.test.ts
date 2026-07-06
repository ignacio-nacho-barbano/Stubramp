import { describe, expect, it, vi } from "vitest";
import type { CompanyRepository } from "../repositories/CompanyRepository.js";
import type { UserRepository } from "../repositories/UserRepository.js";
import type { PrismaClient } from "../generated/prisma/client.js";
import { AuthService } from "./auth.service.js";

const company = {
  id: "company-1",
  name: "Acme",
  slug: "acme",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Build an AuthService with fake repos. acceptInvite never touches prisma
// ($transaction is signup-only), so a bare object stands in for it.
function makeService() {
  const findByIdOrThrow = vi.fn().mockResolvedValue(company);
  const create = vi.fn().mockImplementation(async (data: any) => ({
    id: "user-1",
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    role: data.role,
    isActive: true,
    companyId: data.company.connect.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const companies = { findByIdOrThrow } as unknown as CompanyRepository;
  const users = { create } as unknown as UserRepository;
  const service = new AuthService(
    {} as unknown as PrismaClient,
    companies,
    users,
  );
  return { service, findByIdOrThrow, create };
}

describe("AuthService.acceptInvite", () => {
  const input = {
    token: "ignored-here",
    firstName: "Jane",
    lastName: "Cooper",
    email: "jane@acme.com",
    password: "supersecret",
  };

  it("creates an ACCOUNTANT in the invited company and strips the hash", async () => {
    const { service, findByIdOrThrow, create } = makeService();

    const { user, company: returned } = await service.acceptInvite(
      "company-1",
      input,
    );

    expect(findByIdOrThrow).toHaveBeenCalledWith("company-1");
    expect(returned).toBe(company);
    // Placed into the invited company, as the fixed non-admin tier.
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@acme.com",
        name: "Jane Cooper",
        role: "ACCOUNTANT",
        company: { connect: { id: "company-1" } },
      }),
    );
    // The created hash is real (not the plaintext) and never leaks out.
    const created =
      create.mock.calls[0]?.[0] ||
      ({ passwordHash: "123" } as { passwordHash: string });
    expect(created.passwordHash).not.toBe(input.password);
    expect(user).not.toHaveProperty("passwordHash");
    expect(user.email).toBe("jane@acme.com");
  });

  it("propagates a missing company (repo throws NotFound)", async () => {
    const { service, findByIdOrThrow, create } = makeService();
    findByIdOrThrow.mockRejectedValueOnce(new Error("not found"));

    await expect(service.acceptInvite("gone", input)).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});

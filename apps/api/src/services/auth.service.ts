import { randomBytes } from "node:crypto";
import type {
  Company,
  PrismaClient,
  User,
} from "../generated/prisma/client.js";
import { hashPassword } from "../auth/password.js";
import { TX_OPTIONS, withDbRetry } from "../db-retry.js";
import { env } from "../env.js";
import type { CompanyRepository } from "../repositories/CompanyRepository.js";
import type { UserRepository } from "../repositories/UserRepository.js";
import type { AcceptInviteInput, SignupInput } from "../schemas/auth.schema.js";

type SafeUser = Omit<User, "passwordHash">;

// Role granted to teammates who join via an invite link: the highest tier below
// ADMIN. Change here only.
const INVITE_ROLE = "ACCOUNTANT" as const;

// Turn a free-text company name into a URL-safe slug. Empty/odd input falls back
// to a stable default so we always have something to make unique.
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "company";
}

/**
 * Owns public self-serve signup: creating a fresh tenant (Company) together with
 * its first ADMIN user in a single transaction so a half-created workspace is
 * never persisted. Token issuance stays in the route (the TokenService is a
 * Fastify decorator); this service only owns the persistence + invariants.
 */
export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly companies: CompanyRepository,
    private readonly users: UserRepository,
  ) {}

  async signup(
    input: SignupInput,
  ): Promise<{ user: SafeUser; company: Company }> {
    const passwordHash = await hashPassword(
      input.password,
      env.PASSWORD_PEPPER,
    );
    const name = `${input.firstName} ${input.lastName}`.trim();

    // The whole thing is atomic: a duplicate email (mapped to a 409 by the repo)
    // rolls the just-created company back. Retried as a whole on transient DB
    // faults — a failed attempt rolls back cleanly, and a duplicate email on a
    // re-run surfaces as the same 409 it would have anyway.
    return withDbRetry(
      () =>
        this.prisma.$transaction(async (tx) => {
          const companies = this.companies.withTx(tx);
          const users = this.users.withTx(tx);

          const slug = await this.uniqueSlug(
            companies,
            slugify(input.companyName),
          );
          const company = await companies.create({
            name: input.companyName,
            slug,
          });

          const created = await users.create({
            email: input.email,
            name,
            passwordHash,
            role: "ADMIN",
            company: { connect: { id: company.id } },
          });

          const { passwordHash: _omit, ...user } = created;
          return { user, company };
        }, TX_OPTIONS),
      { label: "auth.signup" },
    );
  }

  /**
   * Accepts an invite: creates a new user inside an existing company (identified
   * by the caller-verified `companyId` from the signed invite token). Unlike
   * signup this never creates a company — it attaches to one that already exists,
   * granting the fixed INVITE_ROLE. A missing company surfaces as a 404 and a
   * duplicate email as a 409 (both mapped by the repos).
   */
  async acceptInvite(
    companyId: string,
    input: AcceptInviteInput,
  ): Promise<{ user: SafeUser; company: Company }> {
    const passwordHash = await hashPassword(
      input.password,
      env.PASSWORD_PEPPER,
    );
    const name = `${input.firstName} ${input.lastName}`.trim();

    const company = await this.companies.findByIdOrThrow(companyId);
    const created = await this.users.create({
      email: input.email,
      name,
      passwordHash,
      role: INVITE_ROLE,
      company: { connect: { id: company.id } },
    });

    const { passwordHash: _omit, ...user } = created;
    return { user, company };
  }

  // Find a free slug, suffixing a short random token on collision. A handful of
  // attempts is plenty; the unique index is the real guarantee.
  private async uniqueSlug(
    companies: CompanyRepository,
    base: string,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate =
        attempt === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
      if (!(await companies.findBySlug(candidate))) return candidate;
    }
    return `${base}-${randomBytes(4).toString("hex")}`;
  }
}

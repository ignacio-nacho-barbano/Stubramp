import { randomBytes } from "node:crypto";
import type {
  Company,
  PrismaClient,
  User,
} from "../generated/prisma/client.js";
import { hashPassword } from "../auth/password.js";
import { env } from "../env.js";
import type { CompanyRepository } from "../repositories/CompanyRepository.js";
import type { UserRepository } from "../repositories/UserRepository.js";
import type { SignupInput } from "../schemas/auth.schema.js";

type SafeUser = Omit<User, "passwordHash">;

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
    const passwordHash = await hashPassword(input.password, env.PASSWORD_PEPPER);
    const name = `${input.firstName} ${input.lastName}`.trim();

    // The whole thing is atomic: a duplicate email (mapped to a 409 by the repo)
    // rolls the just-created company back.
    return this.prisma.$transaction(async (tx) => {
      const companies = this.companies.withTx(tx);
      const users = this.users.withTx(tx);

      const slug = await this.uniqueSlug(companies, slugify(input.companyName));
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
    });
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

import type { Role, User } from "../generated/prisma/client.js";
import type { AuthContext } from "../auth/context.js";
import { hashPassword } from "../auth/password.js";
import { resolveCompanyId } from "../auth/scope.js";
import { env } from "../env.js";
import { ForbiddenError, GuardFailedError } from "../domain/errors.js";
import type { UserRepository } from "../repositories/UserRepository.js";
import type { CreateUserInput } from "../schemas/user.schema.js";

type SafeUser = Omit<User, "passwordHash">;

function stripPassword(user: User): SafeUser {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

// Owns user creation with role + the SUPERUSER⇔company invariant. ADMINs are
// confined to their own company and cannot mint superusers; SUPERUSERs may place
// a user in any company (or create another superuser with no company).
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async create(auth: AuthContext, input: CreateUserInput): Promise<SafeUser> {
    const { companyId, role } = this.resolvePlacement(auth, input);
    const passwordHash = await hashPassword(input.password, env.PASSWORD_PEPPER);

    const user = await this.users.create({
      email: input.email,
      name: input.name,
      passwordHash,
      role,
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
    });
    return stripPassword(user);
  }

  async list(auth: AuthContext, opts: { page?: number; pageSize?: number }) {
    const companyId = resolveCompanyId(auth);
    const page = await this.users.getAll({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: "desc" },
      page: opts.page,
      pageSize: opts.pageSize,
    });
    return { ...page, data: page.data.map(stripPassword) };
  }

  // Decide the new user's company + role from the actor's authority, enforcing
  // SUPERUSER ⇔ companyId == null.
  private resolvePlacement(
    auth: AuthContext,
    input: CreateUserInput,
  ): { companyId: string | null; role: Role } {
    if (auth.isSuperuser) {
      if (input.role === "SUPERUSER") {
        if (input.companyId) {
          throw new GuardFailedError("A SUPERUSER must not belong to a company");
        }
        return { companyId: null, role: "SUPERUSER" };
      }
      if (!input.companyId) {
        throw new GuardFailedError("A non-superuser must belong to a company");
      }
      return { companyId: input.companyId, role: input.role };
    }

    // ADMIN (the only non-superuser with user:manage): own company only, and may
    // not create a superuser.
    if (input.role === "SUPERUSER") {
      throw new ForbiddenError("Only a superuser can create a superuser");
    }
    if (!auth.companyId) {
      throw new GuardFailedError("User is not attached to a company");
    }
    return { companyId: auth.companyId, role: input.role };
  }
}

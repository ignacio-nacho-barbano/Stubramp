import type { Prisma, User } from "../generated/prisma/client.js";
import {
  BaseRepository,
  type ModelDelegate,
  type ModelTypes,
} from "./BaseRepository.js";

interface UserTypes extends ModelTypes {
  Model: User;
  WhereUnique: Prisma.UserWhereUniqueInput;
  Where: Prisma.UserWhereInput;
  Create: Prisma.UserCreateInput;
  Update: Prisma.UserUpdateInput;
  OrderBy:
    | Prisma.UserOrderByWithRelationInput
    | Prisma.UserOrderByWithRelationInput[];
}

export class UserRepository extends BaseRepository<UserTypes> {
  // `Prisma.TransactionClient["user"]` describes both the normal-client and the
  // in-transaction delegate, which is what makes `withTx` work without overloads.
  constructor(private readonly users: Prisma.TransactionClient["user"]) {
    super(users as unknown as ModelDelegate, "User");
  }

  // Custom method: calls the precise delegate so select/include narrowing is kept.
  findByEmail(email: string) {
    return this.users.findUnique({ where: { email } });
  }

  /** Returns a repository bound to the given interactive transaction client. */
  withTx(tx: Prisma.TransactionClient): UserRepository {
    return new UserRepository(tx.user);
  }
}

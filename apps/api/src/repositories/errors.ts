// Domain-level repository errors. Routes catch these (or let the global error
// handler map them) without ever importing Prisma's error classes.
import { Prisma } from "../generated/prisma/client.js"; // VALUE import: PrismaClientKnownRequestError is used with `instanceof`.

export class RepositoryError extends Error {}

export class NotFoundError extends RepositoryError {
  readonly code = "NOT_FOUND" as const;

  constructor(
    public readonly model: string,
    public readonly criteria: Record<string, unknown>,
  ) {
    super(`${model} not found`);
    this.name = "NotFoundError";
  }
}

export class UniqueConstraintError extends RepositoryError {
  readonly code = "UNIQUE_VIOLATION" as const;

  constructor(
    public readonly model: string,
    public readonly fields: string[],
  ) {
    super(`${model} already exists`);
    this.name = "UniqueConstraintError";
  }
}

/**
 * Translate known Prisma error codes into domain errors. Anything unrecognized
 * is rethrown untouched so it surfaces as a 500.
 */
export function mapPrismaError(
  err: unknown,
  model: string,
  criteria: Record<string, unknown>,
): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      throw new NotFoundError(model, criteria);
    }
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      throw new UniqueConstraintError(model, target);
    }
  }
  throw err;
}

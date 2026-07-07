// Domain errors carry the HTTP status the API should return. The global error
// handler in index.ts maps these (alongside the repository errors) to responses.
// Kept separate from repositories/errors.ts: services throw these, repositories
// throw RepositoryError; both are mapped centrally.

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 422,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`, 404);
  }
}

export class IllegalTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Illegal transition: ${from} -> ${to}`, 409);
  }
}

export class GuardFailedError extends DomainError {
  constructor(message: string) {
    super(message, 422);
  }
}

// A bill with this invoice number already exists for the same vendor. Invoice
// numbers are only unique per vendor (different vendors legitimately reuse
// numbers), so this is keyed on vendor, not the whole company. 409 because it's
// a conflict with existing state — and, for an AP tool, a double-payment guard.
export class DuplicateBillError extends DomainError {
  constructor(billNumber: string) {
    super(
      `A bill with invoice number "${billNumber}" already exists for this vendor`,
      409,
    );
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

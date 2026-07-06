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

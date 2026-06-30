// Domain errors carry the HTTP status the API should return.
// The Fastify error handler in app.ts maps these to responses.

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

/**
 * An error that is safe to show to the API client.
 *
 * Services throw `AppError` for expected failures (not found, forbidden, invalid
 * state...). The central error handler turns it into a consistent JSON response.
 * Any other thrown error is treated as an unexpected bug and returned as a generic
 * 500 so internal details (stack traces, queries) are never leaked.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/** Stable, machine-readable error codes the frontend can rely on. */
export const ErrorCode = {
  BadRequest: 'BAD_REQUEST',
  InvalidJson: 'INVALID_JSON',
  PayloadTooLarge: 'PAYLOAD_TOO_LARGE',
  ValidationError: 'VALIDATION_ERROR',
  Unauthenticated: 'UNAUTHENTICATED',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  Forbidden: 'FORBIDDEN',
  ForbiddenOrigin: 'FORBIDDEN_ORIGIN',
  Conflict: 'CONFLICT',
  InviteInvalid: 'INVITE_INVALID',
  NotFound: 'NOT_FOUND',
  RateLimited: 'RATE_LIMITED',
  ServiceUnavailable: 'SERVICE_UNAVAILABLE',
  InternalError: 'INTERNAL_ERROR',
} as const;

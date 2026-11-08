import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCode } from '../lib/errors.js';
import type { ApiFailure } from '../lib/http-response.js';

interface HttpErrorLike {
  status: number;
  type?: string;
  expose?: boolean;
  message: string;
}

/** Errors created by Express's body parser carry an HTTP `status` and a `type`. */
function isClientHttpError(err: unknown): err is HttpErrorLike {
  if (typeof err !== 'object' || err === null || !('status' in err)) return false;
  const { status } = err as { status: unknown };
  return typeof status === 'number' && status >= 400 && status < 500;
}

function toFailure(err: unknown): {
  statusCode: number;
  error: Omit<ApiFailure['error'], 'requestId'>;
} {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      error: { code: err.code, message: err.message, details: err.details },
    };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      error: {
        code: ErrorCode.ValidationError,
        message: 'The request contains invalid data',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  }

  if (isClientHttpError(err)) {
    if (err.type === 'entity.parse.failed') {
      return {
        statusCode: 400,
        error: { code: ErrorCode.InvalidJson, message: 'Request body is not valid JSON' },
      };
    }
    if (err.type === 'entity.too.large') {
      return {
        statusCode: 413,
        error: { code: ErrorCode.PayloadTooLarge, message: 'Request body is too large' },
      };
    }
    return {
      statusCode: err.status,
      error: {
        code: ErrorCode.BadRequest,
        message: err.expose ? err.message : 'The request could not be processed',
      },
    };
  }

  return {
    statusCode: 500,
    error: { code: ErrorCode.InternalError, message: 'An unexpected error occurred' },
  };
}

/**
 * The single place where errors become HTTP responses.
 * Express 5 forwards both thrown errors and rejected promises from async
 * route handlers here automatically, so controllers don't need try/catch.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { statusCode, error } = toFailure(err);

  if (statusCode >= 500) {
    req.log.error({ err }, 'Unhandled error while processing request');
  }

  const body: ApiFailure = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      requestId: String(req.id),
      ...(error.details !== undefined && { details: error.details }),
    },
  };
  res.status(statusCode).json(body);
};

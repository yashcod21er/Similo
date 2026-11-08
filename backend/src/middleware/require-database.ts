import type { RequestHandler } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';

/**
 * Fails fast with a clear 503 when MongoDB is not connected, instead of letting
 * Mongoose queue the query and time out after several seconds.
 */
export function requireDatabase(isDatabaseReady: () => boolean): RequestHandler {
  return (_req, _res, next) => {
    if (!isDatabaseReady()) {
      throw new AppError(
        503,
        ErrorCode.ServiceUnavailable,
        'This feature needs the database, which is not connected right now. Please try again later.',
      );
    }
    next();
  };
}

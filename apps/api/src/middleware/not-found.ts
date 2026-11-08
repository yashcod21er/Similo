import type { RequestHandler } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';

/** Runs only when no route matched. Hands a 404 to the central error handler. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, ErrorCode.NotFound, `Route ${req.method} ${req.path} was not found`));
};

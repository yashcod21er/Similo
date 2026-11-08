import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { sendSuccess } from '../../lib/http-response.js';
import { createDemoRequestSchema } from './demo-request.schemas.js';
import type { DemoRequestService } from './demo-request.service.js';

export interface DemoRequestRouterOptions {
  /** Max submissions per client per window (public endpoint → keep it low). */
  rateLimit?: { windowMs: number; limit: number };
}

/**
 * POST /api/v1/demo-requests — public "Request a demo" form.
 * Validation errors become 400 VALIDATION_ERROR via the central error handler.
 */
export function createDemoRequestRouter(
  service: DemoRequestService,
  { rateLimit: limits = { windowMs: 15 * 60 * 1000, limit: 5 } }: DemoRequestRouterOptions = {},
): Router {
  const router = Router();

  const limiter = rateLimit({
    windowMs: limits.windowMs,
    limit: limits.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new AppError(
          429,
          ErrorCode.RateLimited,
          'Too many requests. Please wait a few minutes and try again.',
        ),
      );
    },
  });

  const create: RequestHandler = async (req, res) => {
    const input = createDemoRequestSchema.parse(req.body);
    await service.submit(input);
    sendSuccess(res, { received: true }, 201);
  };

  router.post('/', limiter, create);
  return router;
}

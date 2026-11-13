import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { sendSuccess } from '../../lib/http-response.js';
import { getAuth, requirePermission } from '../../middleware/auth.js';
import { findingIdSchema, findingListSchema, updateFindingSchema } from './finding.schemas.js';
import type { FindingService } from './finding.service.js';

export interface FindingRouterOptions {
  /** Analysis requests per client per hour (default 10). */
  analyseLimit?: { windowMs: number; limit: number };
}

/**
 * /api/v1/findings — possible copycat domains found by monitoring.
 * Mounted behind `requireAuth`; every route also checks a permission from roles.ts.
 */
export function createFindingRouter(
  service: FindingService,
  options: FindingRouterOptions = {},
): Router {
  const router = Router();
  const read = requirePermission('findings:read');
  const update = requirePermission('findings:update');
  // Asking for a new AI analysis is limited to the roles that can review findings
  // (Owner, Admin, Investigation Analyst): the same `findings:update` permission.
  const analyse = requirePermission('findings:update');
  const analyseLimiter = rateLimit({
    windowMs: options.analyseLimit?.windowMs ?? 60 * 60 * 1000,
    limit: options.analyseLimit?.limit ?? 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(
        new AppError(429, ErrorCode.RateLimited, 'Too many analysis requests. Try again later.'),
      ),
  });

  router.get('/', read, async (req, res) => {
    const options = findingListSchema.parse(req.query);
    sendSuccess(res, await service.list(getAuth(res), options));
  });

  router.get('/:findingId', read, async (req, res) => {
    const findingId = findingIdSchema.parse(req.params.findingId);
    sendSuccess(res, await service.get(getAuth(res), findingId));
  });

  router.patch('/:findingId', update, async (req, res) => {
    const findingId = findingIdSchema.parse(req.params.findingId);
    const input = updateFindingSchema.parse(req.body);
    sendSuccess(res, await service.updateStatus(getAuth(res), findingId, input.status));
  });

  router.post('/:findingId/analyse', analyseLimiter, analyse, async (req, res) => {
    const findingId = findingIdSchema.parse(req.params.findingId);
    sendSuccess(res, await service.requestAnalysis(getAuth(res), findingId), 202);
  });

  router.get('/:findingId/screenshot', read, async (req, res) => {
    const findingId = findingIdSchema.parse(req.params.findingId);
    const screenshot = await service.getScreenshot(getAuth(res), findingId);
    res.set({
      'Content-Type': screenshot.contentType,
      'Content-Length': String(screenshot.data.length),
      'X-Content-Type-Options': 'nosniff',
      // Even opened directly, the image can't run or load anything.
      'Content-Security-Policy': "default-src 'none'",
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
    });
    res.status(200).end(screenshot.data);
  });

  return router;
}

import { Router } from 'express';
import { sendSuccess } from '../../lib/http-response.js';
import { getAuth, requirePermission } from '../../middleware/auth.js';
import { findingIdSchema, findingListSchema, updateFindingSchema } from './finding.schemas.js';
import type { FindingService } from './finding.service.js';

export function createFindingRouter(service: FindingService): Router {
  const router = Router();
  const read = requirePermission('findings:read');
  const update = requirePermission('findings:update');

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

  return router;
}

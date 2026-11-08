import { Router } from 'express';
import { z } from 'zod';
import { getAuth, requirePermission } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/http-response.js';
import type { AuditService } from './audit.service.js';

const listQuerySchema = z.object({
  before: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/** GET /api/v1/audit-events — the organisation's audit log, newest first. Read-only. */
export function createAuditRouter(service: AuditService): Router {
  const router = Router();

  router.get('/', requirePermission('audit:read'), async (req, res) => {
    const { before, limit } = listQuerySchema.parse(req.query);
    const options = before === undefined ? { limit } : { before, limit };
    sendSuccess(res, await service.list(getAuth(res).organizationId, options));
  });

  return router;
}

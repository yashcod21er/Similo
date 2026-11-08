import { Router } from 'express';
import { createHealthController } from './health.controller.js';
import type { HealthService } from './health.service.js';

/**
 * GET /api/v1/health               Liveness: "is the API process running?"
 * GET /api/v1/health/dependencies  Status of MongoDB and the AI service (used by the status page).
 *
 * Note: the dependency report will be restricted to admins once
 * authentication exists (Phase 2); liveness stays public for uptime monitors.
 */
export function createHealthRouter(service: HealthService): Router {
  const controller = createHealthController(service);
  const router = Router();

  router.get('/', controller.liveness);
  router.get('/dependencies', controller.systemStatus);

  return router;
}

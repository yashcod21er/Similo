import type { RequestHandler } from 'express';
import { sendSuccess } from '../../lib/http-response.js';
import type { HealthService } from './health.service.js';

/** Controllers stay thin: read the request, call the service, send the response. */
export function createHealthController(service: HealthService) {
  const liveness: RequestHandler = (_req, res) => {
    res.set('Cache-Control', 'no-store');
    sendSuccess(res, service.getLiveness());
  };

  const systemStatus: RequestHandler = async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    sendSuccess(res, await service.getSystemStatus());
  };

  return { liveness, systemStatus };
}

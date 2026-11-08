import { Router } from 'express';
import {
  createDemoRequestRouter,
  type DemoRequestRouterOptions,
} from './modules/demo-requests/demo-request.routes.js';
import type { DemoRequestService } from './modules/demo-requests/demo-request.service.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import type { HealthService } from './modules/health/health.service.js';

export interface ApiRouterDependencies {
  healthService: HealthService;
  demoRequestService: DemoRequestService;
  demoRequestOptions?: DemoRequestRouterOptions;
}

/**
 * Mounts every feature module under /api/v1. New modules (auth, brands,
 * findings...) are added here as they are built, one line each.
 */
export function createApiRouter({
  healthService,
  demoRequestService,
  demoRequestOptions,
}: ApiRouterDependencies): Router {
  const router = Router();
  router.use('/health', createHealthRouter(healthService));
  router.use('/demo-requests', createDemoRequestRouter(demoRequestService, demoRequestOptions));
  return router;
}

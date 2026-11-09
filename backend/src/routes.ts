import { Router, type RequestHandler } from 'express';
import { requireDatabase } from './middleware/require-database.js';
import { createAuditRouter } from './modules/audit/audit.routes.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import type { AuthSystem } from './modules/auth/auth.system.js';
import { createBrandRouter } from './modules/brands/brand.routes.js';
import type { BrandService } from './modules/brands/brand.service.js';
import { createFindingRouter } from './modules/findings/finding.routes.js';
import type { FindingService } from './modules/findings/finding.service.js';
import type { MonitoringQueue } from './modules/monitoring/monitoring.queue.js';
import {
  createDemoRequestRouter,
  type DemoRequestRouterOptions,
} from './modules/demo-requests/demo-request.routes.js';
import type { DemoRequestService } from './modules/demo-requests/demo-request.service.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import type { HealthService } from './modules/health/health.service.js';
import { createOrganizationRouter } from './modules/organizations/organization.routes.js';

export interface ApiRouterDependencies {
  healthService: HealthService;
  demoRequestService: DemoRequestService;
  demoRequestOptions?: DemoRequestRouterOptions;
  auth: AuthSystem;
  brandService: BrandService;
  findingService?: FindingService;
  monitoringQueue?: MonitoringQueue | null;
  /** True when MongoDB is connected; identity routes answer 503 otherwise. */
  isDatabaseReady: () => boolean;
}

/** Signed-in responses contain private data: never cache them. */
const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
};

/**
 * Mounts every feature module under /api/v1. New modules (brands, findings...)
 * are added here as they are built, one line each.
 */
export function createApiRouter({
  healthService,
  demoRequestService,
  demoRequestOptions,
  auth,
  brandService,
  findingService,
  monitoringQueue,
  isDatabaseReady,
}: ApiRouterDependencies): Router {
  const router = Router();
  const needsDatabase = requireDatabase(isDatabaseReady);

  router.use('/health', createHealthRouter(healthService));
  router.use('/demo-requests', createDemoRequestRouter(demoRequestService, demoRequestOptions));

  router.use(
    '/auth',
    needsDatabase,
    createAuthRouter({
      authService: auth.authService,
      requireAuth: auth.requireAuth,
      accessTokens: auth.accessTokens,
      cookies: auth.cookies,
      rateLimits: auth.rateLimits,
    }),
  );
  router.use(
    '/organization',
    needsDatabase,
    auth.requireAuth,
    noStore,
    createOrganizationRouter(auth.organizationService),
  );
  router.use(
    '/audit-events',
    needsDatabase,
    auth.requireAuth,
    noStore,
    createAuditRouter(auth.auditService),
  );
  router.use(
    '/brands',
    needsDatabase,
    auth.requireAuth,
    noStore,
    createBrandRouter(brandService, monitoringQueue ?? null),
  );
  if (findingService) {
    router.use(
      '/findings',
      needsDatabase,
      auth.requireAuth,
      noStore,
      createFindingRouter(findingService),
    );
  }

  return router;
}

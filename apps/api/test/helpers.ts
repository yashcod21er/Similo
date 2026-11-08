import { pino } from 'pino';
import { createApp, type AppDependencies } from '../src/app.js';
import type { AuthRateLimits } from '../src/modules/auth/auth.routes.js';
import { createAuthSystem } from '../src/modules/auth/auth.system.js';
import type {
  DemoRequestRepository,
  NewDemoRequest,
} from '../src/modules/demo-requests/demo-request.repository.js';
import { createDemoRequestService } from '../src/modules/demo-requests/demo-request.service.js';
import type { DependencyCheck, DependencyCheckResult } from '../src/modules/health/health.types.js';
import { createHealthService } from '../src/modules/health/health.service.js';
import { createClock, createFakeAuthRepositories, fakeTransaction } from './fakes/auth-fakes.js';

export const silentLogger = pino({ level: 'silent' });

export function fakeCheck(
  name: string,
  critical: boolean,
  result: DependencyCheckResult | Error,
): DependencyCheck {
  return {
    name,
    critical,
    run: async () => {
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

export const healthyChecks: DependencyCheck[] = [
  fakeCheck('database', true, { status: 'up', message: 'Connected', latencyMs: 4 }),
  fakeCheck('aiService', false, { status: 'up', message: 'Reachable', latencyMs: 7 }),
];

/** In-memory repository that records what would have been stored. */
export function createFakeDemoRequestRepository() {
  const saved: NewDemoRequest[] = [];
  const repository: DemoRequestRepository = {
    async create(data) {
      saved.push(data);
      return { id: `fake-${saved.length}` };
    },
  };
  return { repository, saved };
}

/** Rate limits high enough that ordinary tests never hit them. */
export const RELAXED_RATE_LIMITS: AuthRateLimits = {
  signIn: { windowMs: 60_000, limit: 1_000 },
  signUp: { windowMs: 60_000, limit: 1_000 },
  invites: { windowMs: 60_000, limit: 1_000 },
};

/** A complete auth system on in-memory storage with a controllable clock. */
export function createTestAuth({
  rateLimits = RELAXED_RATE_LIMITS,
}: { rateLimits?: AuthRateLimits } = {}) {
  const clock = createClock();
  const { repositories, stores } = createFakeAuthRepositories(clock.now);
  const auth = createAuthSystem({
    repositories,
    runInTransaction: fakeTransaction,
    logger: silentLogger,
    appUrl: 'http://localhost:5173',
    cookieSecure: false,
    now: clock.now,
    rateLimits,
  });
  return { auth, stores, clock };
}

/** The app plus direct access to its fake storage and clock, for auth tests. */
export function buildAuthTestApp(
  options: { rateLimits?: AuthRateLimits; databaseReady?: boolean } = {},
) {
  const { auth, stores, clock } = createTestAuth(options);
  const app = buildTestApp(healthyChecks, {
    auth,
    isDatabaseReady: () => options.databaseReady ?? true,
  });
  return { app, auth, stores, clock };
}

export function buildTestApp(
  checks: DependencyCheck[] = healthyChecks,
  overrides: Partial<AppDependencies> = {},
) {
  const { repository } = createFakeDemoRequestRepository();
  return createApp({
    env: { CORS_ORIGINS: ['http://localhost:5173'], TRUST_PROXY: 0 },
    logger: silentLogger,
    healthService: createHealthService(checks),
    demoRequestService: createDemoRequestService({
      repository,
      isDatabaseReady: () => true,
      logger: silentLogger,
    }),
    auth: createTestAuth().auth,
    isDatabaseReady: () => true,
    ...overrides,
  });
}

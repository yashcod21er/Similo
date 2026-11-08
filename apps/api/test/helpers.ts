import { pino } from 'pino';
import { createApp, type AppDependencies } from '../src/app.js';
import type {
  DemoRequestRepository,
  NewDemoRequest,
} from '../src/modules/demo-requests/demo-request.repository.js';
import { createDemoRequestService } from '../src/modules/demo-requests/demo-request.service.js';
import type { DependencyCheck, DependencyCheckResult } from '../src/modules/health/health.types.js';
import { createHealthService } from '../src/modules/health/health.service.js';

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
    ...overrides,
  });
}

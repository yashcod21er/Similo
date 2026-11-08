import type {
  DependencyCheck,
  DependencyReport,
  LivenessReport,
  OverallStatus,
  SystemStatusReport,
} from './health.types.js';

export interface HealthService {
  getLiveness(): LivenessReport;
  getSystemStatus(): Promise<SystemStatusReport>;
}

export const SERVICE_NAME = 'similo-api';

async function runCheck(check: DependencyCheck): Promise<DependencyReport> {
  try {
    const result = await check.run();
    return { name: check.name, critical: check.critical, ...result };
  } catch {
    // A buggy check must not break the whole status endpoint.
    return { name: check.name, critical: check.critical, status: 'down', message: 'Check failed' };
  }
}

export function summarise(dependencies: DependencyReport[]): OverallStatus {
  if (dependencies.some((dep) => dep.critical && dep.status === 'down')) return 'down';
  if (dependencies.some((dep) => dep.status !== 'up')) return 'degraded';
  return 'ok';
}

/** Business logic for health reporting. Knows nothing about HTTP. */
export function createHealthService(
  checks: DependencyCheck[],
  now: () => Date = () => new Date(),
): HealthService {
  return {
    getLiveness() {
      return {
        status: 'ok',
        service: SERVICE_NAME,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: now().toISOString(),
      };
    },

    async getSystemStatus() {
      // Run all checks in parallel so the slowest check sets the response time,
      // not the sum of all of them.
      const dependencies = await Promise.all(checks.map(runCheck));
      return {
        status: summarise(dependencies),
        checkedAt: now().toISOString(),
        dependencies,
      };
    },
  };
}

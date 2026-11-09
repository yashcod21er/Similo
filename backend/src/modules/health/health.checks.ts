import type { AiServiceClient } from '../../clients/ai-service.client.js';
import type { Logger } from '../../lib/logger.js';
import { withTimeout } from '../../lib/timeout.js';
import type { DependencyCheck } from './health.types.js';

async function timed(operation: () => Promise<unknown>): Promise<number> {
  const startedAt = performance.now();
  await operation();
  return Math.round(performance.now() - startedAt);
}

interface DatabaseCheckOptions {
  configured: boolean;
  ping: () => Promise<void>;
  timeoutMs: number;
  logger: Logger;
}

export function createDatabaseCheck({
  configured,
  ping,
  timeoutMs,
  logger,
}: DatabaseCheckOptions): DependencyCheck {
  return {
    name: 'database',
    critical: true,
    async run() {
      if (!configured) {
        return { status: 'not_configured', message: 'MONGODB_URI is not set' };
      }
      try {
        const latencyMs = await timed(() => withTimeout(ping(), timeoutMs, 'MongoDB ping'));
        return { status: 'up', message: 'Connected', latencyMs };
      } catch (err) {
        // Full error detail goes to the server log only, never to the client.
        logger.warn({ err }, 'Database health check failed');
        return { status: 'down', message: 'Unreachable' };
      }
    },
  };
}

interface AiServiceCheckOptions {
  client: AiServiceClient;
  logger: Logger;
}

export function createAiServiceCheck({ client, logger }: AiServiceCheckOptions): DependencyCheck {
  return {
    name: 'aiService',
    // The API can still serve brands, findings and investigations while AI is down;
    // only new analysis is delayed. So the AI service is important but not critical.
    critical: false,
    async run() {
      try {
        const latencyMs = await timed(() => client.getHealth());
        return { status: 'up', message: 'Reachable', latencyMs };
      } catch (err) {
        logger.warn({ err }, 'AI service health check failed');
        return { status: 'down', message: 'Unreachable' };
      }
    },
  };
}

export function createMonitoringQueueCheck({
  configured,
  ping,
  logger,
}: {
  configured: boolean;
  ping: () => Promise<void>;
  logger: Logger;
}): DependencyCheck {
  return {
    name: 'monitoringQueue',
    critical: false,
    async run() {
      if (!configured) return { status: 'not_configured', message: 'REDIS_URL is not set' };
      try {
        const latencyMs = await timed(ping);
        return { status: 'up', message: 'Connected', latencyMs };
      } catch (err) {
        logger.warn({ err }, 'Monitoring queue health check failed');
        return { status: 'down', message: 'Unreachable' };
      }
    },
  };
}

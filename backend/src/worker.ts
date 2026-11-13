import { createDiscoverySource } from './modules/monitoring/discovery-source.js';
import { IanaRdapClient } from './modules/monitoring/rdap.client.js';
import { createMonitoringService } from './modules/monitoring/monitoring.service.js';
import {
  startMonitoringWorker,
  type MonitoringWorker,
} from './modules/monitoring/monitoring.worker.js';
import { EnvValidationError, loadDotEnvFile, parseEnv } from './config/env.js';
import { ensureIndexes } from './db/indexes.js';
import { connectToDatabase, disconnectFromDatabase } from './db/mongo.js';
import { createLogger } from './lib/logger.js';
import {
  mongoBrandLogoRepository,
  mongoBrandRepository,
} from './modules/brands/brand.repository.js';
import { mongoOrganizationRepository } from './modules/organizations/organization.repository.js';
import { mongoFindingRepository } from './modules/findings/finding.repository.js';
import { createAiServiceClient } from './clients/ai-service.client.js';
import { createAnalysisService } from './modules/analysis/analysis.service.js';
import { mongoFindingCaptureRepository } from './modules/capture/finding-capture.repository.js';
import { createPlaywrightCapturer } from './modules/capture/playwright-capturer.js';

async function main(): Promise<void> {
  loadDotEnvFile();
  const env = parseEnv(process.env);
  const logger = createLogger(env);

  if (!env.REDIS_URL) {
    logger.warn('REDIS_URL is not set; the domain-monitoring worker will not start');
    return;
  }
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not set; the domain-monitoring worker will not start');
    return;
  }

  await connectToDatabase({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME, logger });
  await ensureIndexes();
  const monitoring = createMonitoringService({
    brands: mongoBrandRepository,
    findings: mongoFindingRepository,
    discovery: createDiscoverySource(env.DOMAIN_DISCOVERY_SOURCE),
    rdap: new IanaRdapClient(),
    logger,
    maxAnalysesPerScan: env.ANALYSIS_MAX_PER_SCAN,
  });
  // Phase 6: safe page capture + AI analysis of findings.
  const analysis = createAnalysisService({
    findings: mongoFindingRepository,
    brands: mongoBrandRepository,
    logos: mongoBrandLogoRepository,
    captures: mongoFindingCaptureRepository,
    capturer: env.CAPTURE_ENABLED
      ? createPlaywrightCapturer({ browserChannel: env.CAPTURE_BROWSER_CHANNEL, logger })
      : null,
    ai: createAiServiceClient({
      baseUrl: env.AI_SERVICE_URL,
      timeoutMs: env.AI_SERVICE_TIMEOUT_MS,
      token: env.AI_SERVICE_TOKEN,
      analysisTimeoutMs: env.AI_ANALYSIS_TIMEOUT_MS,
    }),
    logger,
  });
  if (!env.AI_SERVICE_TOKEN) {
    logger.warn('AI_SERVICE_TOKEN is not set; finding analyses will be marked unavailable');
  }
  let worker: MonitoringWorker | undefined = await startMonitoringWorker({
    redisUrl: env.REDIS_URL,
    intervalHours: env.DOMAIN_SCAN_INTERVAL_HOURS,
    concurrency: env.MONITORING_WORKER_CONCURRENCY,
    brands: mongoBrandRepository,
    organizations: {
      listIdsForScheduledWork: () =>
        mongoOrganizationRepository.listIdsForScheduledWork?.() ?? Promise.resolve([]),
    },
    monitoring,
    analysis,
    logger,
  });
  let stopping = false;

  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info({ signal }, 'Stopping domain-monitoring worker');
    try {
      await worker?.close();
      worker = undefined;
      await disconnectFromDatabase();
      logger.info('Domain-monitoring worker stopped');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Domain-monitoring worker shutdown failed');
      process.exit(1);
    }
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  if (err instanceof EnvValidationError) console.error(err.message);
  else console.error('Fatal error in the domain-monitoring worker:', err);
  process.exit(1);
});

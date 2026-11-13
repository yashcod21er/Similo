import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import type { Logger } from '../../lib/logger.js';
import type { AnalyseFindingJob, AnalysisService } from '../analysis/analysis.service.js';
import type { BrandRepository } from '../brands/brand.repository.js';
import {
  ANALYSE_FINDING_JOB,
  ANALYSIS_JOB_OPTIONS,
  analysisJobId,
  MONITORING_QUEUE_NAME,
  MONITORING_QUEUE_PREFIX,
} from './monitoring.queue.js';
import type { MonitoringService, ScanBrandJob } from './monitoring.service.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export interface MonitoringWorker {
  close(): Promise<void>;
}

export async function startMonitoringWorker({
  redisUrl,
  intervalHours,
  brands,
  organizations,
  monitoring,
  analysis,
  concurrency = 1,
  logger,
}: {
  redisUrl: string;
  intervalHours: number;
  brands: BrandRepository;
  organizations: { listIdsForScheduledWork(): Promise<string[]> };
  monitoring: MonitoringService;
  /** Phase 6: runs `analyse-finding` jobs; scans queue analysis of their findings. */
  analysis?: AnalysisService;
  /** Validated from MONITORING_WORKER_CONCURRENCY (1–4), defaulting to 1. */
  concurrency?: number;
  logger: Logger;
}): Promise<MonitoringWorker> {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(MONITORING_QUEUE_NAME, {
    connection,
    prefix: MONITORING_QUEUE_PREFIX,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: 500,
      removeOnFail: 1_000,
    },
  });
  const intervalMs = intervalHours * 60 * 60 * 1000;

  await queue.upsertJobScheduler(
    'daily-domain-monitoring-sweep',
    { every: intervalMs },
    { name: 'scheduled-sweep', data: {} },
  );
  await queue.add(
    'scheduled-sweep',
    {},
    { jobId: 'monitoring-startup-sweep', removeOnComplete: true },
  );

  const worker = new Worker(
    MONITORING_QUEUE_NAME,
    async (job) => {
      if (job.name === 'scan-brand') {
        const payload = job.data as ScanBrandJob;
        if (!OBJECT_ID.test(payload.organizationId) || !OBJECT_ID.test(payload.brandId)) {
          throw new Error('The queued scan does not contain valid organisation and brand IDs');
        }
        const { toAnalyse, ...result } = await monitoring.scanBrand(payload);
        let analysisQueued = 0;
        if (analysis) {
          for (const findingId of toAnalyse) {
            const next: AnalyseFindingJob = { organizationId: payload.organizationId, findingId };
            await queue.add(ANALYSE_FINDING_JOB, next, {
              ...ANALYSIS_JOB_OPTIONS,
              jobId: analysisJobId(next),
            });
            analysisQueued += 1;
          }
        }
        logger.info({ jobId: job.id, ...result, analysisQueued }, 'Domain scan complete');
        return { ...result, analysisQueued };
      }
      if (job.name === ANALYSE_FINDING_JOB) {
        const payload = job.data as AnalyseFindingJob;
        if (
          typeof payload?.organizationId !== 'string' ||
          typeof payload.findingId !== 'string' ||
          !OBJECT_ID.test(payload.organizationId) ||
          !OBJECT_ID.test(payload.findingId)
        ) {
          throw new Error('The queued analysis does not contain valid organisation and finding IDs');
        }
        if (!analysis) throw new Error('This worker is not configured for finding analysis');
        const result = await analysis.analyseFinding({
          organizationId: payload.organizationId,
          findingId: payload.findingId,
        });
        return { status: result?.status ?? 'missing', score: result?.score ?? null };
      }
      if (job.name === 'scheduled-sweep') {
        const scheduleBucket = Math.floor(Date.now() / intervalMs);
        const organizationIds = await organizations.listIdsForScheduledWork();
        let queued = 0;
        for (const organizationId of organizationIds) {
          // The root organization list is global; every tenant-owned brand read remains scoped.
          const tenantBrands = await brands.listByOrganization(organizationId);
          for (const brand of tenantBrands) {
            if (brand.status !== 'active' || !brand.monitoring.domains) continue;
            await queue.add(
              'scan-brand',
              { organizationId, brandId: brand.id } satisfies ScanBrandJob,
              {
                jobId: `scheduled-${organizationId}-${brand.id}-${scheduleBucket}`,
              },
            );
            queued += 1;
          }
        }
        logger.info({ queued }, 'Scheduled domain scans queued');
        return { queued };
      }
      throw new Error(`Unknown domain-monitoring job: ${job.name}`);
    },
    // Each analysis uses its own short-lived Chromium browser; keep concurrency
    // configurable and default to one so the small worker plan stays within RAM.
    { connection, prefix: MONITORING_QUEUE_PREFIX, concurrency },
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, name: job?.name }, 'Domain-monitoring job failed');
  });
  worker.on('error', (err) => logger.error({ err }, 'Domain-monitoring worker error'));

  logger.info({ intervalHours }, 'Domain-monitoring worker started');
  return {
    async close() {
      await worker.close();
      await queue.close();
      if (connection.status !== 'end') await connection.quit();
    },
  };
}

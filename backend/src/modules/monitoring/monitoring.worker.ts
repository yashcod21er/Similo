import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import type { Logger } from '../../lib/logger.js';
import type { BrandRepository } from '../brands/brand.repository.js';
import { MONITORING_QUEUE_NAME, MONITORING_QUEUE_PREFIX } from './monitoring.queue.js';
import type { MonitoringService, ScanBrandJob } from './monitoring.service.js';

export interface MonitoringWorker {
  close(): Promise<void>;
}

export async function startMonitoringWorker({
  redisUrl,
  intervalHours,
  brands,
  organizations,
  monitoring,
  logger,
}: {
  redisUrl: string;
  intervalHours: number;
  brands: BrandRepository;
  organizations: { listIdsForScheduledWork(): Promise<string[]> };
  monitoring: MonitoringService;
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
        if (
          !/^[a-f\d]{24}$/i.test(payload.organizationId) ||
          !/^[a-f\d]{24}$/i.test(payload.brandId)
        ) {
          throw new Error('The queued scan does not contain valid organisation and brand IDs');
        }
        const result = await monitoring.scanBrand(payload);
        logger.info({ jobId: job.id, ...result }, 'Domain scan complete');
        return result;
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
    { connection, prefix: MONITORING_QUEUE_PREFIX, concurrency: 1 },
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

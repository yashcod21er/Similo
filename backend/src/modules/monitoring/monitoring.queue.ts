import { randomUUID } from 'node:crypto';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import type { Logger } from '../../lib/logger.js';
import { AppError, ErrorCode } from '../../lib/errors.js';
import type { AnalyseFindingJob } from '../analysis/analysis.service.js';
import type { ScanBrandJob } from './monitoring.service.js';

export const MONITORING_QUEUE_NAME = 'domain-monitoring';
export const MONITORING_QUEUE_PREFIX = 'similo';
export const ANALYSE_FINDING_JOB = 'analyse-finding';

/**
 * One analysis job per finding at a time: while a job with this id is waiting
 * or running, adding it again is a no-op. Finished jobs are removed straight
 * away, so the next request queues a fresh run.
 */
export function analysisJobId(payload: AnalyseFindingJob): string {
  return `analyse-${payload.organizationId}-${payload.findingId}`;
}

export const ANALYSIS_JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: true,
} as const;

export interface MonitoringQueue {
  enqueueScan(payload: ScanBrandJob): Promise<{ jobId: string }>;
  enqueueScheduledScan(payload: ScanBrandJob, scheduleBucket: number): Promise<void>;
  /** Queues an AI analysis of one finding (deduplicated per finding). */
  enqueueAnalysis(payload: AnalyseFindingJob): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

export function unavailableMonitoringQueue(): AppError {
  return new AppError(
    503,
    ErrorCode.ServiceUnavailable,
    'Domain monitoring is unavailable. Configure Redis and start the monitoring worker.',
  );
}

export function unavailableAnalysisQueue(): AppError {
  return new AppError(
    503,
    ErrorCode.ServiceUnavailable,
    'AI analysis is unavailable. Configure Redis and start the monitoring worker.',
  );
}

export function createMonitoringQueue(redisUrl: string, logger: Logger): MonitoringQueue {
  // Producers should fail promptly when Redis is offline so HTTP requests can return 503.
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
  });
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

  async function enqueueScan(payload: ScanBrandJob, jobId: string): Promise<void> {
    try {
      await queue.add('scan-brand', payload, { jobId });
    } catch (err) {
      logger.error(
        { err, organizationId: payload.organizationId, brandId: payload.brandId },
        'Could not queue domain scan',
      );
      throw unavailableMonitoringQueue();
    }
  }

  return {
    async enqueueScan(payload) {
      const jobId = `manual-${payload.organizationId}-${payload.brandId}-${randomUUID()}`;
      await enqueueScan(payload, jobId);
      return { jobId };
    },

    async enqueueScheduledScan(payload, scheduleBucket) {
      const jobId = `scheduled-${payload.organizationId}-${payload.brandId}-${scheduleBucket}`;
      await enqueueScan(payload, jobId);
    },

    async enqueueAnalysis(payload) {
      try {
        await queue.add(ANALYSE_FINDING_JOB, payload, {
          ...ANALYSIS_JOB_OPTIONS,
          jobId: analysisJobId(payload),
        });
      } catch (err) {
        logger.error(
          { err, organizationId: payload.organizationId, findingId: payload.findingId },
          'Could not queue finding analysis',
        );
        throw unavailableAnalysisQueue();
      }
    },

    async ping() {
      await connection.ping();
    },

    async close() {
      await queue.close();
      if (connection.status !== 'end') await connection.quit();
    },
  };
}

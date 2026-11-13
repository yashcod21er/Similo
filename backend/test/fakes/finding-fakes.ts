import type {
  AiAnalyseRequest,
  AiAnalyseResponse,
  AiServiceClient,
} from '../../src/clients/ai-service.client.js';
import { AiServiceError } from '../../src/clients/ai-service.client.js';
import type { FindingAnalysis } from '../../src/modules/analysis/analysis.types.js';
import type { CaptureResult, PageCapturer } from '../../src/modules/capture/capture.types.js';
import type {
  FindingCaptureRepository,
  NewFindingCapture,
} from '../../src/modules/capture/finding-capture.repository.js';
import type {
  FindingRecord,
  FindingRepository,
  NewFinding,
} from '../../src/modules/findings/finding.repository.js';
import type { MonitoringQueue } from '../../src/modules/monitoring/monitoring.queue.js';
import type { AnalyseFindingJob } from '../../src/modules/analysis/analysis.service.js';
import { newId } from './auth-fakes.js';

const copy = <T>(value: T): T => structuredClone(value);

/**
 * In-memory findings with the same contracts as MongoDB: every lookup scoped
 * by organisation, "recent" = lastSeenAt desc, "risk" = analysis score desc
 * with unscored findings last.
 */
export function createFakeFindingRepository(now: () => Date = () => new Date()) {
  const store = new Map<string, FindingRecord>();
  const scoped = (organizationId: string, id: string) => {
    const row = store.get(id);
    return row && row.organizationId === organizationId ? row : undefined;
  };

  const repository: FindingRepository = {
    async upsert(organizationId, finding: NewFinding) {
      const existing = [...store.values()].find(
        (row) =>
          row.organizationId === organizationId &&
          row.brandId === finding.brandId &&
          row.domain === finding.domain,
      );
      const at = now();
      const row: FindingRecord = existing
        ? {
            ...existing,
            brandName: finding.brandName,
            source: finding.source,
            sourceReferences: [...finding.sourceReferences],
            score: finding.score,
            matchedTerm: finding.matchedTerm,
            reasons: [...finding.reasons],
            registration: copy(finding.registration),
            lastSeenAt: finding.seenAt,
            updatedAt: at,
          }
        : {
            id: newId(),
            organizationId,
            brandId: finding.brandId,
            brandName: finding.brandName,
            domain: finding.domain,
            source: finding.source,
            sourceReferences: [...finding.sourceReferences],
            score: finding.score,
            matchedTerm: finding.matchedTerm,
            reasons: [...finding.reasons],
            registration: copy(finding.registration),
            status: 'new',
            firstSeenAt: finding.seenAt,
            lastSeenAt: finding.seenAt,
            analysis: null,
            createdAt: at,
            updatedAt: at,
          };
      store.set(row.id, row);
      return copy(row);
    },
    async findById(organizationId, id) {
      const row = scoped(organizationId, id);
      return row ? copy(row) : null;
    },
    async list(organizationId, { status, brandId, sort = 'recent', before, limit }) {
      const scoreOf = (row: FindingRecord) => row.analysis?.score ?? null;
      const rows = [...store.values()]
        .filter((row) => row.organizationId === organizationId)
        .filter((row) => !status || row.status === status)
        .filter((row) => !brandId || row.brandId === brandId)
        .sort((a, b) => {
          if (sort === 'risk') {
            const sa = scoreOf(a) ?? -1;
            const sb = scoreOf(b) ?? -1;
            return sb - sa || b.id.localeCompare(a.id);
          }
          return b.lastSeenAt.getTime() - a.lastSeenAt.getTime() || b.id.localeCompare(a.id);
        })
        .filter((row) => {
          if (!before) return true;
          if (before.sort === 'recent') {
            return (
              row.lastSeenAt < before.lastSeenAt ||
              (row.lastSeenAt.getTime() === before.lastSeenAt.getTime() && row.id < before.id)
            );
          }
          const score = scoreOf(row);
          if (before.score === null) return score === null && row.id < before.id;
          return (
            score === null ||
            score < before.score ||
            (score === before.score && row.id < before.id)
          );
        });
      return rows.slice(0, limit).map(copy);
    },
    async updateStatus(organizationId, id, status) {
      const row = scoped(organizationId, id);
      if (!row) return null;
      row.status = status;
      row.updatedAt = now();
      return copy(row);
    },
    async setAnalysis(organizationId, id, analysis) {
      const row = scoped(organizationId, id);
      if (!row) return null;
      row.analysis = analysis ? copy(analysis) : null;
      row.updatedAt = now();
      return copy(row);
    },
  };

  /** Adds a finding directly (as a scan would). */
  async function seed(
    organizationId: string,
    brandId: string,
    domain: string,
    extra: { analysis?: FindingAnalysis | null; seenAt?: Date; registeredAt?: Date | null } = {},
  ): Promise<FindingRecord> {
    const created = await repository.upsert(organizationId, {
      organizationId,
      brandId,
      brandName: 'Acme Coffee',
      domain,
      source: 'certificate_transparency',
      sourceReferences: [],
      score: 82,
      matchedTerm: 'acme',
      reasons: ['Contains the brand name'],
      registration: {
        registeredAt: extra.registeredAt ?? null,
        registrar: null,
        nameservers: [],
        checkedAt: null,
      },
      seenAt: extra.seenAt ?? now(),
    });
    if (extra.analysis !== undefined) {
      await repository.setAnalysis(organizationId, created.id, extra.analysis);
    }
    return (await repository.findById(organizationId, created.id)) as FindingRecord;
  }

  return { repository, store, seed };
}

export function createFakeCaptureRepository() {
  const store = new Map<string, NewFindingCapture & { organizationId: string }>();
  const key = (organizationId: string, findingId: string) => `${organizationId}:${findingId}`;
  const repository: FindingCaptureRepository = {
    async save(organizationId, capture) {
      store.set(key(organizationId, capture.findingId), { organizationId, ...capture });
    },
    async findScreenshot(organizationId, findingId) {
      const row = store.get(key(organizationId, findingId));
      return row
        ? { contentType: 'image/jpeg', data: Buffer.from(row.screenshot), capturedAt: row.capturedAt }
        : null;
    },
    async deleteByFinding(organizationId, findingId) {
      store.delete(key(organizationId, findingId));
    },
    async deleteByBrand(organizationId, brandId) {
      let removed = 0;
      for (const [id, row] of store) {
        if (row.organizationId === organizationId && row.brandId === brandId) {
          store.delete(id);
          removed += 1;
        }
      }
      return removed;
    },
  };
  return { repository, store };
}

/** A monitoring queue that records jobs (or fails, to test 503 handling). */
export function createFakeMonitoringQueue({ failAnalysis = false } = {}) {
  const analyses: AnalyseFindingJob[] = [];
  const queue: MonitoringQueue = {
    async enqueueScan() {
      return { jobId: 'fake-scan' };
    },
    async enqueueScheduledScan() {},
    async enqueueAnalysis(payload) {
      if (failAnalysis) {
        const { unavailableAnalysisQueue } = await import(
          '../../src/modules/monitoring/monitoring.queue.js'
        );
        throw unavailableAnalysisQueue();
      }
      analyses.push(payload);
    },
    async ping() {},
    async close() {},
  };
  return { queue, analyses };
}

/** A capturer that returns a prepared result and remembers the URLs it was given. */
export function createFakeCapturer(results: Record<string, CaptureResult['status']> = {}) {
  const urls: string[] = [];
  const capturer: PageCapturer = {
    async capture(url) {
      urls.push(url);
      const status = results[url] ?? 'captured';
      const capturedAt = new Date('2026-11-08T10:00:00Z');
      if (status !== 'captured') return { status, capturedAt, reason: `fake ${status}` };
      return {
        status: 'captured',
        capturedAt,
        page: {
          finalUrl: url,
          title: 'Acme Coffee - Sign in',
          text: 'Sign in to your Acme Coffee account',
          screenshot: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]),
          images: [{ kind: 'logo', data: Buffer.from('fake-png') }],
          forms: { hasPasswordField: true, hasPaymentField: false, submitsToOtherDomain: false },
          certificateIssuedAt: '2026-11-01T00:00:00.000Z',
        },
      };
    },
  };
  return { capturer, urls };
}

export const SAMPLE_AI_RESPONSE: AiAnalyseResponse = {
  modelVersion: 'similo-risk-1',
  score: 74,
  level: 'high',
  signals: [
    {
      id: 'domain_similarity',
      label: 'Domain name',
      value: 0.82,
      points: 20,
      maxPoints: 25,
      detail: 'The domain looks like acme.com.',
    },
    {
      id: 'credential_form',
      label: 'Sign-in form',
      value: 1,
      points: 10,
      maxPoints: 10,
      detail: 'The page asks for a password.',
    },
  ],
  reasons: ['The domain looks like acme.com.', 'The page asks for a password.'],
  unavailable: [],
  ocrText: '',
  logoMatch: null,
  models: { text: 'test' },
};

/** An AI client whose answer (or failure) each test chooses. */
export function createFakeAiClient(
  behaviour:
    | { respond: AiAnalyseResponse }
    | { fail: 'unavailable' | 'invalid_response' | 'rejected' }
    | { notConfigured: true } = { respond: SAMPLE_AI_RESPONSE },
) {
  const requests: AiAnalyseRequest[] = [];
  const client: AiServiceClient = {
    async getHealth() {
      return { status: 'ok', service: 'fake', version: '0' };
    },
    canAnalyse() {
      return !('notConfigured' in behaviour);
    },
    async analyse(request) {
      requests.push(structuredClone(request));
      if ('fail' in behaviour) {
        throw new AiServiceError('fake failure', { kind: behaviour.fail });
      }
      if ('notConfigured' in behaviour) throw new AiServiceError('not configured');
      return structuredClone(behaviour.respond);
    },
  };
  return { client, requests };
}

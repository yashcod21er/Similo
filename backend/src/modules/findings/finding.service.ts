import { AppError, ErrorCode } from '../../lib/errors.js';
import type { AuthContext } from '../auth/auth.types.js';
import type { AuditService } from '../audit/audit.service.js';
import {
  pendingAnalysis,
  toAnalysisDto,
  type FindingAnalysisDto,
} from '../analysis/analysis.types.js';
import type {
  FindingCaptureRepository,
  FindingScreenshot,
} from '../capture/finding-capture.repository.js';
import type { MonitoringQueue } from '../monitoring/monitoring.queue.js';
import { unavailableAnalysisQueue } from '../monitoring/monitoring.queue.js';
import type {
  FindingCursor,
  FindingRepository,
  FindingRecord,
  FindingSort,
} from './finding.repository.js';
import type { FindingStatus } from './finding.model.js';

export interface FindingDto {
  id: string;
  brandId: string;
  brandName: string;
  domain: string;
  source: 'certificate_transparency' | 'fixture';
  sourceReferences: string[];
  score: number;
  matchedTerm: string;
  reasons: string[];
  registration: {
    registeredAt: string | null;
    registrar: string | null;
    nameservers: string[];
    checkedAt: string | null;
  };
  status: FindingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  /** Phase 6: the explainable AI analysis, or null before the first run. */
  analysis: FindingAnalysisDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface FindingPage {
  findings: FindingDto[];
  nextCursor: string | null;
}

export interface FindingService {
  list(
    auth: AuthContext,
    options: {
      status?: FindingStatus;
      brandId?: string;
      sort?: FindingSort;
      before?: string;
      limit: number;
    },
  ): Promise<FindingPage>;
  get(auth: AuthContext, findingId: string): Promise<FindingDto>;
  updateStatus(auth: AuthContext, findingId: string, status: FindingStatus): Promise<FindingDto>;
  /** Marks the analysis pending and queues it; 503 when the queue is unavailable. */
  requestAnalysis(
    auth: AuthContext,
    findingId: string,
  ): Promise<{ analysis: FindingAnalysisDto | null }>;
  getScreenshot(auth: AuthContext, findingId: string): Promise<FindingScreenshot>;
}

function findingNotFound(): AppError {
  return new AppError(404, ErrorCode.NotFound, 'That finding does not exist.');
}

function screenshotNotFound(): AppError {
  return new AppError(404, ErrorCode.NotFound, 'There is no screenshot for this finding.');
}

function invalidCursor(): AppError {
  return new AppError(400, ErrorCode.BadRequest, 'The findings cursor is invalid.');
}

const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Cursors are opaque to the website:
 * recent = `<lastSeenAt ISO>_<id>`, risk = `risk_<score|none>_<id>`.
 */
function encodeCursor(finding: FindingRecord, sort: FindingSort): string {
  if (sort === 'risk') return `risk_${finding.analysis?.score ?? 'none'}_${finding.id}`;
  return `${finding.lastSeenAt.toISOString()}_${finding.id}`;
}

function decodeCursor(cursor: string | undefined, sort: FindingSort): FindingCursor | undefined {
  if (!cursor) return undefined;
  const split = cursor.lastIndexOf('_');
  const id = cursor.slice(split + 1);
  if (split < 0 || !OBJECT_ID.test(id)) throw invalidCursor();
  const head = cursor.slice(0, split);

  if (sort === 'risk') {
    const match = /^risk_(none|\d{1,3})$/.exec(head);
    if (!match) throw invalidCursor();
    const score = match[1] === 'none' ? null : Number(match[1]);
    if (score !== null && score > 100) throw invalidCursor();
    return { sort: 'risk', score, id };
  }
  const lastSeenAt = new Date(head);
  if (Number.isNaN(lastSeenAt.getTime())) throw invalidCursor();
  return { sort: 'recent', lastSeenAt, id };
}

function toDto(finding: FindingRecord): FindingDto {
  return {
    id: finding.id,
    brandId: finding.brandId,
    brandName: finding.brandName,
    domain: finding.domain,
    source: finding.source,
    sourceReferences: [...finding.sourceReferences],
    score: finding.score,
    matchedTerm: finding.matchedTerm,
    reasons: [...finding.reasons],
    registration: {
      registeredAt: finding.registration.registeredAt?.toISOString() ?? null,
      registrar: finding.registration.registrar,
      nameservers: [...finding.registration.nameservers],
      checkedAt: finding.registration.checkedAt?.toISOString() ?? null,
    },
    status: finding.status,
    firstSeenAt: finding.firstSeenAt.toISOString(),
    lastSeenAt: finding.lastSeenAt.toISOString(),
    analysis: toAnalysisDto(finding.analysis),
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
  };
}

export function createFindingService({
  findings,
  audit,
  captures,
  analysisQueue = null,
}: {
  findings: FindingRepository;
  audit: AuditService;
  /** Phase 6 screenshots; without it every screenshot request is a 404. */
  captures?: FindingCaptureRepository;
  /** Phase 6 analysis jobs; null = analysis requests answer 503. */
  analysisQueue?: MonitoringQueue | null;
}): FindingService {
  return {
    async list(auth, options) {
      const sort = options.sort ?? 'recent';
      const rows = await findings.list(auth.organizationId, {
        status: options.status,
        brandId: options.brandId,
        sort,
        before: decodeCursor(options.before, sort),
        limit: options.limit + 1,
      });
      const page = rows.slice(0, options.limit);
      const last = page.at(-1);
      return {
        findings: page.map(toDto),
        nextCursor: rows.length > options.limit && last ? encodeCursor(last, sort) : null,
      };
    },

    async get(auth, findingId) {
      const finding = await findings.findById(auth.organizationId, findingId);
      if (!finding) throw findingNotFound();
      return toDto(finding);
    },

    async updateStatus(auth, findingId, status) {
      const current = await findings.findById(auth.organizationId, findingId);
      if (!current) throw findingNotFound();
      if (current.status === status) return toDto(current);
      const updated = await findings.updateStatus(auth.organizationId, findingId, status);
      if (!updated) throw findingNotFound();
      await audit.record({
        organizationId: auth.organizationId,
        action: 'finding.status_updated',
        actor: { userId: auth.user.id, name: auth.user.name, email: auth.user.email },
        target: { type: 'finding', id: findingId, label: updated.domain },
        metadata: { brandName: updated.brandName, from: current.status, to: status },
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
      return toDto(updated);
    },

    async requestAnalysis(auth, findingId) {
      const current = await findings.findById(auth.organizationId, findingId);
      if (!current) throw findingNotFound();
      if (!analysisQueue) throw unavailableAnalysisQueue();

      // Pending first, then queue: the worker can never finish before we mark it.
      const pending = await findings.setAnalysis(
        auth.organizationId,
        findingId,
        pendingAnalysis(current.analysis),
      );
      if (!pending) throw findingNotFound();
      try {
        await analysisQueue.enqueueAnalysis({
          organizationId: auth.organizationId,
          findingId,
          requestedBy: auth.user.id,
        });
      } catch (err) {
        // Put the earlier result back so the finding is not stuck as "pending".
        await findings.setAnalysis(auth.organizationId, findingId, current.analysis);
        throw err;
      }

      await audit.record({
        organizationId: auth.organizationId,
        action: 'finding.analysis_requested',
        actor: { userId: auth.user.id, name: auth.user.name, email: auth.user.email },
        target: { type: 'finding', id: findingId, label: current.domain },
        metadata: { brandName: current.brandName },
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
      return { analysis: toAnalysisDto(pending.analysis) };
    },

    async getScreenshot(auth, findingId) {
      // The finding lookup is scoped by organisation, and so is the capture lookup.
      const finding = await findings.findById(auth.organizationId, findingId);
      if (!finding) throw findingNotFound();
      const screenshot = await captures?.findScreenshot(auth.organizationId, findingId);
      if (!screenshot) throw screenshotNotFound();
      return screenshot;
    },
  };
}

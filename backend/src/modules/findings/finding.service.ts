import { AppError, ErrorCode } from '../../lib/errors.js';
import type { AuthContext } from '../auth/auth.types.js';
import type { AuditService } from '../audit/audit.service.js';
import type { FindingRepository, FindingRecord } from './finding.repository.js';
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
    options: { status?: FindingStatus; brandId?: string; before?: string; limit: number },
  ): Promise<FindingPage>;
  get(auth: AuthContext, findingId: string): Promise<FindingDto>;
  updateStatus(auth: AuthContext, findingId: string, status: FindingStatus): Promise<FindingDto>;
}

function findingNotFound(): AppError {
  return new AppError(404, ErrorCode.NotFound, 'That finding does not exist.');
}

function encodeCursor(finding: FindingRecord): string {
  return `${finding.lastSeenAt.toISOString()}_${finding.id}`;
}

function decodeCursor(cursor: string | undefined): { lastSeenAt: Date; id: string } | undefined {
  if (!cursor) return undefined;
  const split = cursor.lastIndexOf('_');
  const lastSeenAt = new Date(cursor.slice(0, split));
  const id = cursor.slice(split + 1);
  if (split < 0 || Number.isNaN(lastSeenAt.getTime()) || !/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError(400, ErrorCode.BadRequest, 'The findings cursor is invalid.');
  }
  return { lastSeenAt, id };
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
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
  };
}

export function createFindingService({
  findings,
  audit,
}: {
  findings: FindingRepository;
  audit: AuditService;
}): FindingService {
  return {
    async list(auth, options) {
      const rows = await findings.list(auth.organizationId, {
        status: options.status,
        brandId: options.brandId,
        before: decodeCursor(options.before),
        limit: options.limit + 1,
      });
      const page = rows.slice(0, options.limit);
      const last = page.at(-1);
      return {
        findings: page.map(toDto),
        nextCursor: rows.length > options.limit && last ? encodeCursor(last) : null,
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
  };
}

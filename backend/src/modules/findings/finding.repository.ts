import { toId } from '../../db/transaction.js';
import type { FindingAnalysis } from '../analysis/analysis.types.js';
import {
  FindingModel,
  type FindingDocument,
  type FindingSource,
  type FindingStatus,
} from './finding.model.js';

export interface FindingRegistration {
  registeredAt: Date | null;
  registrar: string | null;
  nameservers: string[];
  checkedAt: Date | null;
}

export interface FindingRecord {
  id: string;
  organizationId: string;
  brandId: string;
  brandName: string;
  domain: string;
  source: FindingSource;
  sourceReferences: string[];
  score: number;
  matchedTerm: string;
  reasons: string[];
  registration: FindingRegistration;
  status: FindingStatus;
  firstSeenAt: Date;
  lastSeenAt: Date;
  analysis: FindingAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewFinding {
  organizationId: string;
  brandId: string;
  brandName: string;
  domain: string;
  source: FindingSource;
  sourceReferences: string[];
  score: number;
  matchedTerm: string;
  reasons: string[];
  registration: FindingRegistration;
  seenAt: Date;
}

export const FINDING_SORTS = ['recent', 'risk'] as const;
export type FindingSort = (typeof FINDING_SORTS)[number];

/** Where the next page starts: after this finding in the chosen order. */
export type FindingCursor =
  | { sort: 'recent'; lastSeenAt: Date; id: string }
  | { sort: 'risk'; score: number | null; id: string };

export interface FindingRepository {
  upsert(organizationId: string, finding: NewFinding): Promise<FindingRecord>;
  findById(organizationId: string, id: string): Promise<FindingRecord | null>;
  list(
    organizationId: string,
    options: {
      status?: FindingStatus;
      brandId?: string;
      /** recent = last seen first; risk = analysis score first, unscored last. */
      sort?: FindingSort;
      before?: FindingCursor;
      limit: number;
    },
  ): Promise<FindingRecord[]>;
  updateStatus(
    organizationId: string,
    id: string,
    status: FindingStatus,
  ): Promise<FindingRecord | null>;
  /** Replaces the finding's analysis; null when the finding is not in this organisation. */
  setAnalysis(
    organizationId: string,
    id: string,
    analysis: FindingAnalysis | null,
  ): Promise<FindingRecord | null>;
}

function copyAnalysis(analysis: FindingAnalysis | null | undefined): FindingAnalysis | null {
  if (!analysis) return null;
  return {
    status: analysis.status,
    score: analysis.score ?? null,
    level: analysis.level ?? null,
    signals: (analysis.signals ?? []).map((signal) => ({
      id: signal.id,
      label: signal.label,
      value: signal.value ?? null,
      points: signal.points,
      maxPoints: signal.maxPoints,
      detail: signal.detail ?? '',
    })),
    reasons: [...(analysis.reasons ?? [])],
    unavailable: [...(analysis.unavailable ?? [])],
    capture: analysis.capture
      ? {
          status: analysis.capture.status,
          finalUrl: analysis.capture.finalUrl ?? null,
          title: analysis.capture.title ?? null,
          hasScreenshot: Boolean(analysis.capture.hasScreenshot),
          capturedAt: analysis.capture.capturedAt ?? null,
        }
      : null,
    logoMatch: analysis.logoMatch
      ? {
          logoId: analysis.logoMatch.logoId,
          source: analysis.logoMatch.source,
          similarity: analysis.logoMatch.similarity,
          method: analysis.logoMatch.method,
        }
      : null,
    modelVersion: analysis.modelVersion ?? null,
    analysedAt: analysis.analysedAt ?? null,
    error: analysis.error ?? null,
  };
}

function toRecord(doc: FindingDocument): FindingRecord {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    brandId: toId(doc.brandId),
    brandName: doc.brandName,
    domain: doc.domain,
    source: doc.source,
    sourceReferences: [...doc.sourceReferences],
    score: doc.score,
    matchedTerm: doc.matchedTerm,
    reasons: [...doc.reasons],
    registration: {
      registeredAt: doc.registration?.registeredAt ?? null,
      registrar: doc.registration?.registrar ?? null,
      nameservers: [...(doc.registration?.nameservers ?? [])],
      checkedAt: doc.registration?.checkedAt ?? null,
    },
    status: doc.status,
    firstSeenAt: doc.firstSeenAt,
    lastSeenAt: doc.lastSeenAt,
    analysis: copyAnalysis(doc.analysis),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const mongoFindingRepository: FindingRepository = {
  async upsert(organizationId, finding) {
    const doc = await FindingModel.findOneAndUpdate(
      { organizationId, brandId: finding.brandId, domain: finding.domain },
      {
        $set: {
          brandName: finding.brandName,
          source: finding.source,
          sourceReferences: finding.sourceReferences,
          score: finding.score,
          matchedTerm: finding.matchedTerm,
          reasons: finding.reasons,
          registration: finding.registration,
          lastSeenAt: finding.seenAt,
        },
        $setOnInsert: {
          organizationId,
          brandId: finding.brandId,
          domain: finding.domain,
          status: 'new',
          firstSeenAt: finding.seenAt,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    ).lean<FindingDocument>();
    if (!doc) throw new Error('Finding was not created');
    return toRecord(doc);
  },

  async findById(organizationId, id) {
    const doc = await FindingModel.findOne({ organizationId, _id: id }).lean<FindingDocument>();
    return doc ? toRecord(doc) : null;
  },

  async list(organizationId, { status, brandId, sort = 'recent', before, limit }) {
    const filter: Record<string, unknown> = { organizationId };
    if (status) filter.status = status;
    if (brandId) filter.brandId = brandId;
    if (before?.sort === 'recent') {
      filter.$or = [
        { lastSeenAt: { $lt: before.lastSeenAt } },
        { lastSeenAt: before.lastSeenAt, _id: { $lt: before.id } },
      ];
    } else if (before?.sort === 'risk') {
      // MongoDB sorts a missing/null score below every number, so "nulls last".
      filter.$or =
        before.score === null
          ? [{ 'analysis.score': null, _id: { $lt: before.id } }]
          : [
              { 'analysis.score': { $lt: before.score } },
              { 'analysis.score': before.score, _id: { $lt: before.id } },
              { 'analysis.score': null },
            ];
    }
    const order: Record<string, 1 | -1> =
      sort === 'risk' ? { 'analysis.score': -1, _id: -1 } : { lastSeenAt: -1, _id: -1 };
    const docs = await FindingModel.find(filter)
      .sort(order)
      .limit(limit)
      .lean<FindingDocument[]>();
    return docs.map(toRecord);
  },

  async updateStatus(organizationId, id, status) {
    const doc = await FindingModel.findOneAndUpdate(
      { organizationId, _id: id },
      { $set: { status } },
      { returnDocument: 'after', runValidators: true },
    ).lean<FindingDocument>();
    return doc ? toRecord(doc) : null;
  },

  async setAnalysis(organizationId, id, analysis) {
    const doc = await FindingModel.findOneAndUpdate(
      { organizationId, _id: id },
      { $set: { analysis } },
      { returnDocument: 'after', runValidators: true },
    ).lean<FindingDocument>();
    return doc ? toRecord(doc) : null;
  },
};

import { toId } from '../../db/transaction.js';
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

export interface FindingCursor {
  lastSeenAt: Date;
  id: string;
}

export interface FindingRepository {
  upsert(organizationId: string, finding: NewFinding): Promise<FindingRecord>;
  findById(organizationId: string, id: string): Promise<FindingRecord | null>;
  list(
    organizationId: string,
    options: { status?: FindingStatus; brandId?: string; before?: FindingCursor; limit: number },
  ): Promise<FindingRecord[]>;
  updateStatus(
    organizationId: string,
    id: string,
    status: FindingStatus,
  ): Promise<FindingRecord | null>;
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

  async list(organizationId, { status, brandId, before, limit }) {
    const filter: Record<string, unknown> = { organizationId };
    if (status) filter.status = status;
    if (brandId) filter.brandId = brandId;
    if (before) {
      filter.$or = [
        { lastSeenAt: { $lt: before.lastSeenAt } },
        { lastSeenAt: before.lastSeenAt, _id: { $lt: before.id } },
      ];
    }
    const docs = await FindingModel.find(filter)
      .sort({ lastSeenAt: -1, _id: -1 })
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
};

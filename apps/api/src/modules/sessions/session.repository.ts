import { toId } from '../../db/transaction.js';
import { SessionModel, type SessionDocument } from './session.model.js';

export interface SessionRecord {
  id: string;
  tokenHash: string;
  userId: string;
  organizationId: string;
  ip: string;
  userAgent: string;
  lastSeenAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  createdAt: Date;
}

export type NewSession = Omit<SessionRecord, 'id' | 'createdAt'>;

export interface SessionRepository {
  create(data: NewSession): Promise<SessionRecord>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  touch(id: string, lastSeenAt: Date, expiresAt: Date): Promise<void>;
  deleteById(id: string): Promise<void>;
  /** Signs a user out everywhere, optionally keeping the session they are using. */
  deleteByUser(userId: string, exceptSessionId?: string): Promise<void>;
  /** Used when a member is removed from an organisation. */
  deleteByUserInOrganization(userId: string, organizationId: string): Promise<void>;
}

function toRecord(doc: SessionDocument): SessionRecord {
  return {
    id: toId(doc._id),
    tokenHash: doc.tokenHash,
    userId: toId(doc.userId),
    organizationId: toId(doc.organizationId),
    ip: doc.ip,
    userAgent: doc.userAgent,
    lastSeenAt: doc.lastSeenAt,
    expiresAt: doc.expiresAt,
    absoluteExpiresAt: doc.absoluteExpiresAt,
    createdAt: doc.createdAt,
  };
}

export const mongoSessionRepository: SessionRepository = {
  async create(data) {
    const doc = await SessionModel.create(data);
    return toRecord(doc.toObject() as SessionDocument);
  },
  async findByTokenHash(tokenHash) {
    const doc = await SessionModel.findOne({ tokenHash }).lean<SessionDocument>();
    return doc ? toRecord(doc) : null;
  },
  async touch(id, lastSeenAt, expiresAt) {
    await SessionModel.updateOne({ _id: id }, { $set: { lastSeenAt, expiresAt } });
  },
  async deleteById(id) {
    await SessionModel.deleteOne({ _id: id });
  },
  async deleteByUser(userId, exceptSessionId) {
    await SessionModel.deleteMany({
      userId,
      ...(exceptSessionId && { _id: { $ne: exceptSessionId } }),
    });
  },
  async deleteByUserInOrganization(userId, organizationId) {
    await SessionModel.deleteMany({ userId, organizationId });
  },
};

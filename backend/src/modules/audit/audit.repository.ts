import { toId } from '../../db/transaction.js';
import { AuditEventModel, type AuditEventDocument } from './audit.model.js';

export type AuditAction =
  | 'auth.signed_up'
  | 'auth.signed_in'
  | 'auth.signed_out'
  | 'auth.sign_in_failed'
  | 'auth.account_locked'
  | 'auth.password_changed'
  | 'organization.renamed'
  | 'member.invited'
  | 'member.invite_revoked'
  | 'member.joined'
  | 'member.role_changed'
  | 'member.removed'
  | 'brand.created'
  | 'brand.updated'
  | 'brand.deleted'
  | 'brand.domain_added'
  | 'brand.domain_removed'
  | 'brand.trademark_added'
  | 'brand.trademark_updated'
  | 'brand.trademark_removed'
  | 'brand.logo_uploaded'
  | 'brand.logo_removed'
  | 'brand.monitoring_updated';

export interface AuditActor {
  userId: string;
  name: string;
  email: string;
}

export interface AuditTarget {
  type: 'user' | 'invite' | 'organization' | 'brand';
  id: string;
  label: string;
}

export interface NewAuditEvent {
  organizationId: string;
  action: AuditAction;
  actor: AuditActor | null;
  target?: AuditTarget | null;
  metadata?: Record<string, unknown>;
  ip: string;
  userAgent: string;
}

export interface AuditEventRecord extends Required<Omit<NewAuditEvent, 'action'>> {
  id: string;
  action: string;
  createdAt: Date;
}

export interface AuditCursor {
  createdAt: Date;
  id: string;
}

export interface AuditRepository {
  record(event: NewAuditEvent): Promise<void>;
  /** Newest first. `before` continues after the last event of the previous page. */
  list(
    organizationId: string,
    options: { before?: AuditCursor; limit: number },
  ): Promise<AuditEventRecord[]>;
}

function toRecord(doc: AuditEventDocument): AuditEventRecord {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    action: doc.action,
    actor: doc.actor
      ? { userId: toId(doc.actor.userId), name: doc.actor.name, email: doc.actor.email }
      : null,
    target: doc.target
      ? { type: doc.target.type as AuditTarget['type'], id: doc.target.id, label: doc.target.label }
      : null,
    metadata: doc.metadata ?? {},
    ip: doc.ip,
    userAgent: doc.userAgent,
    createdAt: doc.createdAt,
  };
}

export const mongoAuditRepository: AuditRepository = {
  async record(event) {
    await AuditEventModel.create({
      ...event,
      userAgent: event.userAgent.slice(0, 300),
      target: event.target ?? null,
      metadata: event.metadata ?? {},
    });
  },
  async list(organizationId, { before, limit }) {
    const filter = before
      ? {
          organizationId,
          $or: [
            { createdAt: { $lt: before.createdAt } },
            { createdAt: before.createdAt, _id: { $lt: before.id } },
          ],
        }
      : { organizationId };
    const docs = await AuditEventModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean<AuditEventDocument[]>();
    return docs.map(toRecord);
  },
};

import { Schema, model, type Types } from 'mongoose';

/**
 * Append-only record of security-relevant actions in an organisation:
 * sign-ins, invitations, role changes, removals. There is deliberately no
 * update or delete path in the API.
 *
 * The actor's name and email are copied in (not just referenced), so the log
 * still reads correctly if the person is later renamed or removed.
 */
const auditEventSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    action: { type: String, required: true, maxlength: 60 },
    actor: {
      type: new Schema(
        { userId: Schema.Types.ObjectId, name: String, email: String },
        { _id: false },
      ),
      default: null,
    },
    target: {
      type: new Schema({ type: String, id: String, label: String }, { _id: false }),
      default: null,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The audit page lists one organisation's events, newest first.
auditEventSchema.index({ organizationId: 1, createdAt: -1, _id: -1 });

export interface AuditEventDocument {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  action: string;
  actor: { userId: Types.ObjectId; name: string; email: string } | null;
  target: { type: string; id: string; label: string } | null;
  metadata: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

export const AuditEventModel = model('AuditEvent', auditEventSchema);

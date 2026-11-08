import { Schema, model, type Types } from 'mongoose';

/**
 * A signed-in browser. The cookie holds a random token; only its SHA-256 hash
 * is stored here. Deleting the document signs that browser out immediately.
 */
const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
    lastSeenAt: { type: Date, required: true },
    // Idle expiry: pushed forward while the session is in use.
    expiresAt: { type: Date, required: true },
    // Hard limit: the session ends here even if it is used every day.
    absoluteExpiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ userId: 1 });
// MongoDB deletes sessions automatically once they expire (TTL index).
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface SessionDocument {
  _id: Types.ObjectId;
  tokenHash: string;
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  ip: string;
  userAgent: string;
  lastSeenAt: Date;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  createdAt: Date;
}

export const SessionModel = model('Session', sessionSchema);

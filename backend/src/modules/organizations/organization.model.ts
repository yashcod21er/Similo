import { Schema, model, type Types } from 'mongoose';
import { ROLES } from './roles.js';

/* ------------------------------------------------------------ Organization */

/** A customer workspace. Every piece of customer data belongs to exactly one. */
const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export interface OrganizationDocument {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export const OrganizationModel = model('Organization', organizationSchema);

/* -------------------------------------------------------------- Membership */

/** Links a user to an organisation with one role. */
const membershipSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// A user appears at most once per organisation; tenant queries start with organizationId.
membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ organizationId: 1, role: 1 });
membershipSchema.index({ userId: 1 });

export interface MembershipDocument {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: (typeof ROLES)[number];
  invitedBy: Types.ObjectId | null;
  createdAt: Date;
}

export const MembershipModel = model('Membership', membershipSchema);

/* ------------------------------------------------------------------ Invite */

/** A pending invitation link. Only a hash of the link's token is stored. */
const inviteSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    role: { type: String, enum: ROLES, required: true },
    tokenHash: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

inviteSchema.index({ tokenHash: 1 }, { unique: true });
// One pending invite per email per organisation (a new invite replaces the old one).
inviteSchema.index({ organizationId: 1, email: 1 }, { unique: true });
// MongoDB deletes expired invites automatically (TTL index).
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export interface InviteDocument {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  email: string;
  role: (typeof ROLES)[number];
  tokenHash: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

export const InviteModel = model('Invite', inviteSchema);

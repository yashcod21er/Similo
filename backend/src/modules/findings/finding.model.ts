import { Schema, model, type Types } from 'mongoose';

export const FINDING_STATUSES = ['new', 'reviewing', 'confirmed', 'dismissed'] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const FINDING_SOURCES = ['certificate_transparency', 'fixture'] as const;
export type FindingSource = (typeof FINDING_SOURCES)[number];

const registrationSchema = new Schema(
  {
    registeredAt: { type: Date, default: null },
    registrar: { type: String, default: null, maxlength: 200 },
    nameservers: { type: [String], default: [] },
    checkedAt: { type: Date, default: null },
  },
  { _id: false },
);

const findingSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    brandName: { type: String, required: true, maxlength: 80 },
    domain: { type: String, required: true, lowercase: true, maxlength: 253 },
    source: { type: String, enum: FINDING_SOURCES, required: true },
    sourceReferences: { type: [String], default: [] },
    score: { type: Number, required: true, min: 0, max: 100 },
    matchedTerm: { type: String, required: true, maxlength: 120 },
    reasons: { type: [String], default: [] },
    registration: { type: registrationSchema, default: () => ({}) },
    status: { type: String, enum: FINDING_STATUSES, default: 'new' },
    firstSeenAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// A domain produces one finding per protected brand in an organisation.
findingSchema.index({ organizationId: 1, brandId: 1, domain: 1 }, { unique: true });
// Tenant-scoped list and status filters, newest activity first.
findingSchema.index({ organizationId: 1, status: 1, lastSeenAt: -1, _id: -1 });

export interface FindingDocument {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  brandId: Types.ObjectId;
  brandName: string;
  domain: string;
  source: FindingSource;
  sourceReferences: string[];
  score: number;
  matchedTerm: string;
  reasons: string[];
  registration: {
    registeredAt: Date | null;
    registrar: string | null;
    nameservers: string[];
    checkedAt: Date | null;
  };
  status: FindingStatus;
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const FindingModel = model('Finding', findingSchema, 'findings');

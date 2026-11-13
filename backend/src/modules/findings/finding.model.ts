import { Schema, model, type Types } from 'mongoose';
import {
  ANALYSIS_STATUSES,
  CAPTURE_STATUSES,
  LOGO_METHODS,
  LOGO_SOURCES,
  RISK_LEVELS,
  type FindingAnalysis,
} from '../analysis/analysis.types.js';

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

/* Phase 6: the explainable AI analysis (null until the first run). */
const signalSchema = new Schema(
  {
    id: { type: String, required: true, maxlength: 60 },
    label: { type: String, required: true, maxlength: 120 },
    value: { type: Number, default: null },
    points: { type: Number, required: true, min: 0, max: 100 },
    maxPoints: { type: Number, required: true, min: 0, max: 100 },
    detail: { type: String, default: '', maxlength: 500 },
  },
  { _id: false },
);

const analysisCaptureSchema = new Schema(
  {
    status: { type: String, enum: CAPTURE_STATUSES, required: true },
    finalUrl: { type: String, default: null, maxlength: 2048 },
    title: { type: String, default: null, maxlength: 300 },
    hasScreenshot: { type: Boolean, default: false },
    capturedAt: { type: Date, default: null },
  },
  { _id: false },
);

const logoMatchSchema = new Schema(
  {
    logoId: { type: String, required: true, maxlength: 64 },
    source: { type: String, enum: LOGO_SOURCES, required: true },
    similarity: { type: Number, required: true },
    method: { type: String, enum: LOGO_METHODS, required: true },
  },
  { _id: false },
);

const analysisSchema = new Schema(
  {
    status: { type: String, enum: ANALYSIS_STATUSES, required: true },
    score: { type: Number, default: null, min: 0, max: 100 },
    level: { type: String, enum: RISK_LEVELS, default: null },
    signals: { type: [signalSchema], default: [] },
    reasons: { type: [String], default: [] },
    unavailable: { type: [String], default: [] },
    capture: { type: analysisCaptureSchema, default: null },
    logoMatch: { type: logoMatchSchema, default: null },
    modelVersion: { type: String, default: null, maxlength: 60 },
    analysedAt: { type: Date, default: null },
    error: { type: String, default: null, maxlength: 300 },
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
    analysis: { type: analysisSchema, default: null },
  },
  { timestamps: true },
);

// A domain produces one finding per protected brand in an organisation.
findingSchema.index({ organizationId: 1, brandId: 1, domain: 1 }, { unique: true });
// Tenant-scoped list and status filters, newest activity first.
findingSchema.index({ organizationId: 1, status: 1, lastSeenAt: -1, _id: -1 });
// Phase 6: "highest risk first" (findings without a score sort last).
findingSchema.index({ organizationId: 1, 'analysis.score': -1, _id: -1 });

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
  analysis?: FindingAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
}

export const FindingModel = model('Finding', findingSchema, 'findings');

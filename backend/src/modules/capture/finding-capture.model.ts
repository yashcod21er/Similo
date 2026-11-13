import { Schema, model, type Types } from 'mongoose';

/**
 * The latest page screenshot of a finding (one per finding, replaced on every
 * new capture). Kept out of the findings collection so listing findings never
 * loads image bytes.
 */
const findingCaptureSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    findingId: { type: Schema.Types.ObjectId, ref: 'Finding', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    capturedAt: { type: Date, required: true },
    finalUrl: { type: String, required: true, maxlength: 2048 },
    title: { type: String, default: '', maxlength: 300 },
    screenshot: { type: Buffer, required: true },
    contentType: { type: String, enum: ['image/jpeg'], required: true },
  },
  { timestamps: true },
);

// One capture per finding, always looked up within the organisation.
findingCaptureSchema.index({ organizationId: 1, findingId: 1 }, { unique: true });
// Removing a brand's captures together.
findingCaptureSchema.index({ organizationId: 1, brandId: 1 });

export interface FindingCaptureDocument {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  findingId: Types.ObjectId;
  brandId: Types.ObjectId;
  capturedAt: Date;
  finalUrl: string;
  title: string;
  screenshot: Buffer;
  contentType: 'image/jpeg';
}

export const FindingCaptureModel = model(
  'FindingCapture',
  findingCaptureSchema,
  'finding_captures',
);

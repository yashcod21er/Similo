import { Schema, model, type InferSchemaType } from 'mongoose';
import { DEMO_INTERESTS, DEMO_ROLES } from './demo-request.schemas.js';

/**
 * Demo/contact requests from the public website.
 *
 * These are platform-level sales leads, not tenant data, so they have no
 * organizationId. Only the fields needed to reply are stored (no IP address).
 */
const demoRequestSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    workEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, enum: DEMO_ROLES },
    interests: { type: [String], enum: DEMO_INTERESTS, default: [] },
    message: { type: String, default: '', maxlength: 2000 },
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
    source: { type: String, default: 'website' },
  },
  { timestamps: true },
);

// Admin views list newest first and filter by status.
demoRequestSchema.index({ status: 1, createdAt: -1 });
demoRequestSchema.index({ workEmail: 1, createdAt: -1 });

export type DemoRequestDocument = InferSchemaType<typeof demoRequestSchema>;

export const DemoRequestModel = model('DemoRequest', demoRequestSchema);

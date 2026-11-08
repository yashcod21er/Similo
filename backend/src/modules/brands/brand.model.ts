import { Schema, model, type Types } from 'mongoose';
import { LOGO_CONTENT_TYPES, type LogoContentType } from './logo-sniff.js';

export const BRAND_STATUSES = ['active', 'paused'] as const;
export type BrandStatus = (typeof BRAND_STATUSES)[number];

export const TRADEMARK_OFFICES = ['USPTO', 'EUIPO', 'WIPO', 'IP_INDIA', 'UKIPO', 'OTHER'] as const;
export type TrademarkOffice = (typeof TRADEMARK_OFFICES)[number];

export const TRADEMARK_STATUSES = ['filed', 'registered', 'expired'] as const;
export type TrademarkStatus = (typeof TRADEMARK_STATUSES)[number];

export const SENSITIVITIES = ['low', 'medium', 'high'] as const;
export type Sensitivity = (typeof SENSITIVITIES)[number];

/* ------------------------------------------------------------------- Brand */

/*
 * One document per brand, with its lists embedded (keywords, domains,
 * trademarks, logo details). The limits in brand.service.ts keep each document
 * small. The logo images themselves live in `brand_logos`.
 *
 * `revision` goes up by one on every change. Updates only apply when the
 * revision is the one the service read, so two people saving at the same time
 * can't silently undo each other's change or push a list past its limit.
 */
const domainSchema = new Schema(
  { domain: { type: String, required: true }, addedAt: { type: Date, required: true } },
  { _id: false },
);

const trademarkSchema = new Schema(
  {
    id: { type: String, required: true },
    mark: { type: String, required: true, maxlength: 120 },
    office: { type: String, enum: TRADEMARK_OFFICES, required: true },
    number: { type: String, required: true, maxlength: 40 },
    classes: { type: [Number], default: [] },
    status: { type: String, enum: TRADEMARK_STATUSES, required: true },
    date: { type: String, default: null },
  },
  { _id: false },
);

const logoInfoSchema = new Schema(
  {
    id: { type: String, required: true },
    fileName: { type: String, required: true, maxlength: 100 },
    contentType: { type: String, enum: LOGO_CONTENT_TYPES, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

const monitoringSchema = new Schema(
  {
    domains: { type: Boolean, default: true },
    apps: { type: Boolean, default: false },
    trademarks: { type: Boolean, default: false },
    sensitivity: { type: String, enum: SENSITIVITIES, default: 'medium' },
    emailAlerts: { type: Boolean, default: false },
    updatedAt: { type: Date, default: null },
  },
  { _id: false },
);

const brandSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    /** Lower-cased name, so "Acme" and "ACME" count as the same brand. */
    nameLower: { type: String, required: true },
    description: { type: String, default: '', maxlength: 500 },
    status: { type: String, enum: BRAND_STATUSES, default: 'active' },
    keywords: { type: [String], default: [] },
    domains: { type: [domainSchema], default: [] },
    trademarks: { type: [trademarkSchema], default: [] },
    logos: { type: [logoInfoSchema], default: [] },
    monitoring: { type: monitoringSchema, default: () => ({}) },
    revision: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Brand names are unique per organisation, ignoring case.
brandSchema.index({ organizationId: 1, nameLower: 1 }, { unique: true });
// The brands page lists one organisation's brands, newest first.
brandSchema.index({ organizationId: 1, createdAt: -1 });

export interface BrandDocument {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  nameLower: string;
  description: string;
  status: BrandStatus;
  keywords: string[];
  domains: { domain: string; addedAt: Date }[];
  trademarks: {
    id: string;
    mark: string;
    office: TrademarkOffice;
    number: string;
    classes: number[];
    status: TrademarkStatus;
    date: string | null;
  }[];
  logos: {
    id: string;
    fileName: string;
    contentType: LogoContentType;
    size: number;
    uploadedAt: Date;
  }[];
  monitoring: {
    domains: boolean;
    apps: boolean;
    trademarks: boolean;
    sensitivity: Sensitivity;
    emailAlerts: boolean;
    updatedAt: Date | null;
  };
  revision: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const BrandModel = model('Brand', brandSchema, 'brands');

/* -------------------------------------------------------------- Brand logo */

/**
 * The image bytes of one logo (at most 1 MB, PNG/JPEG/WebP checked by magic
 * bytes). Kept out of the brand document so listing brands never loads images.
 * `organizationId` is stored too, so every query is tenant-scoped and an
 * organisation's data can be deleted with one filter.
 */
const brandLogoSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    fileName: { type: String, required: true, maxlength: 100 },
    contentType: { type: String, enum: LOGO_CONTENT_TYPES, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

brandLogoSchema.index({ organizationId: 1, brandId: 1 });

export const BrandLogoModel = model('BrandLogo', brandLogoSchema, 'brand_logos');

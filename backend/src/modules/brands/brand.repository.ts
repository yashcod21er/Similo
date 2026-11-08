import { toId, type Tx } from '../../db/transaction.js';
import {
  BrandLockModel,
  BrandLogoModel,
  BrandModel,
  type BrandDocument,
  type BrandStatus,
  type Sensitivity,
  type TrademarkOffice,
  type TrademarkStatus,
} from './brand.model.js';
import type { LogoContentType } from './logo-sniff.js';

/*
 * Tenant isolation rule: every method takes the organizationId first and
 * filters by it, so another organisation's brand or logo id simply finds
 * nothing.
 */

/* ------------------------------------------------------------------- Brand */

export interface TrademarkRecord {
  id: string;
  mark: string;
  office: TrademarkOffice;
  number: string;
  classes: number[];
  status: TrademarkStatus;
  /** 'YYYY-MM-DD' or null. */
  date: string | null;
}

export interface LogoInfoRecord {
  id: string;
  fileName: string;
  contentType: LogoContentType;
  size: number;
  uploadedAt: Date;
}

export interface MonitoringRecord {
  domains: boolean;
  apps: boolean;
  trademarks: boolean;
  sensitivity: Sensitivity;
  emailAlerts: boolean;
  updatedAt: Date | null;
}

export interface BrandRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: BrandStatus;
  keywords: string[];
  domains: { domain: string; addedAt: Date }[];
  trademarks: TrademarkRecord[];
  logos: LogoInfoRecord[];
  monitoring: MonitoringRecord;
  revision: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewBrand {
  organizationId: string;
  name: string;
  description: string;
  keywords: string[];
  createdBy: string;
}

/** The fields a brand update may replace. Lists are replaced as a whole. */
export type BrandChanges = Partial<
  Pick<
    BrandRecord,
    | 'name'
    | 'description'
    | 'status'
    | 'keywords'
    | 'domains'
    | 'trademarks'
    | 'logos'
    | 'monitoring'
  >
>;

export const DEFAULT_MONITORING: MonitoringRecord = {
  domains: true,
  apps: false,
  trademarks: false,
  sensitivity: 'medium',
  emailAlerts: false,
  updatedAt: null,
};

/** The key used for "same name, ignoring case". */
export function brandNameKey(name: string): string {
  return name.toLowerCase();
}

export interface BrandRepository {
  /** Throws a duplicate-key error (code 11000) when the name is taken in this organisation. */
  create(data: NewBrand, tx?: Tx): Promise<BrandRecord>;
  /** Newest first. */
  listByOrganization(organizationId: string): Promise<BrandRecord[]>;
  findById(organizationId: string, id: string, tx?: Tx): Promise<BrandRecord | null>;
  findByName(organizationId: string, name: string): Promise<BrandRecord | null>;
  countByOrganization(organizationId: string, tx?: Tx): Promise<number>;
  /**
   * Serialises brand creation per organisation: call first inside the create
   * transaction, so concurrent creates conflict and retry instead of both
   * passing the limit check.
   */
  lockForNewBrand(organizationId: string, tx?: Tx): Promise<void>;
  /**
   * Applies `changes` only if the brand is still at `expectedRevision`, and
   * bumps the revision. Returns null when the brand is gone or changed since
   * it was read. Throws a duplicate-key error when a new name is taken.
   */
  update(
    organizationId: string,
    id: string,
    expectedRevision: number,
    changes: BrandChanges,
    tx?: Tx,
  ): Promise<BrandRecord | null>;
  /** Returns false when there was no such brand in this organisation. */
  delete(organizationId: string, id: string, tx?: Tx): Promise<boolean>;
}

function toBrand(doc: BrandDocument): BrandRecord {
  const monitoring = { ...DEFAULT_MONITORING, ...doc.monitoring };
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    name: doc.name,
    description: doc.description ?? '',
    status: doc.status,
    keywords: [...(doc.keywords ?? [])],
    domains: (doc.domains ?? []).map(({ domain, addedAt }) => ({ domain, addedAt })),
    trademarks: (doc.trademarks ?? []).map((tm) => ({
      id: tm.id,
      mark: tm.mark,
      office: tm.office,
      number: tm.number,
      classes: [...tm.classes],
      status: tm.status,
      date: tm.date ?? null,
    })),
    logos: (doc.logos ?? []).map((logo) => ({
      id: logo.id,
      fileName: logo.fileName,
      contentType: logo.contentType,
      size: logo.size,
      uploadedAt: logo.uploadedAt,
    })),
    monitoring: {
      domains: monitoring.domains,
      apps: monitoring.apps,
      trademarks: monitoring.trademarks,
      sensitivity: monitoring.sensitivity,
      emailAlerts: monitoring.emailAlerts,
      updatedAt: monitoring.updatedAt ?? null,
    },
    revision: doc.revision ?? 0,
    createdBy: toId(doc.createdBy),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const mongoBrandRepository: BrandRepository = {
  async create(data, tx) {
    const [doc] = await BrandModel.create([{ ...data, nameLower: brandNameKey(data.name) }], {
      session: tx ?? null,
    });
    if (!doc) throw new Error('Brand was not created');
    return toBrand(doc.toObject() as BrandDocument);
  },
  async listByOrganization(organizationId) {
    const docs = await BrandModel.find({ organizationId })
      .sort({ createdAt: -1, _id: -1 })
      .lean<BrandDocument[]>();
    return docs.map(toBrand);
  },
  async findById(organizationId, id, tx) {
    const doc = await BrandModel.findOne({ _id: id, organizationId })
      .session(tx ?? null)
      .lean<BrandDocument>();
    return doc ? toBrand(doc) : null;
  },
  async findByName(organizationId, name) {
    const doc = await BrandModel.findOne({
      organizationId,
      nameLower: brandNameKey(name),
    }).lean<BrandDocument>();
    return doc ? toBrand(doc) : null;
  },
  async countByOrganization(organizationId, tx) {
    return BrandModel.countDocuments({ organizationId }, tx ? { session: tx } : {});
  },
  async lockForNewBrand(organizationId, tx) {
    await BrandLockModel.updateOne(
      { _id: organizationId },
      { $inc: { sequence: 1 } },
      { upsert: true, ...(tx ? { session: tx } : {}) },
    );
  },
  async update(organizationId, id, expectedRevision, changes, tx) {
    const set: Record<string, unknown> = { ...changes };
    if (changes.name !== undefined) set.nameLower = brandNameKey(changes.name);
    const doc = await BrandModel.findOneAndUpdate(
      { _id: id, organizationId, revision: expectedRevision },
      { $set: set, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true, session: tx ?? null },
    ).lean<BrandDocument>();
    return doc ? toBrand(doc) : null;
  },
  async delete(organizationId, id, tx) {
    const result = await BrandModel.deleteOne(
      { _id: id, organizationId },
      tx ? { session: tx } : {},
    );
    return result.deletedCount === 1;
  },
};

/* -------------------------------------------------------------- Brand logo */

export interface NewBrandLogo {
  /** Same id as the logo's entry in the brand document. */
  id: string;
  organizationId: string;
  brandId: string;
  fileName: string;
  contentType: LogoContentType;
  size: number;
  data: Buffer;
  uploadedBy: string;
}

export interface BrandLogoFile {
  contentType: LogoContentType;
  data: Buffer;
}

export interface BrandLogoRepository {
  create(data: NewBrandLogo, tx?: Tx): Promise<void>;
  find(organizationId: string, brandId: string, logoId: string): Promise<BrandLogoFile | null>;
  /** Returns false when there was no such logo on this brand in this organisation. */
  delete(organizationId: string, brandId: string, logoId: string, tx?: Tx): Promise<boolean>;
  /** Deletes every logo of a brand; returns how many were removed. */
  deleteByBrand(organizationId: string, brandId: string, tx?: Tx): Promise<number>;
}

export const mongoBrandLogoRepository: BrandLogoRepository = {
  async create({ id, ...data }, tx) {
    await new BrandLogoModel({ _id: id, ...data }).save({ session: tx ?? null });
  },
  async find(organizationId, brandId, logoId) {
    // Not lean: a hydrated document returns `data` as a Node Buffer.
    const doc = await BrandLogoModel.findOne(
      { _id: logoId, brandId, organizationId },
      { contentType: 1, data: 1 },
    );
    if (!doc) return null;
    return { contentType: doc.contentType as LogoContentType, data: Buffer.from(doc.data) };
  },
  async delete(organizationId, brandId, logoId, tx) {
    const result = await BrandLogoModel.deleteOne(
      { _id: logoId, brandId, organizationId },
      tx ? { session: tx } : {},
    );
    return result.deletedCount === 1;
  },
  async deleteByBrand(organizationId, brandId, tx) {
    const result = await BrandLogoModel.deleteMany(
      { brandId, organizationId },
      tx ? { session: tx } : {},
    );
    return result.deletedCount;
  },
};

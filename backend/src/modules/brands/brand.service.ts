import { randomBytes } from 'node:crypto';
import { isDuplicateKeyError, type RunInTransaction, type Tx } from '../../db/transaction.js';
import { AppError, ErrorCode } from '../../lib/errors.js';
import type { AuditAction } from '../audit/audit.repository.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import type { BrandStatus, Sensitivity, TrademarkOffice, TrademarkStatus } from './brand.model.js';
import type {
  BrandChanges,
  BrandLogoFile,
  BrandLogoRepository,
  BrandRecord,
  BrandRepository,
  TrademarkRecord,
} from './brand.repository.js';
import {
  BRAND_LIMITS,
  type AddTrademarkInput,
  type CreateBrandInput,
  type MonitoringInput,
  type UpdateBrandInput,
  type UpdateTrademarkInput,
} from './brand.schemas.js';
import { sanitizeFileName, sniffLogoType, type LogoContentType } from './logo-sniff.js';

/* ------------------------------------------------------------------- DTOs */

export interface BrandSummaryDto {
  id: string;
  name: string;
  description: string;
  status: BrandStatus;
  logoUrl: string | null;
  counts: { keywords: number; domains: number; trademarks: number; logos: number };
  updatedAt: string;
}

export interface TrademarkDto {
  id: string;
  mark: string;
  office: TrademarkOffice;
  number: string;
  classes: number[];
  status: TrademarkStatus;
  date: string | null;
}

export interface LogoDto {
  id: string;
  fileName: string;
  contentType: LogoContentType;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface MonitoringDto {
  domains: boolean;
  apps: boolean;
  trademarks: boolean;
  sensitivity: Sensitivity;
  emailAlerts: boolean;
  updatedAt: string | null;
}

export interface BrandDto {
  id: string;
  name: string;
  description: string;
  status: BrandStatus;
  keywords: string[];
  domains: { domain: string; addedAt: string }[];
  trademarks: TrademarkDto[];
  logos: LogoDto[];
  monitoring: MonitoringDto;
  createdAt: string;
  updatedAt: string;
}

/** An uploaded file as received from the multipart parser. */
export interface UploadedLogo {
  originalName: string | undefined;
  bytes: Buffer;
}

export interface BrandService {
  list(auth: AuthContext): Promise<BrandSummaryDto[]>;
  create(auth: AuthContext, input: CreateBrandInput): Promise<BrandDto>;
  get(auth: AuthContext, brandId: string): Promise<BrandDto>;
  update(auth: AuthContext, brandId: string, input: UpdateBrandInput): Promise<BrandDto>;
  remove(auth: AuthContext, brandId: string): Promise<void>;
  addDomain(auth: AuthContext, brandId: string, domain: string): Promise<BrandDto>;
  removeDomain(auth: AuthContext, brandId: string, domain: string): Promise<BrandDto>;
  addTrademark(auth: AuthContext, brandId: string, input: AddTrademarkInput): Promise<BrandDto>;
  updateTrademark(
    auth: AuthContext,
    brandId: string,
    trademarkId: string,
    input: UpdateTrademarkInput,
  ): Promise<BrandDto>;
  removeTrademark(auth: AuthContext, brandId: string, trademarkId: string): Promise<BrandDto>;
  setMonitoring(auth: AuthContext, brandId: string, input: MonitoringInput): Promise<BrandDto>;
  addLogo(auth: AuthContext, brandId: string, file: UploadedLogo | undefined): Promise<BrandDto>;
  removeLogo(auth: AuthContext, brandId: string, logoId: string): Promise<BrandDto>;
  getLogo(auth: AuthContext, brandId: string, logoId: string): Promise<BrandLogoFile>;
}

interface Dependencies {
  brands: BrandRepository;
  logos: BrandLogoRepository;
  audit: AuditService;
  runInTransaction: RunInTransaction;
  now: () => Date;
  /** New 24-hex-character ids for trademarks and logos. */
  newId?: () => string;
}

/* ----------------------------------------------------------------- Errors */

export const LOGO_MESSAGE = 'Upload a PNG, JPEG or WebP image up to 1 MB.';

/** The 400 every rejected logo upload returns (wrong type, too big, missing, malformed). */
export function invalidLogo(): AppError {
  return new AppError(400, ErrorCode.ValidationError, 'The request contains invalid data', [
    { path: 'logo', message: LOGO_MESSAGE },
  ]);
}

function brandNotFound(): AppError {
  return new AppError(404, ErrorCode.NotFound, 'That brand does not exist.');
}

function conflict(message: string): AppError {
  return new AppError(409, ErrorCode.Conflict, message);
}

function duplicateName(): AppError {
  return conflict('You already have a brand with this name.');
}

/* ---------------------------------------------------------------- Mapping */

export function logoUrl(brandId: string, logoId: string): string {
  return `/api/v1/brands/${brandId}/logos/${logoId}`;
}

function toDto(brand: BrandRecord): BrandDto {
  return {
    id: brand.id,
    name: brand.name,
    description: brand.description,
    status: brand.status,
    keywords: brand.keywords,
    domains: brand.domains.map(({ domain, addedAt }) => ({
      domain,
      addedAt: addedAt.toISOString(),
    })),
    trademarks: brand.trademarks.map((tm) => ({ ...tm, classes: [...tm.classes] })),
    logos: brand.logos.map((logo) => ({
      id: logo.id,
      fileName: logo.fileName,
      contentType: logo.contentType,
      size: logo.size,
      uploadedAt: logo.uploadedAt.toISOString(),
      url: logoUrl(brand.id, logo.id),
    })),
    monitoring: {
      ...brand.monitoring,
      updatedAt: brand.monitoring.updatedAt?.toISOString() ?? null,
    },
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString(),
  };
}

function toSummary(brand: BrandRecord): BrandSummaryDto {
  const firstLogo = brand.logos[0];
  return {
    id: brand.id,
    name: brand.name,
    description: brand.description,
    status: brand.status,
    logoUrl: firstLogo ? logoUrl(brand.id, firstLogo.id) : null,
    counts: {
      keywords: brand.keywords.length,
      domains: brand.domains.length,
      trademarks: brand.trademarks.length,
      logos: brand.logos.length,
    },
    updatedAt: brand.updatedAt.toISOString(),
  };
}

function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function randomObjectIdHex(): string {
  return randomBytes(12).toString('hex');
}

/*
 * Every method starts from `auth.organizationId` — the organisation of the
 * signed-in session — and looks brand ids up *within* it, so another
 * organisation's brand id answers 404, exactly like an id that never existed.
 */
export function createBrandService(deps: Dependencies): BrandService {
  const { brands, logos, audit, runInTransaction, now } = deps;
  const newId = deps.newId ?? randomObjectIdHex;

  async function load(auth: AuthContext, brandId: string, tx?: Tx): Promise<BrandRecord> {
    const brand = await brands.findById(auth.organizationId, brandId, tx);
    if (!brand) throw brandNotFound();
    return brand;
  }

  /**
   * Saves `changes` only if nobody changed the brand since `brand` was read
   * (see `revision` in brand.model.ts).
   */
  async function save(
    auth: AuthContext,
    brand: BrandRecord,
    changes: BrandChanges,
    tx?: Tx,
  ): Promise<BrandRecord> {
    let saved: BrandRecord | null;
    try {
      saved = await brands.update(auth.organizationId, brand.id, brand.revision, changes, tx);
    } catch (err) {
      if (isDuplicateKeyError(err)) throw duplicateName();
      throw err;
    }
    if (saved) return saved;
    if (!(await brands.findById(auth.organizationId, brand.id, tx))) throw brandNotFound();
    throw conflict('Someone else changed this brand at the same moment. Reload and try again.');
  }

  function record(
    auth: AuthContext,
    action: AuditAction,
    brand: { id: string; name: string },
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    return audit.record({
      organizationId: auth.organizationId,
      action,
      actor: { userId: auth.user.id, name: auth.user.name, email: auth.user.email },
      target: { type: 'brand', id: brand.id, label: brand.name },
      metadata: { brandName: brand.name, ...metadata },
      ip: auth.ip,
      userAgent: auth.userAgent,
    });
  }

  async function assertNameFree(auth: AuthContext, name: string, exceptId?: string) {
    const existing = await brands.findByName(auth.organizationId, name);
    if (existing && existing.id !== exceptId) throw duplicateName();
  }

  return {
    async list(auth) {
      return (await brands.listByOrganization(auth.organizationId)).map(toSummary);
    },

    async create(auth, input) {
      const count = await brands.countByOrganization(auth.organizationId);
      if (count >= BRAND_LIMITS.brandsPerOrganization) {
        throw conflict(
          `Your organisation can have up to ${BRAND_LIMITS.brandsPerOrganization} brands.`,
        );
      }
      await assertNameFree(auth, input.name);

      let brand: BrandRecord;
      try {
        brand = await brands.create({
          organizationId: auth.organizationId,
          name: input.name,
          description: input.description ?? '',
          keywords: input.keywords ?? [],
          createdBy: auth.user.id,
        });
      } catch (err) {
        // Two people creating the same name at the same moment: the unique index decides.
        if (isDuplicateKeyError(err)) throw duplicateName();
        throw err;
      }
      await record(auth, 'brand.created', brand);
      return toDto(brand);
    },

    async get(auth, brandId) {
      return toDto(await load(auth, brandId));
    },

    async update(auth, brandId, input) {
      const brand = await load(auth, brandId);
      const changes: BrandChanges = {};
      if (input.name !== undefined && input.name !== brand.name) changes.name = input.name;
      if (input.description !== undefined && input.description !== brand.description) {
        changes.description = input.description;
      }
      if (input.keywords !== undefined && !sameList(input.keywords, brand.keywords)) {
        changes.keywords = input.keywords;
      }
      if (input.status !== undefined && input.status !== brand.status) {
        changes.status = input.status;
      }

      const fields = Object.keys(changes);
      if (fields.length === 0) return toDto(brand);
      if (changes.name !== undefined) await assertNameFree(auth, changes.name, brand.id);

      const saved = await save(auth, brand, changes);
      await record(auth, 'brand.updated', saved, {
        fields,
        ...(changes.name !== undefined && { previousName: brand.name }),
        ...(changes.status !== undefined && { status: changes.status }),
      });
      return toDto(saved);
    },

    async remove(auth, brandId) {
      const brand = await load(auth, brandId);
      // The brand and its logo images go together, or not at all.
      await runInTransaction(async (tx) => {
        if (!(await brands.delete(auth.organizationId, brand.id, tx))) throw brandNotFound();
        await logos.deleteByBrand(auth.organizationId, brand.id, tx);
      });
      await record(auth, 'brand.deleted', brand, {
        domains: brand.domains.length,
        trademarks: brand.trademarks.length,
        logos: brand.logos.length,
      });
    },

    async addDomain(auth, brandId, domain) {
      const brand = await load(auth, brandId);
      if (brand.domains.some((entry) => entry.domain === domain)) {
        throw conflict('This domain is already on this brand.');
      }
      if (brand.domains.length >= BRAND_LIMITS.domains) {
        throw conflict(`A brand can have up to ${BRAND_LIMITS.domains} domains.`);
      }
      const saved = await save(auth, brand, {
        domains: [...brand.domains, { domain, addedAt: now() }],
      });
      await record(auth, 'brand.domain_added', saved, { domain });
      return toDto(saved);
    },

    async removeDomain(auth, brandId, domain) {
      const brand = await load(auth, brandId);
      if (!brand.domains.some((entry) => entry.domain === domain)) {
        throw new AppError(404, ErrorCode.NotFound, 'That domain is not on this brand.');
      }
      const saved = await save(auth, brand, {
        domains: brand.domains.filter((entry) => entry.domain !== domain),
      });
      await record(auth, 'brand.domain_removed', saved, { domain });
      return toDto(saved);
    },

    async addTrademark(auth, brandId, input) {
      const brand = await load(auth, brandId);
      if (brand.trademarks.length >= BRAND_LIMITS.trademarks) {
        throw conflict(`A brand can have up to ${BRAND_LIMITS.trademarks} trademarks.`);
      }
      const trademark: TrademarkRecord = { id: newId(), ...input };
      const saved = await save(auth, brand, { trademarks: [...brand.trademarks, trademark] });
      await record(auth, 'brand.trademark_added', saved, {
        mark: trademark.mark,
        office: trademark.office,
        number: trademark.number,
      });
      return toDto(saved);
    },

    async updateTrademark(auth, brandId, trademarkId, input) {
      const brand = await load(auth, brandId);
      const current = brand.trademarks.find((tm) => tm.id === trademarkId);
      if (!current)
        throw new AppError(404, ErrorCode.NotFound, 'That trademark is not on this brand.');

      const next: TrademarkRecord = { ...current };
      const fields: string[] = [];
      for (const key of ['mark', 'office', 'number', 'status', 'date'] as const) {
        const value = input[key];
        if (value !== undefined && value !== current[key]) {
          Object.assign(next, { [key]: value });
          fields.push(key);
        }
      }
      if (input.classes !== undefined && !sameList(input.classes, current.classes)) {
        next.classes = input.classes;
        fields.push('classes');
      }
      if (fields.length === 0) return toDto(brand);

      const saved = await save(auth, brand, {
        trademarks: brand.trademarks.map((tm) => (tm.id === trademarkId ? next : tm)),
      });
      await record(auth, 'brand.trademark_updated', saved, { mark: next.mark, fields });
      return toDto(saved);
    },

    async removeTrademark(auth, brandId, trademarkId) {
      const brand = await load(auth, brandId);
      const current = brand.trademarks.find((tm) => tm.id === trademarkId);
      if (!current)
        throw new AppError(404, ErrorCode.NotFound, 'That trademark is not on this brand.');
      const saved = await save(auth, brand, {
        trademarks: brand.trademarks.filter((tm) => tm.id !== trademarkId),
      });
      await record(auth, 'brand.trademark_removed', saved, { mark: current.mark });
      return toDto(saved);
    },

    async setMonitoring(auth, brandId, input) {
      const brand = await load(auth, brandId);
      const saved = await save(auth, brand, { monitoring: { ...input, updatedAt: now() } });
      await record(auth, 'brand.monitoring_updated', saved, { ...input });
      return toDto(saved);
    },

    async addLogo(auth, brandId, file) {
      const brand = await load(auth, brandId);
      if (!file || file.bytes.length === 0 || file.bytes.length > BRAND_LIMITS.logoBytes) {
        throw invalidLogo();
      }
      const contentType = sniffLogoType(file.bytes);
      if (!contentType) throw invalidLogo();
      if (brand.logos.length >= BRAND_LIMITS.logos) {
        throw conflict(`A brand can have up to ${BRAND_LIMITS.logos} logos.`);
      }

      const info = {
        id: newId(),
        fileName: sanitizeFileName(file.originalName),
        contentType,
        size: file.bytes.length,
        uploadedAt: now(),
      };
      // The brand's logo list and the image bytes are saved together, or not at all.
      const saved = await runInTransaction(async (tx) => {
        const updated = await save(auth, brand, { logos: [...brand.logos, info] }, tx);
        await logos.create(
          {
            id: info.id,
            organizationId: auth.organizationId,
            brandId: brand.id,
            fileName: info.fileName,
            contentType,
            size: info.size,
            data: file.bytes,
            uploadedBy: auth.user.id,
          },
          tx,
        );
        return updated;
      });
      await record(auth, 'brand.logo_uploaded', saved, {
        fileName: info.fileName,
        contentType,
        size: info.size,
      });
      return toDto(saved);
    },

    async removeLogo(auth, brandId, logoId) {
      const brand = await load(auth, brandId);
      const info = brand.logos.find((logo) => logo.id === logoId);
      if (!info) throw new AppError(404, ErrorCode.NotFound, 'That logo is not on this brand.');
      const saved = await runInTransaction(async (tx) => {
        const updated = await save(
          auth,
          brand,
          { logos: brand.logos.filter((logo) => logo.id !== logoId) },
          tx,
        );
        await logos.delete(auth.organizationId, brand.id, logoId, tx);
        return updated;
      });
      await record(auth, 'brand.logo_removed', saved, { fileName: info.fileName });
      return toDto(saved);
    },

    async getLogo(auth, brandId, logoId) {
      const file = await logos.find(auth.organizationId, brandId, logoId);
      if (!file) throw new AppError(404, ErrorCode.NotFound, 'That logo does not exist.');
      return file;
    },
  };
}

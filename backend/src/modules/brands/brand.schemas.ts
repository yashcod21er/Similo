import { z } from 'zod';
import { objectIdSchema } from '../../lib/validation.js';
import {
  BRAND_STATUSES,
  SENSITIVITIES,
  TRADEMARK_OFFICES,
  TRADEMARK_STATUSES,
} from './brand.model.js';
import { normalizeDomain } from './domain-name.js';

/** Size limits, enforced by these schemas (lists sent whole) or the service (items added one by one). */
export const BRAND_LIMITS = {
  brandsPerOrganization: 50,
  keywords: 50,
  domains: 50,
  trademarks: 100,
  logos: 5,
  logoBytes: 1_048_576,
} as const;

export const DOMAIN_MESSAGE = 'Enter a domain like example.com';

/* --------------------------------------------------------------- Brand */

const brandNameSchema = z
  .string({ error: 'Enter a brand name' })
  .transform((value) => value.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(1, { error: 'Enter a brand name' })
      .max(80, { error: 'Use at most 80 characters' }),
  );

const descriptionSchema = z
  .string({ error: 'Enter a description' })
  .trim()
  .max(500, { error: 'Use at most 500 characters' });

const keywordSchema = z
  .string({ error: 'Enter a keyword' })
  .transform((value) => value.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(1, { error: "Keywords can't be empty" })
      .max(60, { error: 'Keep each keyword to 60 characters or fewer' }),
  );

/** Up to 50 keywords; repeats (ignoring case) are dropped, keeping the first. */
const keywordsSchema = z
  .array(keywordSchema, { error: 'Keywords must be a list' })
  .max(BRAND_LIMITS.keywords, { error: `Add at most ${BRAND_LIMITS.keywords} keywords` })
  .transform((keywords) => {
    const seen = new Set<string>();
    return keywords.filter((keyword) => {
      const key = keyword.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

const statusSchema = z.enum(BRAND_STATUSES, { error: 'Choose active or paused' });

export const createBrandSchema = z.object({
  name: brandNameSchema,
  description: descriptionSchema.optional(),
  keywords: keywordsSchema.optional(),
});
export type CreateBrandInput = z.infer<typeof createBrandSchema>;

export const updateBrandSchema = z
  .object({
    name: brandNameSchema.optional(),
    description: descriptionSchema.optional(),
    keywords: keywordsSchema.optional(),
    status: statusSchema.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: 'Change at least one field',
  });
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

/* -------------------------------------------------------------- Domains */

/** Normalises the domain (see domain-name.ts); invalid input fails with one plain message. */
export const domainSchema = z.string({ error: DOMAIN_MESSAGE }).transform((value, ctx) => {
  const domain = normalizeDomain(value);
  if (!domain) {
    ctx.addIssue({ code: 'custom', message: DOMAIN_MESSAGE });
    return z.NEVER;
  }
  return domain;
});

export const addDomainSchema = z.object({ domain: domainSchema });

/* ----------------------------------------------------------- Trademarks */

const trademarkFields = {
  mark: z
    .string({ error: 'Enter the trademark' })
    .trim()
    .min(1, { error: 'Enter the trademark' })
    .max(120, { error: 'Use at most 120 characters' }),
  office: z.enum(TRADEMARK_OFFICES, { error: 'Choose a trademark office' }),
  number: z
    .string({ error: 'Enter the registration or application number' })
    .trim()
    .min(1, { error: 'Enter the registration or application number' })
    .max(40, { error: 'Use at most 40 characters' }),
  /** Nice classes 1–45; repeats removed and sorted. */
  classes: z
    .array(
      z
        .number({ error: 'Nice classes are whole numbers from 1 to 45' })
        .int({ error: 'Nice classes are whole numbers from 1 to 45' })
        .min(1, { error: 'Nice classes are whole numbers from 1 to 45' })
        .max(45, { error: 'Nice classes are whole numbers from 1 to 45' }),
      { error: 'Add at least one Nice class' },
    )
    .min(1, { error: 'Add at least one Nice class' })
    .max(45, { error: 'There are only 45 Nice classes' })
    .transform((classes) => [...new Set(classes)].sort((a, b) => a - b)),
  status: z.enum(TRADEMARK_STATUSES, { error: 'Choose filed, registered or expired' }),
  date: z
    .string({ error: 'Enter a date like 2024-05-31' })
    .refine(isCalendarDate, { error: 'Enter a date like 2024-05-31' })
    .nullable(),
};

/** True for a real 'YYYY-MM-DD' date (so 2024-02-30 is refused). */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const addTrademarkSchema = z.object({
  ...trademarkFields,
  date: trademarkFields.date.optional().transform((value) => value ?? null),
});
export type AddTrademarkInput = z.infer<typeof addTrademarkSchema>;

export const updateTrademarkSchema = z
  .object({
    mark: trademarkFields.mark.optional(),
    office: trademarkFields.office.optional(),
    number: trademarkFields.number.optional(),
    classes: trademarkFields.classes.optional(),
    status: trademarkFields.status.optional(),
    date: trademarkFields.date.optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    error: 'Change at least one field',
  });
export type UpdateTrademarkInput = z.infer<typeof updateTrademarkSchema>;

/* ----------------------------------------------------------- Monitoring */

const onOff = z.boolean({ error: 'Choose on or off' });

export const monitoringSchema = z.object({
  domains: onOff,
  apps: onOff,
  trademarks: onOff,
  sensitivity: z.enum(SENSITIVITIES, { error: 'Choose low, medium or high' }),
  emailAlerts: onOff,
});
export type MonitoringInput = z.infer<typeof monitoringSchema>;

/* -------------------------------------------------------------- Params */

export const brandParamsSchema = z.object({ brandId: objectIdSchema });
export const domainParamsSchema = z.object({ brandId: objectIdSchema, domain: domainSchema });
export const trademarkParamsSchema = z.object({
  brandId: objectIdSchema,
  trademarkId: objectIdSchema,
});
export const logoParamsSchema = z.object({ brandId: objectIdSchema, logoId: objectIdSchema });

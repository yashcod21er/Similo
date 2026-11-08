import { ApiError } from '@/lib/api-client';
import type { Sensitivity, TrademarkOffice, TrademarkStatus } from './api';

/* Small, pure helpers and wording for the brand screens. The API checks everything again. */

export const MAX_BRANDS = 50;
export const MAX_KEYWORDS = 50;
export const MAX_DOMAINS = 50;
export const MAX_TRADEMARKS = 100;
export const MAX_LOGOS = 5;

/* ------------------------------------------------------------------- Logos */

export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const LOGO_MAX_BYTES = 1_048_576;
/** Same wording as the API's error, so people see one message wherever it is caught. */
export const LOGO_ERROR = 'Upload a PNG, JPEG or WebP image up to 1 MB.';
export const LOGO_LIMIT_ERROR = 'A brand can have up to 5 logos.';

/** Quick check before uploading. The API still decides from the file's real contents. */
export function checkLogoFile(file: { type: string; size: number }): string | null {
  if (!(LOGO_TYPES as readonly string[]).includes(file.type)) return LOGO_ERROR;
  if (file.size > LOGO_MAX_BYTES || file.size === 0) return LOGO_ERROR;
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ----------------------------------------------------------------- Domains */

export const DOMAIN_ERROR = 'Enter a domain like example.com';

const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,}|xn--[a-z0-9-]{2,})$/;

/**
 * What the API will probably save for what was typed (a live hint, not the real check):
 * lowercase, no `https://`, path, query, port or leading `www.`; accents become punycode.
 */
export function previewDomain(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let host: string;
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`).hostname;
  } catch {
    return null;
  }
  host = host
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^www\./, '');
  return host.length <= 253 && HOSTNAME.test(host) ? host : null;
}

/* ---------------------------------------------------------------- Keywords */

/** Validates one keyword for the chip box; returns the cleaned value or a plain error. */
export function parseKeyword(
  raw: string,
  existing: readonly string[],
): { value: string } | { error: string } {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (value.length > 60) return { error: 'Keep each keyword to 60 characters or fewer.' };
  if (existing.some((item) => item.toLowerCase() === value.toLowerCase())) {
    return { error: `“${value}” is already in the list.` };
  }
  if (existing.length >= MAX_KEYWORDS) return { error: 'You can add up to 50 keywords.' };
  return { value };
}

/* ------------------------------------------------------------- Trademarks */

export const OFFICE_OPTIONS: { value: TrademarkOffice; label: string }[] = [
  { value: 'USPTO', label: 'United States (USPTO)' },
  { value: 'EUIPO', label: 'European Union (EUIPO)' },
  { value: 'WIPO', label: 'International (WIPO)' },
  { value: 'IP_INDIA', label: 'India (IP India)' },
  { value: 'UKIPO', label: 'United Kingdom (UKIPO)' },
  { value: 'OTHER', label: 'Another trademark office' },
];

export const officeLabel = (office: TrademarkOffice) =>
  OFFICE_OPTIONS.find((option) => option.value === office)?.label ?? office;

export const TRADEMARK_STATUS_OPTIONS: { value: TrademarkStatus; label: string }[] = [
  { value: 'filed', label: 'Filed' },
  { value: 'registered', label: 'Registered' },
  { value: 'expired', label: 'Expired' },
];

export const trademarkStatusLabel = (status: TrademarkStatus) =>
  TRADEMARK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

/** Validates one Nice class (a whole number from 1 to 45) for the chip box. */
export function parseNiceClass(
  raw: string,
  existing: readonly string[],
): { value: string } | { error: string } {
  const text = raw.trim();
  if (!/^\d{1,2}$/.test(text)) return { error: 'Enter a class number from 1 to 45.' };
  const value = Number(text);
  if (value < 1 || value > 45) return { error: 'Enter a class number from 1 to 45.' };
  if (existing.includes(String(value))) return { error: `Class ${value} is already added.` };
  return { value: String(value) };
}

/** Turns the chip values into the sorted numbers the API expects. */
export const toClassNumbers = (values: readonly string[]) =>
  values.map(Number).sort((a, b) => a - b);

/* -------------------------------------------------------------- Monitoring */

export const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string; description: string }[] = [
  {
    value: 'low',
    label: 'Low',
    description: 'Only close matches. Fewer alerts, but you may miss some weaker lookalikes.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'A sensible balance between missed copycats and false alarms.',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Also loose matches. More alerts, and more of them will turn out harmless.',
  },
];

/* ------------------------------------------------------------------ Errors */

/** True when the API says this brand doesn't exist (or isn't in your organisation). */
export function isBrandNotFound(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 404 || error.code === 'NOT_FOUND' || error.code === 'VALIDATION_ERROR')
  );
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

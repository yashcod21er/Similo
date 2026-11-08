import { z } from 'zod';

/** A MongoDB ObjectId in its 24-character hex form, e.g. in a URL parameter. */
export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, { error: 'Must be a valid ID' })
  .transform((value) => value.toLowerCase());

/** Normalised email: trimmed and lower-cased, so "Ana@X.com" and "ana@x.com" are one account. */
export const emailSchema = z
  .string({ error: 'Enter your email address' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address' }).max(254));

export const personNameSchema = z
  .string({ error: 'Enter your name' })
  .trim()
  .min(2, { error: 'Enter your name' })
  .max(80, { error: 'Use at most 80 characters' });

export const organizationNameSchema = z
  .string({ error: 'Enter your organisation name' })
  .trim()
  .min(2, { error: 'Enter your organisation name' })
  .max(100, { error: 'Use at most 100 characters' });

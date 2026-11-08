import { z } from 'zod';

/**
 * Client-side copy of the API's validation rules
 * (apps/api/src/modules/demo-requests/demo-request.schemas.ts).
 * The browser validates for fast feedback; the API validates again because
 * client-side checks can always be bypassed.
 */

export const INTEREST_OPTIONS = [
  { value: 'domain', label: 'Domain intelligence' },
  { value: 'app', label: 'App intelligence' },
  { value: 'trademark', label: 'Trademark intelligence' },
  { value: 'investigation', label: 'Investigations & evidence' },
] as const;

export const ROLE_OPTIONS = [
  { value: 'legal', label: 'Legal / IP counsel' },
  { value: 'security', label: 'Security / threat intelligence' },
  { value: 'brand', label: 'Brand / marketing' },
  { value: 'executive', label: 'Executive' },
  { value: 'other', label: 'Other' },
] as const;

type Interest = (typeof INTEREST_OPTIONS)[number]['value'];
type Role = (typeof ROLE_OPTIONS)[number]['value'];

export const demoRequestSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  workEmail: z.string().trim().pipe(z.email('Enter a valid email address')),
  company: z.string().trim().min(2, 'Enter your organisation').max(120),
  role: z.enum(ROLE_OPTIONS.map((option) => option.value) as [Role, ...Role[]], {
    error: 'Choose your role',
  }),
  interests: z
    .array(z.enum(INTEREST_OPTIONS.map((option) => option.value) as [Interest, ...Interest[]]))
    .min(1, 'Choose at least one area'),
  message: z.string().trim().max(2000, 'Keep your message under 2000 characters'),
  consent: z.literal(true, { error: 'Please agree so we can contact you' }),
  /** Honeypot — hidden from people; bots fill it in. */
  website: z.string(),
});

export type DemoRequestForm = z.input<typeof demoRequestSchema>;

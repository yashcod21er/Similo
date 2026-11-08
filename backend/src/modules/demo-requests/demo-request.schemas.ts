import { z } from 'zod';

export const DEMO_INTERESTS = ['domain', 'app', 'trademark', 'investigation'] as const;
export const DEMO_ROLES = ['legal', 'security', 'brand', 'executive', 'other'] as const;

/**
 * Body of POST /api/v1/demo-requests.
 *
 * `website` is a honeypot: the field is hidden from people, so only bots fill it in.
 * It is accepted here (so bots get no hint) and checked in the service.
 */
export const createDemoRequestSchema = z.object({
  // `error` on the type covers missing/wrong-type values; `.min()` messages cover short ones.
  fullName: z
    .string({ error: 'Enter your full name' })
    .trim()
    .min(2, 'Enter your full name')
    .max(100),
  workEmail: z
    .email({ error: 'Enter a valid email address' })
    .max(254)
    .transform((value) => value.toLowerCase()),
  company: z
    .string({ error: 'Enter your organisation' })
    .trim()
    .min(2, 'Enter your organisation')
    .max(120),
  role: z.enum(DEMO_ROLES, { error: 'Choose your role' }),
  interests: z
    .array(z.enum(DEMO_INTERESTS), { error: 'Choose at least one area' })
    .min(1, 'Choose at least one area')
    .max(DEMO_INTERESTS.length)
    .transform((values) => [...new Set(values)]),
  message: z.string().trim().max(2000).default(''),
  consent: z.literal(true, { error: 'Consent is required to contact you' }),
  website: z.string().max(500).optional(),
});

export type CreateDemoRequestInput = z.infer<typeof createDemoRequestSchema>;

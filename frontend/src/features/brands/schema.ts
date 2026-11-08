import { z } from 'zod';
import type { NewBrand } from './api';

/* Form rules for the brand screens. They mirror the API's limits and wording, which has the last word. */

export const brandFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Enter a brand name' })
    .max(80, { error: 'Use at most 80 characters' }),
  description: z.string().trim().max(500, { error: 'Use at most 500 characters' }),
  keywords: z.array(z.string()),
});
export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const toNewBrand = (values: BrandFormValues): NewBrand => ({
  name: values.name,
  description: values.description,
  keywords: values.keywords,
});

const markField = z
  .string()
  .trim()
  .min(1, { error: 'Enter the trademark' })
  .max(120, { error: 'Use at most 120 characters' });

export const trademarkFormSchema = z.object({
  mark: markField,
  office: z.enum(['USPTO', 'EUIPO', 'WIPO', 'IP_INDIA', 'UKIPO', 'OTHER']),
  number: z
    .string()
    .trim()
    .min(1, { error: 'Enter the registration or application number' })
    .max(40, { error: 'Use at most 40 characters' }),
  /** Nice classes as typed chips ("9", "35"); turned into numbers on save. */
  classes: z.array(z.string()).min(1, { error: 'Add at least one Nice class' }),
  status: z.enum(['filed', 'registered', 'expired']),
  date: z.union([
    z.literal(''),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Enter a valid date' }),
  ]),
});
export type TrademarkFormValues = z.infer<typeof trademarkFormSchema>;

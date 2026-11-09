import { z } from 'zod';
import { FINDING_STATUSES } from './finding.model.js';

export const findingIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid finding id');

export const findingListSchema = z.object({
  status: z.enum(FINDING_STATUSES).optional(),
  brandId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  before: z.string().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

export const updateFindingSchema = z.object({ status: z.enum(FINDING_STATUSES) }).strict();
export type UpdateFindingInput = z.infer<typeof updateFindingSchema>;

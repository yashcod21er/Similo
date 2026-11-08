import { z } from 'zod';
import { emailSchema, objectIdSchema, organizationNameSchema } from '../../lib/validation.js';
import { ROLES } from './roles.js';

const roleSchema = z.enum(ROLES, { error: 'Choose a role' });

export const renameOrganizationSchema = z.object({ name: organizationNameSchema });

export const changeRoleSchema = z.object({ role: roleSchema });

export const createInviteSchema = z.object({ email: emailSchema, role: roleSchema });
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const memberParamsSchema = z.object({ userId: objectIdSchema });
export const inviteParamsSchema = z.object({ inviteId: objectIdSchema });

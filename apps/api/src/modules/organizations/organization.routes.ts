import { Router } from 'express';
import { getAuth, requirePermission } from '../../middleware/auth.js';
import { sendSuccess } from '../../lib/http-response.js';
import {
  changeRoleSchema,
  createInviteSchema,
  inviteParamsSchema,
  memberParamsSchema,
  renameOrganizationSchema,
} from './organization.schemas.js';
import type { OrganizationService } from './organization.service.js';

/**
 * /api/v1/organization — the signed-in user's own organisation.
 * Mounted behind `requireAuth`; each route also checks a permission from roles.ts.
 */
export function createOrganizationRouter(service: OrganizationService): Router {
  const router = Router();

  router.get('/', requirePermission('organization:read'), async (_req, res) => {
    sendSuccess(res, await service.get(getAuth(res)));
  });

  router.patch('/', requirePermission('organization:update'), async (req, res) => {
    const { name } = renameOrganizationSchema.parse(req.body);
    sendSuccess(res, await service.rename(getAuth(res), name));
  });

  router.get('/members', requirePermission('members:read'), async (_req, res) => {
    sendSuccess(res, await service.listMembers(getAuth(res)));
  });

  router.patch('/members/:userId', requirePermission('members:manage'), async (req, res) => {
    const { userId } = memberParamsSchema.parse(req.params);
    const { role } = changeRoleSchema.parse(req.body);
    sendSuccess(res, await service.changeRole(getAuth(res), userId, role));
  });

  router.delete('/members/:userId', requirePermission('members:manage'), async (req, res) => {
    const { userId } = memberParamsSchema.parse(req.params);
    await service.removeMember(getAuth(res), userId);
    sendSuccess(res, { removed: true });
  });

  router.get('/invites', requirePermission('members:manage'), async (_req, res) => {
    sendSuccess(res, await service.listInvites(getAuth(res)));
  });

  router.post('/invites', requirePermission('members:manage'), async (req, res) => {
    const input = createInviteSchema.parse(req.body);
    sendSuccess(res, await service.createInvite(getAuth(res), input), 201);
  });

  router.delete('/invites/:inviteId', requirePermission('members:manage'), async (req, res) => {
    const { inviteId } = inviteParamsSchema.parse(req.params);
    await service.revokeInvite(getAuth(res), inviteId);
    sendSuccess(res, { revoked: true });
  });

  return router;
}

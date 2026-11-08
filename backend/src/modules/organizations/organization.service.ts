import { AppError, ErrorCode } from '../../lib/errors.js';
import { generateToken, hashToken } from '../../lib/tokens.js';
import type { AuditService } from '../audit/audit.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import type { SessionService } from '../sessions/session.service.js';
import type { UserRepository } from '../users/user.repository.js';
import type { CreateInviteInput } from './organization.schemas.js';
import type {
  InviteRecord,
  InviteRepository,
  MembershipRepository,
  OrganizationRepository,
} from './organization.repository.js';
import { ROLE_LABELS, type Role } from './roles.js';

/** Invitation links stop working after 7 days. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
}

export interface MemberDto {
  userId: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  joinedAt: string;
  isYou: boolean;
}

export interface InviteDto {
  id: string;
  email: string;
  role: Role;
  roleLabel: string;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface OrganizationService {
  get(auth: AuthContext): Promise<OrganizationDto>;
  rename(auth: AuthContext, name: string): Promise<OrganizationDto>;
  listMembers(auth: AuthContext): Promise<MemberDto[]>;
  changeRole(auth: AuthContext, userId: string, role: Role): Promise<MemberDto>;
  removeMember(auth: AuthContext, userId: string): Promise<void>;
  listInvites(auth: AuthContext): Promise<InviteDto[]>;
  /** Returns the link once; only its hash is stored, so it can't be shown again. */
  createInvite(
    auth: AuthContext,
    input: CreateInviteInput,
  ): Promise<{ invite: InviteDto; inviteUrl: string }>;
  revokeInvite(auth: AuthContext, inviteId: string): Promise<void>;
}

interface Dependencies {
  organizations: OrganizationRepository;
  memberships: MembershipRepository;
  invites: InviteRepository;
  users: UserRepository;
  sessions: SessionService;
  audit: AuditService;
  appUrl: string;
  now: () => Date;
}

function forbidden(message: string): AppError {
  return new AppError(403, ErrorCode.Forbidden, message);
}

function memberNotFound(): AppError {
  return new AppError(404, ErrorCode.NotFound, 'That person is not a member of your organisation.');
}

function actorOf(auth: AuthContext) {
  return { userId: auth.user.id, name: auth.user.name, email: auth.user.email };
}

/*
 * Every method starts from `auth.organizationId` — the organisation of the
 * signed-in session — so it can only ever see or change its own organisation's
 * members and invites. IDs from the URL are always looked up *within* it.
 */
export function createOrganizationService(deps: Dependencies): OrganizationService {
  const { organizations, memberships, invites, users, sessions, audit, appUrl, now } = deps;

  const inviteDto = (invite: InviteRecord, inviterName: string | null): InviteDto => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    roleLabel: ROLE_LABELS[invite.role],
    invitedBy: inviterName,
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
  });

  async function get(auth: AuthContext): Promise<OrganizationDto> {
    const [organization, members] = await Promise.all([
      organizations.findById(auth.organizationId),
      memberships.listByOrganization(auth.organizationId),
    ]);
    if (!organization) throw new AppError(404, ErrorCode.NotFound, 'Organisation not found.');
    return {
      id: organization.id,
      name: organization.name,
      createdAt: organization.createdAt.toISOString(),
      memberCount: members.length,
    };
  }

  async function listMembers(auth: AuthContext): Promise<MemberDto[]> {
    const rows = await memberships.listByOrganization(auth.organizationId);
    const people = await users.findByIds(rows.map((row) => row.userId));
    const byId = new Map(people.map((person) => [person.id, person]));
    return rows.flatMap((row) => {
      const person = byId.get(row.userId);
      if (!person) return [];
      return [
        {
          userId: row.userId,
          name: person.name,
          email: person.email,
          role: row.role,
          roleLabel: ROLE_LABELS[row.role],
          joinedAt: row.createdAt.toISOString(),
          isYou: row.userId === auth.user.id,
        },
      ];
    });
  }

  /** Shared rules for changing or removing someone else's membership. */
  async function loadTarget(auth: AuthContext, userId: string, action: 'change' | 'remove') {
    const target = await memberships.find(auth.organizationId, userId);
    if (!target) throw memberNotFound();
    if (target.userId === auth.user.id) {
      throw new AppError(
        400,
        ErrorCode.BadRequest,
        action === 'change'
          ? "You can't change your own role. Ask another Owner or Admin."
          : "You can't remove yourself from the organisation.",
      );
    }
    if (target.role === 'owner' && auth.role !== 'owner') {
      throw forbidden('Only an Owner can change or remove another Owner.');
    }
    const person = await users.findById(target.userId);
    return { target, label: person?.email ?? target.userId };
  }

  return {
    get,

    async rename(auth, name) {
      const before = await get(auth);
      if (before.name !== name) {
        await organizations.rename(auth.organizationId, name);
        await audit.record({
          organizationId: auth.organizationId,
          action: 'organization.renamed',
          actor: actorOf(auth),
          target: { type: 'organization', id: auth.organizationId, label: name },
          metadata: { from: before.name, to: name },
          ip: auth.ip,
          userAgent: auth.userAgent,
        });
      }
      return { ...before, name };
    },

    listMembers,

    async changeRole(auth, userId, role) {
      const { target, label } = await loadTarget(auth, userId, 'change');
      if (role === 'owner' && auth.role !== 'owner') {
        throw forbidden('Only an Owner can make someone an Owner.');
      }
      if (target.role === 'owner' && role !== 'owner') {
        // Never leave an organisation without an Owner.
        const owners = await memberships.countByRole(auth.organizationId, 'owner');
        if (owners <= 1) throw forbidden('An organisation must always have at least one Owner.');
      }

      if (target.role !== role) {
        await memberships.updateRole(auth.organizationId, userId, role);
        await audit.record({
          organizationId: auth.organizationId,
          action: 'member.role_changed',
          actor: actorOf(auth),
          target: { type: 'user', id: userId, label },
          metadata: { from: target.role, to: role },
          ip: auth.ip,
          userAgent: auth.userAgent,
        });
      }

      const member = (await listMembers(auth)).find((row) => row.userId === userId);
      if (!member) throw memberNotFound();
      return member;
    },

    async removeMember(auth, userId) {
      const { target, label } = await loadTarget(auth, userId, 'remove');
      if (target.role === 'owner') {
        const owners = await memberships.countByRole(auth.organizationId, 'owner');
        if (owners <= 1) throw forbidden('An organisation must always have at least one Owner.');
      }

      const removed = await memberships.remove(auth.organizationId, userId);
      if (!removed) throw memberNotFound();
      // Signed out immediately, everywhere, for this organisation.
      await sessions.revokeMember(userId, auth.organizationId);
      await audit.record({
        organizationId: auth.organizationId,
        action: 'member.removed',
        actor: actorOf(auth),
        target: { type: 'user', id: userId, label },
        metadata: { role: target.role },
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
    },

    async listInvites(auth) {
      const rows = (await invites.listByOrganization(auth.organizationId)).filter(
        (invite) => invite.expiresAt > now(),
      );
      const inviters = await users.findByIds([...new Set(rows.map((row) => row.invitedBy))]);
      const names = new Map(inviters.map((person) => [person.id, person.name]));
      return rows.map((row) => inviteDto(row, names.get(row.invitedBy) ?? null));
    },

    async createInvite(auth, { email, role }) {
      if (role === 'owner' && auth.role !== 'owner') {
        throw forbidden('Only an Owner can invite another Owner.');
      }
      const existing = await users.findByEmail(email);
      if (existing) {
        const alreadyMember = await memberships.find(auth.organizationId, existing.id);
        throw new AppError(
          409,
          ErrorCode.Conflict,
          alreadyMember
            ? 'This person is already a member of your organisation.'
            : 'This email already has a Similo account. Joining a second organisation is not supported yet.',
        );
      }

      const token = generateToken();
      const invite = await invites.upsert({
        organizationId: auth.organizationId,
        email,
        role,
        tokenHash: hashToken(token),
        invitedBy: auth.user.id,
        expiresAt: new Date(now().getTime() + INVITE_TTL_MS),
      });
      await audit.record({
        organizationId: auth.organizationId,
        action: 'member.invited',
        actor: actorOf(auth),
        target: { type: 'invite', id: invite.id, label: email },
        metadata: { role },
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
      return {
        invite: inviteDto(invite, auth.user.name),
        inviteUrl: `${appUrl}/invite/${token}`,
      };
    },

    async revokeInvite(auth, inviteId) {
      const invite = (await invites.listByOrganization(auth.organizationId)).find(
        (row) => row.id === inviteId,
      );
      if (!invite || !(await invites.delete(auth.organizationId, inviteId))) {
        throw new AppError(404, ErrorCode.NotFound, 'That invitation no longer exists.');
      }
      await audit.record({
        organizationId: auth.organizationId,
        action: 'member.invite_revoked',
        actor: actorOf(auth),
        target: { type: 'invite', id: inviteId, label: invite.email },
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
    },
  };
}

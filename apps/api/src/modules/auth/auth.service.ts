import { isDuplicateKeyError, type RunInTransaction } from '../../db/transaction.js';
import { AppError, ErrorCode } from '../../lib/errors.js';
import type { Logger } from '../../lib/logger.js';
import {
  equaliseTiming,
  hashPassword,
  passwordProblem,
  verifyPassword,
} from '../../lib/passwords.js';
import { hashToken } from '../../lib/tokens.js';
import type { AuditService } from '../audit/audit.service.js';
import type {
  InviteRepository,
  MembershipRepository,
  OrganizationRecord,
  OrganizationRepository,
} from '../organizations/organization.repository.js';
import { ROLE_LABELS, permissionsFor, type Role } from '../organizations/roles.js';
import type { SessionService } from '../sessions/session.service.js';
import type { UserRecord, UserRepository } from '../users/user.repository.js';
import type {
  AcceptInviteInput,
  ChangePasswordInput,
  SignInInput,
  SignUpInput,
} from './auth.schemas.js';
import type { AuthContext, MeDto, RequestContext } from './auth.types.js';

/** After this many wrong passwords in a row, sign-in pauses for LOCK_MS. */
export const MAX_FAILED_SIGN_INS = 5;
export const LOCK_MS = 15 * 60 * 1000;

export interface SignedIn {
  /** Raw session token — goes into the HTTP-only cookie, never into a response body. */
  token: string;
  me: MeDto;
}

export interface InvitePreview {
  organizationName: string;
  email: string;
  role: Role;
  roleLabel: string;
  invitedBy: string | null;
  expiresAt: string;
  /** True when this email already has an account (joining a second organisation comes later). */
  accountExists: boolean;
}

export interface AuthService {
  signUp(input: SignUpInput, context: RequestContext): Promise<SignedIn>;
  signIn(input: SignInInput, context: RequestContext): Promise<SignedIn>;
  signOut(auth: AuthContext): Promise<void>;
  me(auth: AuthContext): Promise<MeDto>;
  changePassword(auth: AuthContext, input: ChangePasswordInput): Promise<void>;
  previewInvite(token: string): Promise<InvitePreview>;
  acceptInvite(token: string, input: AcceptInviteInput, context: RequestContext): Promise<SignedIn>;
}

interface Dependencies {
  users: UserRepository;
  organizations: OrganizationRepository;
  memberships: MembershipRepository;
  invites: InviteRepository;
  sessions: SessionService;
  audit: AuditService;
  runInTransaction: RunInTransaction;
  now: () => Date;
  logger: Logger;
}

/** Same message for "no such email" and "wrong password", so accounts can't be discovered. */
function invalidCredentials(): AppError {
  return new AppError(401, ErrorCode.InvalidCredentials, 'Email or password is incorrect.');
}

function fieldError(path: string, message: string): AppError {
  return new AppError(400, ErrorCode.ValidationError, 'The request contains invalid data', [
    { path, message },
  ]);
}

function invalidInvite(): AppError {
  return new AppError(
    404,
    ErrorCode.InviteInvalid,
    'This invitation link is invalid or has expired. Ask your admin for a new one.',
  );
}

function accountExists(): AppError {
  return new AppError(
    409,
    ErrorCode.Conflict,
    'An account with this email already exists. Try signing in instead.',
  );
}

function toMe(user: UserRecord, organization: OrganizationRecord, role: Role): MeDto {
  return {
    user: { id: user.id, name: user.name, email: user.email },
    organization: { id: organization.id, name: organization.name },
    role,
    roleLabel: ROLE_LABELS[role],
    permissions: permissionsFor(role),
  };
}

function actorOf(user: UserRecord) {
  return { userId: user.id, name: user.name, email: user.email };
}

export function createAuthService(deps: Dependencies): AuthService {
  const { users, organizations, memberships, invites, sessions, audit, now } = deps;

  function assertStrongPassword(path: string, password: string, email: string, name: string) {
    const problem = passwordProblem(password, { email, name });
    if (problem) throw fieldError(path, problem);
  }

  async function startSession(
    user: UserRecord,
    organization: OrganizationRecord,
    role: Role,
    context: RequestContext,
  ): Promise<SignedIn> {
    const { token } = await sessions.create({
      userId: user.id,
      organizationId: organization.id,
      ...context,
    });
    await users.recordSuccessfulSignIn(user.id, now());
    return { token, me: toMe(user, organization, role) };
  }

  /** A valid, unexpired invite for this token, or an INVITE_INVALID error. */
  async function findInvite(token: string) {
    const invite = await invites.findByTokenHash(hashToken(token));
    if (!invite || invite.expiresAt <= now()) throw invalidInvite();
    const organization = await organizations.findById(invite.organizationId);
    if (!organization) throw invalidInvite();
    return { invite, organization };
  }

  return {
    async signUp(input, context) {
      assertStrongPassword('password', input.password, input.email, input.name);
      if (await users.findByEmail(input.email)) throw accountExists();

      const passwordHash = await hashPassword(input.password);
      // User, organisation and Owner membership are created together or not at all.
      const { user, organization } = await deps
        .runInTransaction(async (tx) => {
          const user = await users.create(
            { email: input.email, name: input.name, passwordHash },
            tx,
          );
          const organization = await organizations.create(
            { name: input.organizationName, createdBy: user.id },
            tx,
          );
          await memberships.create(
            { organizationId: organization.id, userId: user.id, role: 'owner', invitedBy: null },
            tx,
          );
          return { user, organization };
        })
        .catch((error: unknown) => {
          // Two sign-ups with the same email at the same moment: the unique index wins.
          if (isDuplicateKeyError(error)) throw accountExists();
          throw error;
        });

      const signedIn = await startSession(user, organization, 'owner', context);
      await audit.record({
        organizationId: organization.id,
        action: 'auth.signed_up',
        actor: actorOf(user),
        target: { type: 'organization', id: organization.id, label: organization.name },
        ...context,
      });
      return signedIn;
    },

    async signIn({ email, password }, context) {
      const user = await users.findByEmail(email);
      if (!user) {
        await equaliseTiming(password);
        throw invalidCredentials();
      }

      // While locked, every attempt fails without even checking the password.
      if (user.lockedUntil && user.lockedUntil > now()) {
        await equaliseTiming(password);
        throw invalidCredentials();
      }

      const membership = await memberships.findFirstForUser(user.id);

      if (!(await verifyPassword(user.passwordHash, password))) {
        const failures = await users.incrementFailedSignIns(user.id);
        if (membership) {
          await audit.record({
            organizationId: membership.organizationId,
            action: 'auth.sign_in_failed',
            actor: actorOf(user),
            ...context,
          });
        }
        if (failures >= MAX_FAILED_SIGN_INS) {
          await users.lock(user.id, new Date(now().getTime() + LOCK_MS));
          if (membership) {
            await audit.record({
              organizationId: membership.organizationId,
              action: 'auth.account_locked',
              actor: actorOf(user),
              metadata: { minutes: LOCK_MS / 60_000 },
              ...context,
            });
          }
        }
        throw invalidCredentials();
      }

      // Correct password, so it is safe to be specific from here on.
      const organization = membership
        ? await organizations.findById(membership.organizationId)
        : null;
      if (!membership || !organization) {
        throw new AppError(
          403,
          ErrorCode.Forbidden,
          'Your account is not part of an organisation any more. Ask an admin to invite you again.',
        );
      }

      const signedIn = await startSession(user, organization, membership.role, context);
      await audit.record({
        organizationId: organization.id,
        action: 'auth.signed_in',
        actor: actorOf(user),
        ...context,
      });
      return signedIn;
    },

    async signOut(auth) {
      await sessions.revoke(auth.sessionId);
      await audit.record({
        organizationId: auth.organizationId,
        action: 'auth.signed_out',
        actor: { userId: auth.user.id, name: auth.user.name, email: auth.user.email },
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
    },

    async me(auth) {
      const [user, organization] = await Promise.all([
        users.findById(auth.user.id),
        organizations.findById(auth.organizationId),
      ]);
      if (!user || !organization) {
        throw new AppError(401, ErrorCode.Unauthenticated, 'Please sign in to continue.');
      }
      return toMe(user, organization, auth.role);
    },

    async changePassword(auth, { currentPassword, newPassword }) {
      const user = await users.findById(auth.user.id);
      if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
        throw fieldError('currentPassword', 'Your current password is incorrect.');
      }
      if (newPassword === currentPassword) {
        throw fieldError('newPassword', 'Choose a password you have not used here before.');
      }
      assertStrongPassword('newPassword', newPassword, user.email, user.name);

      await users.updatePassword(user.id, await hashPassword(newPassword), now());
      // Anyone else signed in as this user (a stolen session, an old laptop) is signed out.
      await sessions.revokeOtherSessions(user.id, auth.sessionId);
      await audit.record({
        organizationId: auth.organizationId,
        action: 'auth.password_changed',
        actor: actorOf(user),
        ip: auth.ip,
        userAgent: auth.userAgent,
      });
    },

    async previewInvite(token) {
      const { invite, organization } = await findInvite(token);
      const [inviter, existing] = await Promise.all([
        users.findById(invite.invitedBy),
        users.findByEmail(invite.email),
      ]);
      return {
        organizationName: organization.name,
        email: invite.email,
        role: invite.role,
        roleLabel: ROLE_LABELS[invite.role],
        invitedBy: inviter?.name ?? null,
        expiresAt: invite.expiresAt.toISOString(),
        accountExists: existing !== null,
      };
    },

    async acceptInvite(token, input, context) {
      const { invite, organization } = await findInvite(token);
      if (await users.findByEmail(invite.email)) {
        throw new AppError(
          409,
          ErrorCode.Conflict,
          'This email already has a Similo account. Joining a second organisation is not supported yet.',
        );
      }
      assertStrongPassword('password', input.password, invite.email, input.name);

      const passwordHash = await hashPassword(input.password);
      const user = await deps
        .runInTransaction(async (tx) => {
          const user = await users.create(
            { email: invite.email, name: input.name, passwordHash },
            tx,
          );
          await memberships.create(
            {
              organizationId: organization.id,
              userId: user.id,
              role: invite.role,
              invitedBy: invite.invitedBy,
            },
            tx,
          );
          // Single use: the link stops working once accepted.
          await invites.delete(organization.id, invite.id, tx);
          return user;
        })
        .catch((error: unknown) => {
          if (isDuplicateKeyError(error)) throw accountExists();
          throw error;
        });

      const signedIn = await startSession(user, organization, invite.role, context);
      await audit.record({
        organizationId: organization.id,
        action: 'member.joined',
        actor: actorOf(user),
        target: { type: 'user', id: user.id, label: user.email },
        metadata: { role: invite.role },
        ...context,
      });
      return signedIn;
    },
  };
}

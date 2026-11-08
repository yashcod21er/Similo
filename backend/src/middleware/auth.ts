import type { Request, RequestHandler, Response } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';
import type { AuthContext, RequestContext } from '../modules/auth/auth.types.js';
import type { MembershipRepository } from '../modules/organizations/organization.repository.js';
import { can, type Permission } from '../modules/organizations/roles.js';
import type { SessionService } from '../modules/sessions/session.service.js';
import type { UserRepository } from '../modules/users/user.repository.js';

export function requestContext(req: Request): RequestContext {
  return { ip: req.ip ?? '', userAgent: req.get('user-agent') ?? '' };
}

function unauthenticated(): AppError {
  return new AppError(401, ErrorCode.Unauthenticated, 'Please sign in to continue.');
}

/**
 * Reads the session cookie and works out who is calling. The role is read from
 * the membership on every request, so a role change or removal takes effect
 * immediately, not when the session expires.
 */
export function createRequireAuth({
  sessions,
  memberships,
  users,
  cookieName,
}: {
  sessions: SessionService;
  memberships: MembershipRepository;
  users: UserRepository;
  cookieName: string;
}): RequestHandler {
  return async (req, res, next) => {
    const token: unknown = req.cookies?.[cookieName];
    const session = typeof token === 'string' ? await sessions.resolve(token) : null;
    if (!session) throw unauthenticated();

    const [membership, user] = await Promise.all([
      memberships.find(session.organizationId, session.userId),
      users.findById(session.userId),
    ]);
    if (!membership || !user) {
      // Removed from the organisation (or deleted) since signing in.
      await sessions.revoke(session.id);
      throw unauthenticated();
    }

    const auth: AuthContext = {
      sessionId: session.id,
      user: { id: user.id, name: user.name, email: user.email },
      organizationId: membership.organizationId,
      role: membership.role,
      ...requestContext(req),
    };
    res.locals.auth = auth;
    next();
  };
}

/** The caller, as established by `requireAuth`. */
export function getAuth(res: Response): AuthContext {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth) throw new Error('requireAuth must run before getAuth');
  return auth;
}

/** Blocks the request unless the caller's role grants `permission` (see roles.ts). */
export function requirePermission(permission: Permission): RequestHandler {
  return (_req, res, next) => {
    if (!can(getAuth(res).role, permission)) {
      throw new AppError(403, ErrorCode.Forbidden, 'Your role does not allow this action.');
    }
    next();
  };
}

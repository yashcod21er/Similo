import type { Request, RequestHandler, Response } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';
import type { AccessTokenService } from '../modules/auth/access-token.js';
import { setAccessCookie, type AuthCookieConfig } from '../modules/auth/auth.cookies.js';
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
 * Works out who is calling:
 *
 * 1. A valid JWT access token (cookie) identifies the caller without a session lookup.
 * 2. If it is missing or expired, a valid refresh token (cookie, stored hashed)
 *    silently issues a new access token, so the website never has to handle expiry.
 * 3. The role is read from the membership on every request, so a role change or
 *    removal takes effect immediately, not when a token expires.
 */
export function createRequireAuth({
  sessions,
  accessTokens,
  memberships,
  users,
  cookies,
}: {
  sessions: SessionService;
  accessTokens: AccessTokenService;
  memberships: MembershipRepository;
  users: UserRepository;
  cookies: AuthCookieConfig;
}): RequestHandler {
  return async (req, res, next) => {
    const accessToken: unknown = req.cookies?.[cookies.access];
    let claims = typeof accessToken === 'string' ? await accessTokens.verify(accessToken) : null;

    if (!claims) {
      const refreshToken: unknown = req.cookies?.[cookies.refresh];
      const session =
        typeof refreshToken === 'string' ? await sessions.resolve(refreshToken) : null;
      if (!session) throw unauthenticated();
      claims = {
        userId: session.userId,
        organizationId: session.organizationId,
        sessionId: session.id,
      };
      setAccessCookie(res, cookies, await accessTokens.sign(claims));
    }

    const [membership, user] = await Promise.all([
      memberships.find(claims.organizationId, claims.userId),
      users.findById(claims.userId),
    ]);
    if (!membership || !user) {
      // Removed from the organisation (or deleted) since signing in.
      await sessions.revoke(claims.sessionId);
      throw unauthenticated();
    }

    const auth: AuthContext = {
      sessionId: claims.sessionId,
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

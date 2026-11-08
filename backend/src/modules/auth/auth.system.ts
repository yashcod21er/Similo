import type { RequestHandler } from 'express';
import type { RunInTransaction } from '../../db/transaction.js';
import type { Logger } from '../../lib/logger.js';
import { createRequireAuth } from '../../middleware/auth.js';
import type { AuditRepository } from '../audit/audit.repository.js';
import { createAuditService, type AuditService } from '../audit/audit.service.js';
import type {
  InviteRepository,
  MembershipRepository,
  OrganizationRepository,
} from '../organizations/organization.repository.js';
import {
  createOrganizationService,
  type OrganizationService,
} from '../organizations/organization.service.js';
import type { SessionRepository } from '../sessions/session.repository.js';
import { createSessionService } from '../sessions/session.service.js';
import type { UserRepository } from '../users/user.repository.js';
import { createAccessTokenService, type AccessTokenService } from './access-token.js';
import { authCookieConfig, type AuthCookieConfig } from './auth.cookies.js';
import { DEFAULT_AUTH_RATE_LIMITS, type AuthRateLimits } from './auth.routes.js';
import { createAuthService, type AuthService } from './auth.service.js';

export interface AuthRepositories {
  users: UserRepository;
  organizations: OrganizationRepository;
  memberships: MembershipRepository;
  invites: InviteRepository;
  sessions: SessionRepository;
  audit: AuditRepository;
}

/** Everything identity-related, built once and handed to the router. */
export interface AuthSystem {
  authService: AuthService;
  organizationService: OrganizationService;
  auditService: AuditService;
  requireAuth: RequestHandler;
  accessTokens: AccessTokenService;
  cookies: AuthCookieConfig;
  rateLimits: AuthRateLimits;
}

/**
 * Wires repositories into services. server.ts passes the MongoDB repositories;
 * tests pass in-memory fakes and a controllable clock.
 */
export function createAuthSystem({
  repositories,
  runInTransaction,
  logger,
  appUrl,
  cookieSecure,
  jwtSecret,
  now = () => new Date(),
  rateLimits = DEFAULT_AUTH_RATE_LIMITS,
}: {
  repositories: AuthRepositories;
  runInTransaction: RunInTransaction;
  logger: Logger;
  appUrl: string;
  cookieSecure: boolean;
  /** Signs the JWT access tokens (HS256). At least 32 characters. */
  jwtSecret: string;
  now?: () => Date;
  rateLimits?: AuthRateLimits;
}): AuthSystem {
  const { users, organizations, memberships, invites } = repositories;
  const sessions = createSessionService({ sessions: repositories.sessions, now });
  const auditService = createAuditService({ repository: repositories.audit, logger });
  const cookies = authCookieConfig({ secure: cookieSecure });
  const accessTokens = createAccessTokenService({ secret: jwtSecret, now });

  return {
    authService: createAuthService({
      users,
      organizations,
      memberships,
      invites,
      sessions,
      audit: auditService,
      runInTransaction,
      now,
      logger,
    }),
    organizationService: createOrganizationService({
      organizations,
      memberships,
      invites,
      users,
      sessions,
      audit: auditService,
      appUrl,
      now,
    }),
    auditService,
    requireAuth: createRequireAuth({ sessions, accessTokens, memberships, users, cookies }),
    accessTokens,
    cookies,
    rateLimits,
  };
}

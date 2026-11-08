import { generateToken, hashToken } from '../../lib/tokens.js';
import type { SessionRecord, SessionRepository } from './session.repository.js';

/** Signed out after 7 days without activity... */
export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000;
/** ...and after 30 days at most, however active. */
export const SESSION_MAX_MS = 30 * 24 * 60 * 60 * 1000;
/** Activity is written back at most once an hour, not on every request. */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;
/** Real tokens are 43 characters; anything far longer is junk, so skip the lookup. */
const MAX_TOKEN_LENGTH = 128;

export interface SessionService {
  create(input: {
    userId: string;
    organizationId: string;
    ip: string;
    userAgent: string;
  }): Promise<{ token: string; session: SessionRecord }>;
  /** Returns the live session for a cookie token, or null (unknown, expired or junk). */
  resolve(token: string): Promise<SessionRecord | null>;
  revoke(sessionId: string): Promise<void>;
  revokeOtherSessions(userId: string, keepSessionId: string): Promise<void>;
  revokeMember(userId: string, organizationId: string): Promise<void>;
}

export function createSessionService({
  sessions,
  now,
}: {
  sessions: SessionRepository;
  now: () => Date;
}): SessionService {
  return {
    async create({ userId, organizationId, ip, userAgent }) {
      const token = generateToken();
      const at = now();
      const session = await sessions.create({
        tokenHash: hashToken(token),
        userId,
        organizationId,
        ip,
        userAgent: userAgent.slice(0, 300),
        lastSeenAt: at,
        expiresAt: new Date(at.getTime() + SESSION_IDLE_MS),
        absoluteExpiresAt: new Date(at.getTime() + SESSION_MAX_MS),
      });
      return { token, session };
    },

    async resolve(token) {
      if (!token || token.length > MAX_TOKEN_LENGTH) return null;
      const session = await sessions.findByTokenHash(hashToken(token));
      if (!session) return null;

      const at = now();
      // MongoDB's TTL cleanup runs about once a minute, so check expiry here too.
      if (session.expiresAt <= at || session.absoluteExpiresAt <= at) {
        await sessions.deleteById(session.id);
        return null;
      }

      if (at.getTime() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
        const expiresAt = new Date(
          Math.min(at.getTime() + SESSION_IDLE_MS, session.absoluteExpiresAt.getTime()),
        );
        await sessions.touch(session.id, at, expiresAt);
        return { ...session, lastSeenAt: at, expiresAt };
      }
      return session;
    },

    revoke: (sessionId) => sessions.deleteById(sessionId),
    revokeOtherSessions: (userId, keepSessionId) => sessions.deleteByUser(userId, keepSessionId),
    revokeMember: (userId, organizationId) =>
      sessions.deleteByUserInOrganization(userId, organizationId),
  };
}

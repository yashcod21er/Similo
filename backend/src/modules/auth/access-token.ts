import { jwtVerify, SignJWT } from 'jose';

/**
 * Access tokens are short-lived JWTs (HS256), sent only in an HTTP-only cookie.
 *
 * - They prove who the caller is without a database lookup for the session.
 * - They hold only ids, never the role: the role is read from the membership on
 *   every request, so role changes and removals still apply immediately.
 * - They expire after 15 minutes. The refresh token (random, stored hashed in
 *   MongoDB) issues a new one; signing out deletes the refresh token.
 */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

const ISSUER = 'similo';
const AUDIENCE = 'similo-web';
/** Real tokens are about 300 characters; skip verifying anything far longer. */
const MAX_TOKEN_LENGTH = 2048;
const OBJECT_ID = /^[a-f\d]{24}$/i;

export interface AccessClaims {
  userId: string;
  organizationId: string;
  /** The refresh session this token was issued from. */
  sessionId: string;
}

export interface AccessTokenService {
  sign(claims: AccessClaims): Promise<string>;
  /** The claims of a valid, unexpired token, or null (missing, forged, expired or junk). */
  verify(token: string): Promise<AccessClaims | null>;
}

export function createAccessTokenService({
  secret,
  now,
}: {
  secret: string;
  now: () => Date;
}): AccessTokenService {
  if (secret.length < 32) throw new Error('The JWT secret must be at least 32 characters');
  const key = new TextEncoder().encode(secret);

  return {
    async sign({ userId, organizationId, sessionId }) {
      const issuedAt = Math.floor(now().getTime() / 1000);
      return new SignJWT({ org: organizationId, sid: sessionId })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(userId)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + ACCESS_TOKEN_TTL_MS / 1000)
        .sign(key);
    },

    async verify(token) {
      if (!token || token.length > MAX_TOKEN_LENGTH) return null;
      try {
        const { payload } = await jwtVerify(token, key, {
          algorithms: ['HS256'], // never accept "none" or a different algorithm
          issuer: ISSUER,
          audience: AUDIENCE,
          currentDate: now(),
        });
        const { sub, org, sid } = payload;
        if (typeof sub !== 'string' || typeof org !== 'string' || typeof sid !== 'string') {
          return null;
        }
        if (![sub, org, sid].every((id) => OBJECT_ID.test(id))) return null;
        return { userId: sub, organizationId: org, sessionId: sid };
      } catch {
        return null; // bad signature, expired, wrong issuer/audience, malformed
      }
    },
  };
}

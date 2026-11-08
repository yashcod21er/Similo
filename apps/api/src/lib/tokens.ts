import { createHash, randomBytes } from 'node:crypto';

/**
 * Unguessable random token (256 bits by default), URL-safe.
 * Used for session IDs and invitation links.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Tokens are stored only as SHA-256 hashes. Someone who reads the database
 * (a leaked backup, for example) cannot turn a stored hash back into a working
 * session or invite. A fast hash is fine here because the tokens are long and
 * random, unlike passwords.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

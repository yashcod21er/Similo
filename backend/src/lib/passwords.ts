import { hash, verify } from '@node-rs/argon2';

/**
 * Password hashing with Argon2id, the algorithm OWASP recommends, using
 * OWASP's baseline settings: 19 MiB of memory, 2 iterations, 1 lane.
 * Each hash embeds its own algorithm and settings, so the settings can be
 * strengthened later without breaking existing accounts.
 */
const ARGON2ID = 2; // `Algorithm.Argon2id` (a const enum, which isolatedModules cannot import)

const HASH_OPTIONS = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export const PASSWORD_MIN_LENGTH = 12;
/** Upper bound stops someone sending a megabyte "password" to waste CPU on hashing. */
export const PASSWORD_MAX_LENGTH = 128;

export function hashPassword(password: string): Promise<string> {
  return hash(password, HASH_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    // A malformed stored hash must never count as a match.
    return false;
  }
}

let timingHash: Promise<string> | undefined;

/**
 * Spends the same time as a real password check. Called when the email is
 * unknown (or the account is locked), so response timing does not reveal
 * whether an account exists.
 */
export async function equaliseTiming(password: string): Promise<void> {
  timingHash ??= hashPassword(`similo-timing-${Math.random()}`);
  await verifyPassword(await timingHash, password);
}

/**
 * Very common passwords that meet the length rule. Following NIST guidance we
 * don't force symbols or digits; we block known-bad choices instead.
 */
const COMMON_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  '12345678901234',
  '123456123456',
  '111111111111',
  '000000000000',
  'qwertyuiopas',
  'qwertyuiop123',
  'qwerty123456',
  '1q2w3e4r5t6y',
  'password1234',
  'password12345',
  'password123456',
  'passwordpassword',
  'iloveyou1234',
  'letmein12345',
  'welcome12345',
  'administrator',
  'adminadmin123',
  'changeme1234',
  'abcdefghijkl',
  'abc123abc123',
  'trustno1trustno1',
  'football1234',
  'baseball1234',
  'superman1234',
  'similo123456',
  'similosimilo',
]);

/**
 * Returns a plain-language reason when a password is too weak, or null when it
 * is acceptable. `context` lets us reject passwords built from the user's own
 * name or email, which attackers try first.
 */
export function passwordProblem(
  password: string,
  context: { email?: string; name?: string } = {},
): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower) || /^(.)\1+$/.test(password)) {
    return 'This password is too common. Try a short phrase of a few unrelated words.';
  }
  const emailName = context.email?.split('@')[0]?.toLowerCase();
  if (emailName && emailName.length >= 4 && lower.includes(emailName)) {
    return "Don't include your email address in your password.";
  }
  const firstName = context.name?.trim().split(/\s+/)[0]?.toLowerCase();
  if (firstName && firstName.length >= 4 && lower.includes(firstName)) {
    return "Don't include your name in your password.";
  }
  return null;
}

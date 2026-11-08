import { describe, expect, it } from 'vitest';
import { hashPassword, passwordProblem, verifyPassword } from '../src/lib/passwords.js';
import { generateToken, hashToken } from '../src/lib/tokens.js';

describe('password hashing', () => {
  it('stores Argon2id hashes that verify only the right password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(await verifyPassword(hash, 'correct horse battery staple')).toBe(true);
    expect(await verifyPassword(hash, 'correct horse battery stable')).toBe(false);
  });

  it('salts every hash, so the same password never hashes the same way twice', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same password here'),
      hashPassword('same password here'),
    ]);
    expect(a).not.toBe(b);
  });

  it('treats a corrupted stored hash as a non-match instead of crashing', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
  });
});

describe('password rules', () => {
  it('accepts a long passphrase without forcing symbols or digits', () => {
    expect(passwordProblem('purple tractor sings loudly')).toBeNull();
  });

  it('explains each rejection in plain words', () => {
    expect(passwordProblem('short')).toMatch(/at least 10 characters/);
    expect(passwordProblem('password1234')).toMatch(/too common/);
    expect(passwordProblem('aaaaaaaaaaaaaaa')).toMatch(/too common/);
    expect(passwordProblem('asha.rao-is-great', { email: 'asha.rao@example.com' })).toMatch(
      /email/,
    );
    expect(passwordProblem('priyanka-rocks-2026', { name: 'Priyanka Shah' })).toMatch(/name/);
    expect(passwordProblem('x'.repeat(129))).toMatch(/at most 128/);
  });
});

describe('tokens', () => {
  it('are long, random and stored only as a hash', () => {
    const token = generateToken();
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(generateToken()).not.toBe(token);
    expect(hashToken(token)).toMatch(/^[a-f\d]{64}$/);
    expect(hashToken(token)).not.toContain(token);
  });
});

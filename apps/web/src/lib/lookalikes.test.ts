import { describe, expect, it } from 'vitest';
import {
  FALLBACK_BRAND,
  diffParts,
  editDistance,
  exampleImitations,
  generateLookalikes,
  nameSimilarity,
  normaliseBrand,
} from './lookalikes';

describe('normaliseBrand', () => {
  it('reduces URLs and spaced names to a bare label', () => {
    expect(normaliseBrand('  https://www.Acme.com/login ')).toBe('acme');
    expect(normaliseBrand('ACME Corp')).toBe('acmecorp');
    expect(normaliseBrand('--brand--')).toBe('brand');
  });

  it('drops characters that cannot appear in a domain and caps the length', () => {
    expect(normaliseBrand('café!')).toBe('cafe');
    expect(normaliseBrand('a'.repeat(40))).toHaveLength(24);
  });
});

describe('editDistance', () => {
  it('counts insertions, deletions, substitutions and adjacent swaps as one edit', () => {
    expect(editDistance('acme', 'acme')).toBe(0);
    expect(editDistance('acme', 'acm')).toBe(1);
    expect(editDistance('acme', 'acmee')).toBe(1);
    expect(editDistance('acme', 'acne')).toBe(1);
    expect(editDistance('acme', 'amce')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
  });
});

describe('nameSimilarity', () => {
  it('treats lookalike characters as the letter they imitate', () => {
    expect(nameSimilarity('acrne', 'acme')).toBe(1);
    expect(nameSimilarity('g00gle', 'google')).toBe(1);
  });
});

describe('generateLookalikes', () => {
  it('returns eight unique imitations that never include the real domain', () => {
    const results = generateLookalikes('acme');
    const domains = results.map((result) => result.domain);
    expect(results).toHaveLength(8);
    expect(new Set(domains).size).toBe(8);
    expect(domains).not.toContain('acme.com');
  });

  it('leads with a lookalike-character imitation and explains it in plain words', () => {
    const [first] = generateLookalikes('acme');
    expect(first).toMatchObject({
      domain: 'acrne.com',
      technique: 'lookalike-character',
      reason: '"rn" looks like "m"',
      matchLabel: '100% match',
    });
  });

  it('labels added-word imitations by containment, not a misleading percentage', () => {
    const login = generateLookalikes('acme').find((result) => result.domain === 'acme-login.com');
    expect(login?.matchLabel).toBe('Contains your name');
  });

  it('still produces a full list for very short names', () => {
    expect(generateLookalikes('ab').length).toBeGreaterThanOrEqual(6);
  });

  it('falls back to the sample brand when the input is empty or unusable', () => {
    expect(generateLookalikes('   ')[0]?.domain).toContain(FALLBACK_BRAND.slice(0, 2));
    expect(generateLookalikes('!!!').length).toBe(8);
  });
});

describe('exampleImitations', () => {
  it('builds the copycat app and trademark examples from the brand', () => {
    expect(exampleImitations('acme')).toEqual({
      brand: 'acme',
      app: 'Acme Pro',
      trademark: 'ACMEE',
    });
  });
});

describe('diffParts', () => {
  it('isolates the changed characters so they can be highlighted', () => {
    expect(diffParts('acrne.com', 'acme.com')).toEqual(['ac', 'rn', 'e.com']);
    expect(diffParts('acme-login.com', 'acme.com')).toEqual(['acme', '-login', '.com']);
    expect(diffParts('acme.net', 'acme.com')).toEqual(['acme.', 'net', '']);
    expect(diffParts('acmme.com', 'acme.com')).toEqual(['acm', 'm', 'e.com']);
    expect(diffParts('ace.com', 'acme.com')).toEqual(['ac', '', 'e.com']);
  });
});

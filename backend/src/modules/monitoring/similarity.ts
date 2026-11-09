import { domainToUnicode } from 'node:url';
import type { BrandRecord } from '../brands/brand.repository.js';

export interface SimilarityAssessment {
  score: number;
  matchedTerm: string;
  reasons: string[];
}

const CONFUSABLES: Record<string, string> = {
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  х: 'x',
  у: 'y',
  і: 'i',
  ј: 'j',
  к: 'k',
  м: 'm',
  т: 't',
  в: 'b',
  н: 'h',
  Α: 'a',
  Β: 'b',
  Ε: 'e',
  Ζ: 'z',
  Η: 'h',
  Ι: 'i',
  Κ: 'k',
  Μ: 'm',
  Ν: 'n',
  Ο: 'o',
  Ρ: 'p',
  Τ: 't',
  Χ: 'x',
  Υ: 'y',
  α: 'a',
  β: 'b',
  ε: 'e',
  ζ: 'z',
  η: 'h',
  ο: 'o',
  ρ: 'p',
  τ: 't',
  χ: 'x',
  υ: 'y',
  ν: 'v',
  ι: 'i',
  κ: 'k',
  μ: 'm',
};

function skeleton(value: string): string {
  return [...domainToUnicode(value).normalize('NFKD').toLowerCase()]
    .filter((char) => !/\p{M}/u.test(char))
    .map((char) => CONFUSABLES[char] ?? char)
    .join('')
    .replace(/[^a-z\d]/g, '');
}

function editDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, () =>
    new Array<number>(right.length + 1).fill(0),
  );
  for (let i = 0; i <= left.length; i += 1) rows[i]![0] = i;
  for (let j = 0; j <= right.length; j += 1) rows[0]![j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      rows[i]![j] = Math.min(
        rows[i - 1]![j]! + 1,
        rows[i]![j - 1]! + 1,
        rows[i - 1]![j - 1]! + cost,
      );
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        rows[i]![j] = Math.min(rows[i]![j]!, rows[i - 2]![j - 2]! + 1);
      }
    }
  }
  return rows[left.length]![right.length]!;
}

function aliasesFor(brand: BrandRecord): { text: string; key: string }[] {
  const values = [
    brand.name,
    ...brand.keywords,
    ...brand.domains.map(({ domain }) => domain.split('.')[0] ?? ''),
  ];
  const aliases = values
    .map((text) => ({ text, key: skeleton(text) }))
    .filter(({ key }) => key.length >= 3);
  return [...new Map(aliases.map((alias) => [alias.key, alias])).values()];
}

function similarity(label: string, alias: string): number {
  if (!label || !alias) return 0;
  if (label === alias) return 0.95;
  if (label.startsWith(`${alias}-`) || label.endsWith(`-${alias}`)) return 0.88;
  if (label.includes(alias)) return 0.82;
  if (alias.length < 4) return 0;
  const distance = editDistance(label, alias);
  const ratio = 1 - distance / Math.max(label.length, alias.length);
  if (label.length > alias.length * 1.9) return Math.min(ratio, 0.69);
  return ratio;
}

export function assessDomainSimilarity(
  brand: BrandRecord,
  domain: string,
): SimilarityAssessment | null {
  const unicode = domainToUnicode(domain);
  const labels = unicode.toLowerCase().split('.').slice(0, -1);
  const aliases = aliasesFor(brand);
  let best = { ratio: 0, label: '', aliasKey: '', aliasText: '' };

  for (const label of labels) {
    const normalizedLabel = skeleton(label);
    for (const alias of aliases) {
      const ratio = similarity(normalizedLabel, alias.key);
      if (ratio > best.ratio) {
        best = { ratio, label: normalizedLabel, aliasKey: alias.key, aliasText: alias.text };
      }
    }
  }
  if (best.ratio === 0) return null;

  const score = Math.round(best.ratio * 100);
  const reasons: string[] = [];
  if (domain.startsWith('xn--') || domain.split('.').some((label) => label.startsWith('xn--'))) {
    reasons.push('Contains internationalized domain characters');
  }
  if (best.label === best.aliasKey)
    reasons.push('Uses the protected name with a different domain ending');
  else if (best.label.includes(best.aliasKey))
    reasons.push('Adds or combines words around the protected name');
  else reasons.push(`Close spelling to “${best.aliasText}”`);
  if (best.label !== best.aliasKey && best.label.length >= best.aliasKey.length - 1) {
    reasons.push('A small spelling change can make the address look genuine');
  }

  return { score, matchedTerm: best.aliasText, reasons: [...new Set(reasons)] };
}

export function thresholdForSensitivity(
  sensitivity: BrandRecord['monitoring']['sensitivity'],
): number {
  return sensitivity === 'high' ? 55 : sensitivity === 'low' ? 80 : 65;
}

export function isOfficialDomain(brand: BrandRecord, candidate: string): boolean {
  return brand.domains.some(
    ({ domain }) => candidate === domain || candidate.endsWith(`.${domain}`),
  );
}

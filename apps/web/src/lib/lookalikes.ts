/**
 * Lookalike generator for the home-page brand checker.
 *
 * Given a brand name, it builds the kinds of imitation names that brand
 * protection tools watch for: lookalike characters, typos, added words and
 * different endings. Everything runs in the browser and nothing is sent
 * anywhere. These are *possible* imitations, not registered domains — the UI
 * must always say so.
 */

export type Technique =
  | 'lookalike-character'
  | 'added-word'
  | 'swapped-letters'
  | 'different-ending'
  | 'missing-letter'
  | 'doubled-letter'
  | 'hyphen';

export interface Lookalike {
  domain: string;
  technique: Technique;
  /** Plain-language reason, e.g. `"rn" looks like "m"`. */
  reason: string;
  /** Name similarity after lookalike characters are normalised, 0–1. */
  similarity: number;
  /** What to show next to it: "100% match" or "Contains your name". */
  matchLabel: string;
}

export const FALLBACK_BRAND = 'acme';
const MAX_LENGTH = 24;

/** Characters (or pairs) that read like another letter in a browser address bar. */
const LOOKALIKE_CHARACTERS: [original: string, imitation: string][] = [
  ['m', 'rn'],
  ['w', 'vv'],
  ['d', 'cl'],
  ['o', '0'],
  ['l', '1'],
  ['i', '1'],
  ['g', 'q'],
];

/** Turns "https://www.Acme.com/" or " ACME Corp " into a bare label: "acme" / "acmecorp". */
export function normaliseBrand(input: string): string {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/^www\./, '')
    .split(/[./]/)[0]!;
  return host
    .normalize('NFKD')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH);
}

/** Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const at = (i: number, j: number) => d[i]![j]!;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, at(i - 2, j - 2) + 1);
      }
      d[i]![j] = value;
    }
  }
  return at(rows - 1, cols - 1);
}

/** Maps lookalike characters back to the letter they imitate ("rn" → "m", "0" → "o"). */
function undoLookalikes(label: string): string {
  return LOOKALIKE_CHARACTERS.reduce(
    (text, [original, imitation]) => text.split(imitation).join(original),
    label,
  );
}

export function nameSimilarity(candidate: string, brand: string): number {
  const a = undoLookalikes(candidate);
  const b = undoLookalikes(brand);
  const longest = Math.max(a.length, b.length) || 1;
  return Math.max(0, 1 - editDistance(a, b) / longest);
}

/** "acme" → "Acme" */
export function toTitle(brand: string): string {
  return brand ? brand[0]!.toUpperCase() + brand.slice(1) : brand;
}

export function generateLookalikes(rawBrand: string, limit = 8): Lookalike[] {
  const brand = normaliseBrand(rawBrand) || FALLBACK_BRAND;
  const results: Lookalike[] = [];
  const seen = new Set<string>([`${brand}.com`]);

  const add = (label: string, ending: string, technique: Technique, reason: string) => {
    const domain = `${label}${ending}`;
    if (!label || label.startsWith('-') || seen.has(domain)) return;
    seen.add(domain);
    const similarity = nameSimilarity(label, brand);
    results.push({
      domain,
      technique,
      reason,
      similarity,
      matchLabel:
        technique === 'added-word'
          ? 'Contains your name'
          : `${Math.round(similarity * 100)}% match`,
    });
  };

  const middle = Math.floor(brand.length / 2);

  // 1. A character that looks like another one.
  const lookalike = LOOKALIKE_CHARACTERS.find(([original]) => brand.includes(original));
  if (lookalike) {
    const [original, imitation] = lookalike;
    add(
      brand.replace(original, imitation),
      '.com',
      'lookalike-character',
      `"${imitation}" looks like "${original}"`,
    );
  }

  // 2. Your name plus a word that sounds official.
  add(`${brand}-login`, '.com', 'added-word', 'Adds the word "login"');

  // 3. Two neighbouring letters swapped (a common typo).
  for (let i = Math.max(1, middle - 1); i < brand.length - 1; i++) {
    const [x, y] = [brand[i]!, brand[i + 1]!];
    if (x !== y && x !== '-' && y !== '-') {
      add(
        brand.slice(0, i) + y + x + brand.slice(i + 2),
        '.com',
        'swapped-letters',
        `"${x}" and "${y}" swapped`,
      );
      break;
    }
  }

  // 4. Exactly your name, with a different ending.
  add(brand, '.net', 'different-ending', 'Same name, ends in .net');

  // 5. One letter left out.
  if (brand.length >= 4) {
    const index = Math.max(1, middle);
    add(
      brand.slice(0, index) + brand.slice(index + 1),
      '.com',
      'missing-letter',
      `Missing the letter "${brand[index]}"`,
    );
  }

  // 6. More official-sounding words.
  add(`${brand}-support`, '.com', 'added-word', 'Adds the word "support"');

  // 7. One letter typed twice.
  const doubled = brand.search(/[a-z]/);
  if (doubled >= 0) {
    const index = Math.min(brand.length - 1, Math.max(doubled, middle));
    add(
      brand.slice(0, index + 1) + brand[index] + brand.slice(index + 1),
      '.com',
      'doubled-letter',
      `Letter "${brand[index]}" typed twice`,
    );
  }

  // 8. Other endings and small tweaks, used when the name is short.
  add(brand, '.shop', 'different-ending', 'Same name, ends in .shop');
  if (brand.length >= 6) {
    add(`${brand.slice(0, middle)}-${brand.slice(middle)}`, '.com', 'hyphen', 'A hyphen added');
  }
  add(`secure-${brand}`, '.com', 'added-word', 'Adds the word "secure"');
  add(brand, '.online', 'different-ending', 'Same name, ends in .online');

  return results.slice(0, limit);
}

/** Example copycat app and trademark names used by the orbit cards. */
export function exampleImitations(rawBrand: string) {
  const brand = normaliseBrand(rawBrand) || FALLBACK_BRAND;
  return {
    brand,
    app: `${toTitle(brand)} Pro`,
    trademark: `${brand}${brand.at(-1) ?? ''}`.toUpperCase(),
  };
}

/**
 * Splits `candidate` into the part it shares with `original` at the start, the
 * part that differs, and the shared ending — so the UI can highlight the change.
 * "acrne.com" vs "acme.com" → ["ac", "rn", "e.com"].
 */
export function diffParts(candidate: string, original: string): [string, string, string] {
  const limit = Math.min(candidate.length, original.length);
  let start = 0;
  while (start < limit && candidate[start] === original[start]) start++;
  let end = 0;
  while (
    end < limit - start &&
    candidate[candidate.length - 1 - end] === original[original.length - 1 - end]
  ) {
    end++;
  }
  return [
    candidate.slice(0, start),
    candidate.slice(start, candidate.length - end),
    candidate.slice(candidate.length - end),
  ];
}

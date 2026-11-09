import { domainToASCII } from 'node:url';
import type { BrandRecord } from '../brands/brand.repository.js';
import { normalizeDomain } from '../brands/domain-name.js';
import type { FindingSource } from '../findings/finding.model.js';

export interface DomainCandidate {
  domain: string;
  source: FindingSource;
  references: string[];
  observedAt: Date | null;
}

export interface DomainDiscoverySource {
  discover(brand: BrandRecord): Promise<DomainCandidate[]>;
}

/** Development-only results use the reserved .example TLD and are never real detections. */
export class FixtureDiscoverySource implements DomainDiscoverySource {
  async discover(brand: BrandRecord): Promise<DomainCandidate[]> {
    const seeds = [brand.name, ...brand.keywords, ...brand.domains.map(({ domain }) => domain)];
    const seed = seeds.map(toAsciiSeed).find((value) => value.length >= 4);
    if (!seed) return [];

    const typo = seed.length > 5 ? `${seed.slice(0, -1)}x` : `${seed.slice(0, -1)}x`;
    const domains = new Set([`${seed}-secure.example`, `${typo}.example`]);
    return [...domains].map((domain) => ({
      domain,
      source: 'fixture',
      references: ['development-fixture'],
      observedAt: new Date(),
    }));
  }
}

function toAsciiSeed(value: string): string {
  const unwrapped = value.replace(/^https?:\/\//i, '').split(/[/?#]/, 1)[0] ?? '';
  const host = normalizeDomain(unwrapped);
  const text = host ? (host.split('.')[0] ?? '') : domainToASCII(value.toLowerCase());
  return (text ?? '')
    .replace(/^xn--/, '')
    .replace(/[^a-z\d]/g, '')
    .slice(0, 30);
}

interface CrtShEntry {
  id?: unknown;
  name_value?: unknown;
  common_name?: unknown;
  not_before?: unknown;
}

const CRTSH_URL = 'https://crt.sh/';
const MAX_RESPONSE_CHARS = 5_000_000;
const MAX_QUERY_TERMS = 4;
const MAX_CANDIDATES = 500;
const LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Searches the public crt.sh JSON view for brand-derived terms. crt.sh is a discovery
 * adapter only: certificate transparency is incomplete, delayed and not a registration feed.
 */
export class CrtShDiscoverySource implements DomainDiscoverySource {
  async discover(brand: BrandRecord): Promise<DomainCandidate[]> {
    const terms = [
      ...new Set([
        brand.name,
        ...brand.keywords,
        ...brand.domains.map(({ domain }) => domain.split('.')[0] ?? ''),
      ]),
    ]
      .map((term) => term.toLowerCase().replace(/[^a-z\d]/g, ''))
      .filter((term) => term.length >= 3)
      .slice(0, MAX_QUERY_TERMS);
    const cutoff = Date.now() - LOOKBACK_MS;
    const found = new Map<string, DomainCandidate>();

    for (const term of terms) {
      const url = new URL(CRTSH_URL);
      url.searchParams.set('q', `%${term}%`);
      url.searchParams.set('output', 'json');
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Similo-domain-monitor/1.0' },
        signal: AbortSignal.timeout(20_000),
        redirect: 'error',
      });
      if (!response.ok)
        throw new Error(`Certificate Transparency lookup returned HTTP ${response.status}`);
      const length = Number(response.headers.get('content-length') ?? '0');
      if (length > MAX_RESPONSE_CHARS)
        throw new Error('Certificate Transparency response exceeded the size limit');
      const text = await response.text();
      if (text.length > MAX_RESPONSE_CHARS)
        throw new Error('Certificate Transparency response exceeded the size limit');
      const entries: unknown = JSON.parse(text);
      if (!Array.isArray(entries))
        throw new Error('Certificate Transparency returned an unexpected response');

      for (const raw of entries as CrtShEntry[]) {
        const observedAt = typeof raw.not_before === 'string' ? new Date(raw.not_before) : null;
        if (observedAt && !Number.isNaN(observedAt.getTime()) && observedAt.getTime() < cutoff)
          continue;
        const names = [raw.name_value, raw.common_name]
          .filter((value): value is string => typeof value === 'string')
          .flatMap((value) => value.split(/[\r\n,\s]+/));
        for (const name of names) {
          const candidate = normalizeDomain(name.replace(/^\*\./, ''));
          if (!candidate || isReservedDomain(candidate)) continue;
          const prior = found.get(candidate);
          const reference =
            typeof raw.id === 'number' || typeof raw.id === 'string' ? String(raw.id) : '';
          found.set(candidate, {
            domain: candidate,
            source: 'certificate_transparency',
            references: [
              ...new Set([...(prior?.references ?? []), ...(reference ? [reference] : [])]),
            ].slice(0, 10),
            observedAt:
              observedAt && !Number.isNaN(observedAt.getTime())
                ? observedAt
                : (prior?.observedAt ?? null),
          });
          if (found.size >= MAX_CANDIDATES) return [...found.values()];
        }
      }
    }
    return [...found.values()];
  }
}

export function createDiscoverySource(source: 'fixtures' | 'crtsh'): DomainDiscoverySource {
  return source === 'crtsh' ? new CrtShDiscoverySource() : new FixtureDiscoverySource();
}

export function isReservedDomain(domain: string): boolean {
  const tld = domain.split('.').at(-1) ?? '';
  return ['example', 'invalid', 'test', 'localhost', 'local', 'internal'].includes(tld);
}

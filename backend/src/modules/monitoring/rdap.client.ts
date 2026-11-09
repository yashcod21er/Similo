import { isIP } from 'node:net';

const IANA_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';
const LOOKUP_TIMEOUT_MS = 8_000;
const BOOTSTRAP_TIMEOUT_MS = 10_000;

interface BootstrapDocument {
  services?: unknown;
}

interface RdapDomainResponse {
  events?: unknown;
  entities?: unknown;
  nameservers?: unknown;
}

export interface RdapResult {
  registeredAt: Date | null;
  registrar: string | null;
  nameservers: string[];
  checkedAt: Date;
}

export interface RdapClient {
  lookup(domain: string): Promise<RdapResult | null>;
}

type BootstrapService = { tlds: string[]; urls: string[] };
let bootstrapCache: { loadedAt: number; services: BootstrapService[] } | undefined;
let bootstrapRequest: Promise<BootstrapService[]> | undefined;

function parseBootstrap(value: unknown): BootstrapService[] {
  const rows = (value as BootstrapDocument)?.services;
  if (!Array.isArray(rows)) throw new Error('IANA RDAP bootstrap returned an invalid document');
  return rows.flatMap((row): BootstrapService[] => {
    if (!Array.isArray(row) || !Array.isArray(row[0]) || !Array.isArray(row[1])) return [];
    const tlds = row[0].filter((tld): tld is string => typeof tld === 'string');
    const urls = row[1].filter((url): url is string => typeof url === 'string');
    return tlds.length && urls.length ? [{ tlds, urls }] : [];
  });
}

async function getBootstrap(): Promise<BootstrapService[]> {
  if (bootstrapCache && Date.now() - bootstrapCache.loadedAt < 24 * 60 * 60 * 1000) {
    return bootstrapCache.services;
  }
  if (!bootstrapRequest) {
    bootstrapRequest = (async () => {
      const response = await fetch(IANA_BOOTSTRAP_URL, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(BOOTSTRAP_TIMEOUT_MS),
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`IANA RDAP bootstrap returned HTTP ${response.status}`);
      const services = parseBootstrap(await response.json());
      bootstrapCache = { loadedAt: Date.now(), services };
      return services;
    })().finally(() => {
      bootstrapRequest = undefined;
    });
  }
  return bootstrapRequest;
}

function safeRdapBase(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || isIP(url.hostname))
      return null;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return null;
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function findRegistrar(entities: unknown): string | null {
  if (!Array.isArray(entities)) return null;
  for (const entity of entities) {
    if (!entity || typeof entity !== 'object') continue;
    const roles = (entity as { roles?: unknown }).roles;
    if (!Array.isArray(roles) || !roles.includes('registrar')) continue;
    const vcard = (entity as { vcardArray?: unknown }).vcardArray;
    if (!Array.isArray(vcard) || !Array.isArray(vcard[1])) continue;
    for (const item of vcard[1]) {
      if (!Array.isArray(item) || item.length < 4) continue;
      if ((item[0] === 'fn' || item[0] === 'org') && typeof item[3] === 'string') {
        return item[3].slice(0, 200);
      }
    }
  }
  return null;
}

function registrationDate(events: unknown): Date | null {
  if (!Array.isArray(events)) return null;
  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const row = event as { eventAction?: unknown; eventDate?: unknown };
    if (row.eventAction !== 'registration' || typeof row.eventDate !== 'string') continue;
    const date = new Date(row.eventDate);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** Uses the official IANA DNS bootstrap; it never constructs a lookup URL from user input. */
export class IanaRdapClient implements RdapClient {
  async lookup(domain: string): Promise<RdapResult | null> {
    const tld = domain.split('.').at(-1)?.toLowerCase();
    if (!tld) return null;
    const services = await getBootstrap();
    const service = services.find(({ tlds }) => tlds.some((value) => value.toLowerCase() === tld));
    const base = service?.urls.map(safeRdapBase).find((url) => url !== null) ?? null;
    if (!base) return null;

    const url = new URL(`domain/${encodeURIComponent(domain)}`, base);
    const response = await fetch(url, {
      headers: { Accept: 'application/rdap+json, application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      redirect: 'error',
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`RDAP lookup returned HTTP ${response.status}`);
    const payload = (await response.json()) as RdapDomainResponse;
    const nameservers = Array.isArray(payload.nameservers)
      ? payload.nameservers
          .map((item) =>
            item &&
            typeof item === 'object' &&
            'ldhName' in item &&
            typeof item.ldhName === 'string'
              ? item.ldhName.toLowerCase().slice(0, 253)
              : '',
          )
          .filter(Boolean)
          .slice(0, 20)
      : [];
    return {
      registeredAt: registrationDate(payload.events),
      registrar: findRegistrar(payload.entities),
      nameservers,
      checkedAt: new Date(),
    };
  }
}

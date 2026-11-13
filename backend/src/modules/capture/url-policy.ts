import { isBlockedAddress, isIpLiteral } from './ip-policy.js';

/**
 * Which URLs a page capture may request, before any DNS lookup.
 *
 * Only plain web pages: `http:` or `https:` on ports 80 or 443, a real public
 * host name (or a public IP literal), and no user name or password in the URL.
 * Every other scheme (file:, data:, ws:, ftp:, chrome:...) is refused.
 */

export const ALLOWED_PORTS: ReadonlySet<number> = new Set([80, 443]);

/** Names that only make sense inside a private network. */
const PRIVATE_SUFFIXES = [
  'localhost',
  'local',
  'localdomain',
  'internal',
  'intranet',
  'lan',
  'home.arpa',
  'in-addr.arpa',
  'ip6.arpa',
];

export type TargetCheck =
  | {
      ok: true;
      url: URL;
      /** Lower-case host name without brackets or trailing dot. */
      host: string;
      port: number;
      /** Set when the host is an IP literal (already checked). */
      ipLiteral: string | null;
    }
  | { ok: false; reason: string };

const LABEL = /^(?!-)[a-z\d_-]{1,63}(?<!-)$/;

/** Checks a host name and port (used for proxy CONNECT targets as well as URLs). */
export function checkHostPort(
  rawHost: string,
  port: number,
): { ok: true; host: string; ipLiteral: string | null } | { ok: false; reason: string } {
  if (!ALLOWED_PORTS.has(port)) return { ok: false, reason: `port ${port} is not allowed` };
  let host = rawHost.trim().toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  if (host.endsWith('.')) host = host.slice(0, -1);
  if (!host) return { ok: false, reason: 'missing host' };

  if (isIpLiteral(host)) {
    if (isBlockedAddress(host)) return { ok: false, reason: 'private or reserved IP address' };
    return { ok: true, host, ipLiteral: host };
  }

  if (host.length > 253) return { ok: false, reason: 'host name too long' };
  const labels = host.split('.');
  if (labels.length < 2 || !labels.every((label) => LABEL.test(label))) {
    return { ok: false, reason: 'invalid host name' };
  }
  // A purely numeric last label is an IPv4 form the URL parser did not normalise.
  if (/^\d+$/.test(labels.at(-1) ?? '')) return { ok: false, reason: 'invalid host name' };
  if (PRIVATE_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    return { ok: false, reason: 'private host name' };
  }
  return { ok: true, host, ipLiteral: null };
}

/** Checks a full URL a capture wants to load. */
export function checkTargetUrl(raw: string | URL): TargetCheck {
  let url: URL;
  try {
    url = new URL(String(raw));
  } catch {
    return { ok: false, reason: 'not a valid URL' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: `scheme ${url.protocol} is not allowed` };
  }
  if (url.username || url.password) return { ok: false, reason: 'credentials in URL' };
  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
  const hostCheck = checkHostPort(url.hostname, port);
  if (!hostCheck.ok) return hostCheck;
  return { ok: true, url, host: hostCheck.host, port, ipLiteral: hostCheck.ipLiteral };
}

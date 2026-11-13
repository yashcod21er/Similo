import { isIP } from 'node:net';

/**
 * Which IP addresses a page capture may connect to.
 *
 * Suspect sites are chosen by strangers, so a capture must never reach this
 * server's own network: loopback, private ranges, cloud metadata
 * (169.254.169.254), carrier-grade NAT, multicast and other special-purpose
 * ranges are all refused. IPv6 forms that embed an IPv4 address (mapped,
 * compatible, translated, NAT64 64:ff9b::/96, 6to4) are checked against the
 * IPv4 list too.
 *
 * Anything that cannot be parsed is treated as blocked (fail closed).
 */

type V4Range = readonly [base: string, prefix: number];

/** IANA special-purpose IPv4 ranges that must never be reached. */
export const BLOCKED_IPV4_RANGES: readonly V4Range[] = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, including cloud metadata 169.254.169.254
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation (TEST-NET-1)
  ['192.88.99.0', 24], // deprecated 6to4 relay anycast
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation (TEST-NET-2)
  ['203.0.113.0', 24], // documentation (TEST-NET-3)
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved
  ['255.255.255.255', 32], // broadcast
];

type V6Range = readonly [base: string, prefix: number];

/** IPv6 ranges blocked outright. */
export const BLOCKED_IPV6_RANGES: readonly V6Range[] = [
  ['::', 128], // unspecified
  ['::1', 128], // loopback
  ['64:ff9b:1::', 48], // local-use NAT64
  ['100::', 64], // discard-only
  ['2001::', 23], // IETF protocol assignments, including Teredo
  ['2001:db8::', 32], // documentation
  ['fc00::', 7], // unique local (private)
  ['fe80::', 10], // link-local
  ['fec0::', 10], // deprecated site-local
  ['ff00::', 8], // multicast
];

function parseIPv4(value: string): number[] | null {
  const parts = value.split('.');
  if (parts.length !== 4) return null;
  const bytes = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN));
  if (bytes.some((byte) => Number.isNaN(byte) || byte > 255)) return null;
  return bytes;
}

function v4ToInt(bytes: readonly number[]): number {
  return (((bytes[0] ?? 0) << 24) | ((bytes[1] ?? 0) << 16) | ((bytes[2] ?? 0) << 8) | (bytes[3] ?? 0)) >>> 0;
}

/** Parses an IPv6 address (optionally bracketed, with a zone id) into 16 bytes. */
export function parseIPv6(value: string): Uint8Array | null {
  let text = value.trim();
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1);
  const zone = text.indexOf('%');
  if (zone >= 0) text = text.slice(0, zone);
  if (!text.includes(':')) return null;

  // A trailing dotted IPv4 part (::ffff:10.0.0.1) becomes two hex groups.
  const lastColon = text.lastIndexOf(':');
  const tail = text.slice(lastColon + 1);
  if (tail.includes('.')) {
    const v4 = parseIPv4(tail);
    if (!v4) return null;
    const high = (((v4[0] ?? 0) << 8) | (v4[1] ?? 0)).toString(16);
    const low = (((v4[2] ?? 0) << 8) | (v4[3] ?? 0)).toString(16);
    text = `${text.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const halves = text.split('::');
  if (halves.length > 2) return null;
  const groups = (part: string): number[] =>
    part === ''
      ? []
      : part.split(':').map((group) => (/^[\da-f]{1,4}$/i.test(group) ? parseInt(group, 16) : NaN));
  const head = groups(halves[0] ?? '');
  const rest = halves.length === 2 ? groups(halves[1] ?? '') : [];
  let all: number[];
  if (halves.length === 2) {
    const missing = 8 - head.length - rest.length;
    if (missing < 1) return null;
    all = [...head, ...new Array<number>(missing).fill(0), ...rest];
  } else {
    all = head;
  }
  if (all.length !== 8 || all.some((group) => Number.isNaN(group))) return null;

  const bytes = new Uint8Array(16);
  all.forEach((group, index) => {
    bytes[index * 2] = group >> 8;
    bytes[index * 2 + 1] = group & 0xff;
  });
  return bytes;
}

function inV4Range(address: number, [base, prefix]: V4Range): boolean {
  const baseInt = v4ToInt(parseIPv4(base) ?? [0, 0, 0, 0]);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (address & mask) >>> 0 === (baseInt & mask) >>> 0;
}

function inV6Range(address: Uint8Array, [base, prefix]: V6Range): boolean {
  const baseBytes = parseIPv6(base);
  if (!baseBytes) return false;
  for (let bit = 0; bit < prefix; bit += 8) {
    const remaining = Math.min(8, prefix - bit);
    const mask = (0xff << (8 - remaining)) & 0xff;
    const index = bit / 8;
    if (((address[index] ?? 0) & mask) !== ((baseBytes[index] ?? 0) & mask)) return false;
  }
  return true;
}

function isBlockedIPv4(bytes: readonly number[]): boolean {
  const address = v4ToInt(bytes);
  return BLOCKED_IPV4_RANGES.some((range) => inV4Range(address, range));
}

/** The IPv4 address embedded in an IPv6 address, for the forms that carry one. */
function embeddedIPv4(bytes: Uint8Array): number[] | null {
  const zeros = (from: number, to: number) => bytes.slice(from, to).every((byte) => byte === 0);
  // ::ffff:a.b.c.d (mapped) and ::a.b.c.d (compatible)
  if (zeros(0, 10) && ((bytes[10] === 0xff && bytes[11] === 0xff) || zeros(10, 12))) {
    return [...bytes.slice(12, 16)];
  }
  // ::ffff:0:a.b.c.d (translated)
  if (zeros(0, 8) && bytes[8] === 0xff && bytes[9] === 0xff && zeros(10, 12)) {
    return [...bytes.slice(12, 16)];
  }
  // 64:ff9b::a.b.c.d (NAT64 well-known prefix). RFC 6052 forbids it for non-global
  // IPv4, and networks with DNS64 answer every IPv4-only name this way, so the
  // embedded IPv4 address is checked instead of refusing the whole prefix.
  if (bytes[0] === 0x00 && bytes[1] === 0x64 && bytes[2] === 0xff && bytes[3] === 0x9b && zeros(4, 12)) {
    return [...bytes.slice(12, 16)];
  }
  // 2002:aabb:ccdd::/48 (6to4)
  if (bytes[0] === 0x20 && bytes[1] === 0x02) return [...bytes.slice(2, 6)];
  return null;
}

/**
 * True when a capture must not connect to `address`. Accepts IPv4, IPv6,
 * bracketed IPv6 and zone ids; anything else is blocked.
 */
export function isBlockedAddress(address: string): boolean {
  let text = address.trim();
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1);
  const zone = text.indexOf('%');
  const bare = zone >= 0 ? text.slice(0, zone) : text;
  const version = isIP(bare);

  if (version === 4) {
    const bytes = parseIPv4(bare);
    return !bytes || isBlockedIPv4(bytes);
  }
  if (version === 6) {
    const bytes = parseIPv6(bare);
    if (!bytes) return true;
    if (BLOCKED_IPV6_RANGES.some((range) => inV6Range(bytes, range))) return true;
    const v4 = embeddedIPv4(bytes);
    return v4 ? isBlockedIPv4(v4) : false;
  }
  return true;
}

/** True when `value` is an IP address literal (IPv4 or IPv6, brackets allowed). */
export function isIpLiteral(value: string): boolean {
  const text = value.startsWith('[') && value.endsWith(']') ? value.slice(1, -1) : value;
  return isIP(text) !== 0;
}

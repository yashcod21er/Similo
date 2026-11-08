import { domainToASCII } from 'node:url';

/** Longest hostname DNS allows. */
const MAX_DOMAIN_LENGTH = 253;
const LABEL = /^(?!-)[a-z\d-]{1,63}(?<!-)$/;
/** A top-level domain: 2+ letters, or an internationalised one in punycode (xn--…). */
const TLD = /^(?:[a-z]{2,63}|xn--[a-z\d-]{1,59})$/;

/**
 * Turns what a person types or pastes into the bare domain we store, or null
 * when it is not a valid domain:
 *
 *   "  https://www.Example.com:8080/path?q=1 "  →  "example.com"
 *   "bücher.de"                                 →  "xn--bcher-kva.de"  (punycode)
 *
 * Steps: trim, lowercase, drop http(s)://, path, query, fragment, port, a
 * trailing dot and a leading "www.", convert international names to punycode,
 * then check every label and that the last one is a real-looking TLD.
 */
export function normalizeDomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value || value.length > 2048) return null;

  value = value.replace(/^https?:\/\//, '');
  value = value.split(/[/?#]/, 1)[0] ?? '';
  value = value.replace(/:\d{1,5}$/, '');
  value = value.replace(/\.$/, '');
  value = value.replace(/^www\./, '');

  // Anything still holding these is a URL with credentials, a port typo or junk.
  if (!value || /[\s@:\\]/.test(value)) return null;

  const ascii = domainToASCII(value);
  if (!ascii || ascii.length > MAX_DOMAIN_LENGTH) return null;

  const labels = ascii.split('.');
  if (labels.length < 2 || !labels.every((label) => LABEL.test(label))) return null;
  if (!TLD.test(labels.at(-1) ?? '')) return null;
  return ascii;
}

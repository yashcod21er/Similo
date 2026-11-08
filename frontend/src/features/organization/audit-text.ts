import type { AuditEvent } from './api';
import { ROLE_OPTIONS } from './roles';

const roleLabel = (value: unknown) =>
  ROLE_OPTIONS.find((option) => option.value === value)?.label ?? String(value ?? '');

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value : fallback;

/** "the domain acme.com", or just "a domain" when the entry doesn't say which. */
const named = (noun: string, value: unknown, quoted = false) => {
  const name = typeof value === 'string' ? value.trim() : '';
  return name ? `the ${noun} ${quoted ? `“${name}”` : name}` : `a ${noun}`;
};

const FIELD_WORDS: Record<string, string> = {
  name: 'name',
  description: 'description',
  keywords: 'keywords',
  status: 'status',
};

/** "Paused “Acme”", "Renamed “Old” to “New”", or "Changed the keywords of “Acme”". */
function describeBrandUpdate(brand: string, meta: Record<string, unknown>): string {
  const fields = Array.isArray(meta.fields) ? meta.fields.map(String) : [];
  const previousName = typeof meta.previousName === 'string' ? meta.previousName.trim() : '';
  if (fields.length === 1 && fields[0] === 'status') {
    if (meta.status === 'paused') return `Paused the brand ${brand}`;
    if (meta.status === 'active') return `Resumed the brand ${brand}`;
  }
  if (fields.length === 1 && fields[0] === 'name' && previousName) {
    return `Renamed the brand “${previousName}” to ${brand}`;
  }
  const words = fields.map((field) => FIELD_WORDS[field]).filter(Boolean);
  if (words.length === 0) return `Changed the details of ${brand}`;
  const list = words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0];
  return `Changed the ${list} of ${brand}`;
}

const TRADEMARK_FIELD_LABELS: Record<string, string> = {
  mark: 'name',
  office: 'office',
  number: 'number',
  status: 'status',
  date: 'date',
  classes: 'classes',
};

/** "Changed the status and classes of the trademark “ACME” on “Acme”". */
function describeTrademarkUpdate(mark: string, brand: string, fields: unknown): string {
  const labels = Array.isArray(fields)
    ? fields.map((field) => TRADEMARK_FIELD_LABELS[String(field)]).filter(Boolean)
    : [];
  if (labels.length === 0) return `Changed ${mark} on ${brand}`;
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  return `Changed the ${list} of ${mark} on ${brand}`;
}

/** One plain sentence per audit entry. */
export function describeAuditEvent(event: AuditEvent): string {
  const target = event.target?.label ?? 'someone';
  const meta = event.metadata;
  // Brand events carry the brand's name (and the domain, trademark or file they touched).
  const brand = `“${text(meta.brandName, event.target?.label ?? 'a brand')}”`;
  const domain = named('domain', meta.domain);
  const mark = named('trademark', meta.mark, true);
  const file = named('logo', meta.fileName);
  switch (event.action) {
    case 'auth.signed_up':
      return 'Created the organisation';
    case 'auth.signed_in':
      return 'Signed in';
    case 'auth.signed_out':
      return 'Signed out';
    case 'auth.sign_in_failed':
      return 'Failed to sign in (wrong password)';
    case 'auth.account_locked':
      return 'Sign-in paused after repeated wrong passwords';
    case 'auth.password_changed':
      return 'Changed their password and signed out other devices';
    case 'organization.renamed':
      return `Renamed the organisation to “${String(meta.to ?? '')}”`;
    case 'member.invited':
      return `Invited ${target} as ${roleLabel(meta.role)}`;
    case 'member.invite_revoked':
      return `Cancelled the invitation for ${target}`;
    case 'member.joined':
      return `Joined as ${roleLabel(meta.role)}`;
    case 'member.role_changed':
      return `Changed ${target}'s role from ${roleLabel(meta.from)} to ${roleLabel(meta.to)}`;
    case 'member.removed':
      return `Removed ${target}`;
    case 'brand.created':
      return `Added the brand ${brand}`;
    case 'brand.updated':
      return describeBrandUpdate(brand, meta);
    case 'brand.deleted':
      return `Deleted the brand ${brand}`;
    case 'brand.domain_added':
      return `Added ${domain} to ${brand}`;
    case 'brand.domain_removed':
      return `Removed ${domain} from ${brand}`;
    case 'brand.trademark_added':
      return `Added ${mark} to ${brand}`;
    case 'brand.trademark_updated':
      return describeTrademarkUpdate(mark, brand, meta.fields);
    case 'brand.trademark_removed':
      return `Removed ${mark} from ${brand}`;
    case 'brand.logo_uploaded':
      return `Uploaded ${file} to ${brand}`;
    case 'brand.logo_removed':
      return `Removed ${file} from ${brand}`;
    case 'brand.monitoring_updated':
      return `Changed the monitoring settings of ${brand}`;
    default:
      return event.action;
  }
}

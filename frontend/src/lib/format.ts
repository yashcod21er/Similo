/** "Asha Rao" → "AR" (avatar fallback). */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "8 Nov 2026" */
export const formatDate = (iso: string) => date.format(new Date(iso));

/** "8 Nov 2026, 14:05" */
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

/** Whole days left until `iso` (0 once it has passed). */
export function daysUntil(iso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}

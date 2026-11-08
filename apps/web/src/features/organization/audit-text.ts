import type { AuditEvent } from './api';
import { ROLE_OPTIONS } from './roles';

const roleLabel = (value: unknown) =>
  ROLE_OPTIONS.find((option) => option.value === value)?.label ?? String(value ?? '');

/** One plain sentence per audit entry. */
export function describeAuditEvent(event: AuditEvent): string {
  const target = event.target?.label ?? 'someone';
  const meta = event.metadata;
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
    default:
      return event.action;
  }
}

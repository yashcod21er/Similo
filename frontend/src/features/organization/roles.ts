import type { Permission, Role } from '@/features/auth/api';

/** Plain-language role descriptions, shown wherever a role is chosen. */
export const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full control, including ownership and deleting the organisation.',
  },
  { value: 'admin', label: 'Admin', description: 'Manages people, settings and brands.' },
  {
    value: 'analyst',
    label: 'Investigation Analyst',
    description: 'Works on alerts and investigations.',
  },
  {
    value: 'legal',
    label: 'Legal Reviewer',
    description: 'Reviews legal drafts and reads the audit log.',
  },
  { value: 'viewer', label: 'Viewer', description: 'Sees everything, changes nothing.' },
];

/** What each permission means to a person, and whether its feature exists yet. */
export const PERMISSION_LABELS: Record<Permission, { label: string; soon?: boolean }> = {
  'organization:read': { label: 'See the organisation and its members' },
  'members:read': { label: 'See who is in the team' },
  'organization:update': { label: 'Change organisation settings' },
  'members:manage': { label: 'Invite people, change roles and remove members' },
  'audit:read': { label: 'Read the audit log' },
  'organization:delete': { label: 'Delete the organisation', soon: true },
  'brands:read': { label: 'See protected brands' },
  'brands:manage': { label: 'Add and edit protected brands' },
  'findings:read': { label: 'See alerts about possible copycats', soon: true },
  'findings:update': { label: 'Work on alerts', soon: true },
  'investigations:manage': { label: 'Run investigations and collect evidence', soon: true },
  'drafts:review': { label: 'Review and approve legal drafts', soon: true },
};

/** Who may change `member`'s role or remove them — mirrors the API's rules. */
export function canManageMember(
  myRole: Role,
  canManage: boolean,
  member: { role: Role; isYou: boolean },
): boolean {
  if (!canManage || member.isYou) return false;
  return member.role !== 'owner' || myRole === 'owner';
}

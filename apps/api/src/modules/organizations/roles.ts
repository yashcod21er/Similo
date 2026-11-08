/**
 * Roles and permissions — the single source of truth.
 *
 * The API checks permissions on every protected route with
 * `requirePermission('members:manage')`. The website receives the same list
 * (`permissions` in GET /auth/me) only to decide which buttons to show; hiding
 * a button is never the security boundary.
 *
 * Permissions for later phases (brands, findings, investigations, drafts) are
 * declared now so each phase only plugs into this table.
 */
export const ROLES = ['owner', 'admin', 'analyst', 'legal', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  analyst: 'Investigation Analyst',
  legal: 'Legal Reviewer',
  viewer: 'Viewer',
};

const EVERYONE = ROLES;
const MANAGERS = ['owner', 'admin'] as const;

export const PERMISSIONS = {
  'organization:read': EVERYONE,
  'organization:update': MANAGERS,
  'organization:delete': ['owner'],
  'members:read': EVERYONE,
  'members:manage': MANAGERS,
  'audit:read': ['owner', 'admin', 'legal'],
  // Phase 4
  'brands:read': EVERYONE,
  'brands:manage': MANAGERS,
  // Phases 5–7
  'findings:read': EVERYONE,
  'findings:update': ['owner', 'admin', 'analyst'],
  'investigations:manage': ['owner', 'admin', 'analyst'],
  // Phases 7–8
  'drafts:review': ['owner', 'admin', 'legal'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function permissionsFor(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((permission) => can(role, permission));
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

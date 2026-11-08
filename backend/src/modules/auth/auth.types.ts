import type { Permission, Role } from '../organizations/roles.js';

/** Where a request came from; recorded in sessions and the audit log. */
export interface RequestContext {
  ip: string;
  userAgent: string;
}

/**
 * Who is making the request. Set by `requireAuth` from the session cookie and
 * read with `getAuth(res)`. The organisation always comes from here, never
 * from the request body or URL.
 */
export interface AuthContext extends RequestContext {
  sessionId: string;
  user: { id: string; name: string; email: string };
  organizationId: string;
  role: Role;
}

/** What GET /auth/me returns: everything the website needs about the signed-in user. */
export interface MeDto {
  user: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  role: Role;
  roleLabel: string;
  /** For showing or hiding buttons only — the API enforces permissions itself. */
  permissions: Permission[];
}

import { describe, expect, it } from 'vitest';
import { can, permissionsFor, PERMISSIONS, ROLES } from '../src/modules/organizations/roles.js';

describe('roles and permissions', () => {
  it('gives the Owner every permission', () => {
    expect(permissionsFor('owner')).toEqual(Object.keys(PERMISSIONS));
  });

  it('lets Viewers read but never change anything', () => {
    for (const permission of permissionsFor('viewer')) {
      expect(permission).toMatch(/:read$/);
    }
  });

  it('matches the role table agreed for Phase 2', () => {
    const matrix: Record<string, Record<(typeof ROLES)[number], boolean>> = {
      'members:manage': { owner: true, admin: true, analyst: false, legal: false, viewer: false },
      'organization:update': {
        owner: true,
        admin: true,
        analyst: false,
        legal: false,
        viewer: false,
      },
      'organization:delete': {
        owner: true,
        admin: false,
        analyst: false,
        legal: false,
        viewer: false,
      },
      'audit:read': { owner: true, admin: true, analyst: false, legal: true, viewer: false },
      'findings:update': { owner: true, admin: true, analyst: true, legal: false, viewer: false },
      'drafts:review': { owner: true, admin: true, analyst: false, legal: true, viewer: false },
      'members:read': { owner: true, admin: true, analyst: true, legal: true, viewer: true },
    };
    for (const [permission, expected] of Object.entries(matrix)) {
      for (const role of ROLES) {
        expect(can(role, permission as keyof typeof PERMISSIONS), `${role} → ${permission}`).toBe(
          expected[role],
        );
      }
    }
  });
});

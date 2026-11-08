import { describe, expect, it } from 'vitest';
import type { AuditEvent } from './api';
import { describeAuditEvent } from './audit-text';
import { canManageMember } from './roles';

describe('canManageMember (mirrors the API rules)', () => {
  const member = (role: 'owner' | 'admin' | 'viewer', isYou = false) => ({ role, isYou });

  it('lets Owners and Admins manage other members', () => {
    expect(canManageMember('owner', true, member('admin'))).toBe(true);
    expect(canManageMember('admin', true, member('viewer'))).toBe(true);
  });

  it('keeps Owners out of reach of Admins', () => {
    expect(canManageMember('admin', true, member('owner'))).toBe(false);
    expect(canManageMember('owner', true, member('owner'))).toBe(true);
  });

  it('never offers to change your own role or remove yourself', () => {
    expect(canManageMember('owner', true, member('owner', true))).toBe(false);
  });

  it('offers nothing to roles without members:manage', () => {
    expect(canManageMember('viewer', false, member('viewer'))).toBe(false);
  });
});

describe('describeAuditEvent', () => {
  const event = (overrides: Partial<AuditEvent>): AuditEvent => ({
    id: '1',
    action: 'auth.signed_in',
    actor: { name: 'Asha Rao', email: 'asha@acme.example' },
    target: null,
    metadata: {},
    ip: '127.0.0.1',
    createdAt: '2026-11-08T10:00:00.000Z',
    ...overrides,
  });

  it('turns each entry into a plain sentence', () => {
    expect(describeAuditEvent(event({}))).toBe('Signed in');
    expect(
      describeAuditEvent(
        event({
          action: 'member.role_changed',
          target: { type: 'user', label: 'ravi@acme.example' },
          metadata: { from: 'viewer', to: 'admin' },
        }),
      ),
    ).toBe("Changed ravi@acme.example's role from Viewer to Admin");
    expect(
      describeAuditEvent(
        event({
          action: 'member.invited',
          target: { type: 'invite', label: 'new@acme.example' },
          metadata: { role: 'legal' },
        }),
      ),
    ).toBe('Invited new@acme.example as Legal Reviewer');
  });

  it('falls back to the raw action name for anything unknown', () => {
    expect(describeAuditEvent(event({ action: 'future.thing' }))).toBe('future.thing');
  });
});

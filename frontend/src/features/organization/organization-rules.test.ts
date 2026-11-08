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

  it('describes every brand action with the brand name and what was touched', () => {
    const brand = (action: string, metadata: Record<string, unknown>) =>
      describeAuditEvent(
        event({
          action,
          target: { type: 'brand', label: 'Acme' },
          metadata: { brandName: 'Acme', ...metadata },
        }),
      );

    expect(brand('brand.created', {})).toBe('Added the brand “Acme”');
    expect(brand('brand.updated', {})).toBe('Changed the details of “Acme”');
    expect(brand('brand.deleted', {})).toBe('Deleted the brand “Acme”');
    expect(brand('brand.domain_added', { domain: 'acme.com' })).toBe(
      'Added the domain acme.com to “Acme”',
    );
    expect(brand('brand.domain_removed', { domain: 'acme.com' })).toBe(
      'Removed the domain acme.com from “Acme”',
    );
    expect(brand('brand.trademark_added', { mark: 'ACME' })).toBe(
      'Added the trademark “ACME” to “Acme”',
    );
    expect(brand('brand.trademark_updated', { mark: 'ACME' })).toBe(
      'Changed the trademark “ACME” on “Acme”',
    );
    expect(brand('brand.trademark_removed', { mark: 'ACME' })).toBe(
      'Removed the trademark “ACME” from “Acme”',
    );
    expect(brand('brand.logo_uploaded', { fileName: 'logo.png' })).toBe(
      'Uploaded the logo logo.png to “Acme”',
    );
    expect(brand('brand.logo_removed', { fileName: 'logo.png' })).toBe(
      'Removed the logo logo.png from “Acme”',
    );
    expect(brand('brand.monitoring_updated', {})).toBe('Changed the monitoring settings of “Acme”');
  });

  it('says what changed when a brand was edited', () => {
    const updated = (metadata: Record<string, unknown>) =>
      describeAuditEvent(
        event({
          action: 'brand.updated',
          target: { type: 'brand', label: 'Acme' },
          metadata: { brandName: 'Acme', ...metadata },
        }),
      );

    expect(updated({ fields: ['status'], status: 'paused' })).toBe('Paused the brand “Acme”');
    expect(updated({ fields: ['status'], status: 'active' })).toBe('Resumed the brand “Acme”');
    expect(updated({ fields: ['name'], previousName: 'Acme Old' })).toBe(
      'Renamed the brand “Acme Old” to “Acme”',
    );
    expect(updated({ fields: ['keywords'] })).toBe('Changed the keywords of “Acme”');
    expect(updated({ fields: ['name', 'description', 'keywords'], previousName: 'Old' })).toBe(
      'Changed the name, description and keywords of “Acme”',
    );
  });

  it('still reads well when a brand event is missing some details', () => {
    expect(describeAuditEvent(event({ action: 'brand.domain_added' }))).toBe(
      'Added a domain to “a brand”',
    );
    expect(
      describeAuditEvent(
        event({ action: 'brand.deleted', target: { type: 'brand', label: 'Old name' } }),
      ),
    ).toBe('Deleted the brand “Old name”');
  });

  it('falls back to the raw action name for anything unknown', () => {
    expect(describeAuditEvent(event({ action: 'future.thing' }))).toBe('future.thing');
  });
});

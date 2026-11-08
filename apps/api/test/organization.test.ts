import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { INVITE_TTL_MS } from '../src/modules/organizations/organization.service.js';
import type { Role } from '../src/modules/organizations/roles.js';
import { buildAuthTestApp } from './helpers.js';

const OWNER_PASSWORD = 'correct horse battery staple';
const MEMBER_PASSWORD = 'quiet orange mountain river';

async function organisation() {
  const context = buildAuthTestApp();
  const owner = request.agent(context.app);
  await owner
    .post('/api/v1/auth/sign-up')
    .send({
      name: 'Asha Rao',
      email: 'asha@acme.example',
      password: OWNER_PASSWORD,
      organizationName: 'Acme Brands',
    })
    .expect(201);

  const invite = (email: string, role: Role, as = owner) =>
    as.post('/api/v1/organization/invites').send({ email, role });

  /** Invites someone with `role` and accepts in a fresh browser session. */
  async function join(email: string, role: Role) {
    const created = await invite(email, role);
    expect(created.status).toBe(201);
    const token = String(created.body.data.inviteUrl).split('/invite/')[1];
    const agent = request.agent(context.app);
    const accepted = await agent
      .post(`/api/v1/auth/invites/${token}/accept`)
      .send({ name: `Person ${role}`, password: MEMBER_PASSWORD });
    expect(accepted.status).toBe(201);
    const id = accepted.body.data.user.id as string;
    return { agent, id };
  }

  const ownerId = ((await owner.get('/api/v1/auth/me')).body.data.user.id as string) ?? '';
  return { ...context, owner, ownerId, invite, join };
}

describe('invitations', () => {
  it('invites a teammate with a single-use link', async () => {
    const { app, owner, invite, stores } = await organisation();

    const created = await invite('Ravi@Acme.example', 'analyst');
    expect(created.status).toBe(201);
    expect(created.body.data.invite).toMatchObject({
      email: 'ravi@acme.example',
      role: 'analyst',
      roleLabel: 'Investigation Analyst',
      invitedBy: 'Asha Rao',
    });
    const url = String(created.body.data.inviteUrl);
    expect(url).toMatch(/^http:\/\/localhost:5173\/invite\/[\w-]{43}$/);
    const token = url.split('/invite/')[1];

    const preview = await request(app).get(`/api/v1/auth/invites/${token}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data).toMatchObject({
      organizationName: 'Acme Brands',
      email: 'ravi@acme.example',
      role: 'analyst',
      invitedBy: 'Asha Rao',
      accountExists: false,
    });

    const ravi = request.agent(app);
    const accepted = await ravi
      .post(`/api/v1/auth/invites/${token}/accept`)
      .send({ name: 'Ravi Kumar', password: MEMBER_PASSWORD });
    expect(accepted.status).toBe(201);
    expect(accepted.body.data).toMatchObject({
      user: { email: 'ravi@acme.example', name: 'Ravi Kumar' },
      organization: { name: 'Acme Brands' },
      role: 'analyst',
    });
    expect((await ravi.get('/api/v1/auth/me')).body.data.role).toBe('analyst');

    // The link works once.
    const reuse = await request(app).get(`/api/v1/auth/invites/${token}`);
    expect(reuse.status).toBe(404);
    expect(reuse.body.error.code).toBe('INVITE_INVALID');

    const members = await owner.get('/api/v1/organization/members');
    expect(members.body.data.map((m: { email: string }) => m.email)).toEqual([
      'asha@acme.example',
      'ravi@acme.example',
    ]);
    expect(stores.audit.map((event) => event.action)).toEqual(
      expect.arrayContaining(['member.invited', 'member.joined']),
    );
  });

  it('stores only a hash of the link and stops it working after 7 days', async () => {
    const { app, invite, clock, stores } = await organisation();
    const token = String((await invite('late@acme.example', 'viewer')).body.data.inviteUrl).split(
      '/invite/',
    )[1];
    const [stored] = [...stores.invites.values()];
    expect(stored?.tokenHash).not.toBe(token);

    clock.advance(INVITE_TTL_MS + 1000);
    expect((await request(app).get(`/api/v1/auth/invites/${token}`)).status).toBe(404);
  });

  it('lists and revokes pending invitations', async () => {
    const { app, owner, invite } = await organisation();
    const created = await invite('maybe@acme.example', 'viewer');
    const token = String(created.body.data.inviteUrl).split('/invite/')[1];
    const inviteId = created.body.data.invite.id as string;

    const pending = await owner.get('/api/v1/organization/invites');
    expect(pending.body.data).toHaveLength(1);

    expect((await owner.delete(`/api/v1/organization/invites/${inviteId}`)).status).toBe(200);
    expect((await owner.get('/api/v1/organization/invites')).body.data).toHaveLength(0);
    expect((await request(app).get(`/api/v1/auth/invites/${token}`)).status).toBe(404);
  });

  it('refuses to invite someone who is already a member', async () => {
    const { invite } = await organisation();
    const res = await invite('asha@acme.example', 'viewer');
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/already a member/);
  });
});

describe('roles are enforced by the API', () => {
  it('lets each role do exactly what the role table allows', async () => {
    const { join } = await organisation();
    const viewer = await join('viewer@acme.example', 'viewer');
    const analyst = await join('analyst@acme.example', 'analyst');
    const legal = await join('legal@acme.example', 'legal');
    const admin = await join('admin@acme.example', 'admin');

    // Everyone can see the organisation and its members.
    for (const { agent } of [viewer, analyst, legal, admin]) {
      expect((await agent.get('/api/v1/organization/members')).status).toBe(200);
    }

    // Only Owners and Admins manage people and settings.
    const forbidden = await viewer.agent
      .post('/api/v1/organization/invites')
      .send({ email: 'x@acme.example', role: 'viewer' });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
    expect((await analyst.agent.patch('/api/v1/organization').send({ name: 'X Co' })).status).toBe(
      403,
    );
    expect(
      (await admin.agent.patch('/api/v1/organization').send({ name: 'Acme Ltd' })).status,
    ).toBe(200);
    expect(
      (
        await admin.agent
          .post('/api/v1/organization/invites')
          .send({ email: 'new@acme.example', role: 'analyst' })
      ).status,
    ).toBe(201);

    // The audit log is for Owners, Admins and Legal Reviewers.
    expect((await legal.agent.get('/api/v1/audit-events')).status).toBe(200);
    expect((await admin.agent.get('/api/v1/audit-events')).status).toBe(200);
    expect((await analyst.agent.get('/api/v1/audit-events')).status).toBe(403);
    expect((await viewer.agent.get('/api/v1/audit-events')).status).toBe(403);
  });

  it('applies a role change immediately, without signing in again', async () => {
    const { owner, join } = await organisation();
    const person = await join('grow@acme.example', 'viewer');
    const tryInvite = () =>
      person.agent
        .post('/api/v1/organization/invites')
        .send({ email: 'friend@acme.example', role: 'viewer' });

    expect((await tryInvite()).status).toBe(403);
    const promoted = await owner
      .patch(`/api/v1/organization/members/${person.id}`)
      .send({ role: 'admin' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.data).toMatchObject({ role: 'admin', roleLabel: 'Admin' });
    expect((await tryInvite()).status).toBe(201);
  });

  it('keeps Owner powers with Owners', async () => {
    const { owner, ownerId, join } = await organisation();
    const admin = await join('admin@acme.example', 'admin');

    const tries = [
      admin.agent
        .post('/api/v1/organization/invites')
        .send({ email: 'o@acme.example', role: 'owner' }),
      admin.agent.patch(`/api/v1/organization/members/${ownerId}`).send({ role: 'viewer' }),
      admin.agent.delete(`/api/v1/organization/members/${ownerId}`),
    ];
    for (const res of await Promise.all(tries)) {
      expect(res.status).toBe(403);
    }

    // An Owner can make someone else an Owner.
    const promoted = await owner
      .patch(`/api/v1/organization/members/${admin.id}`)
      .send({ role: 'owner' });
    expect(promoted.status).toBe(200);
  });

  it("doesn't let people change their own role or remove themselves", async () => {
    const { owner, ownerId } = await organisation();
    expect(
      (await owner.patch(`/api/v1/organization/members/${ownerId}`).send({ role: 'viewer' }))
        .status,
    ).toBe(400);
    expect((await owner.delete(`/api/v1/organization/members/${ownerId}`)).status).toBe(400);
  });

  it('signs a removed member out everywhere, immediately', async () => {
    const { owner, join, stores } = await organisation();
    const person = await join('leaving@acme.example', 'analyst');
    expect((await person.agent.get('/api/v1/auth/me')).status).toBe(200);

    expect((await owner.delete(`/api/v1/organization/members/${person.id}`)).status).toBe(200);
    expect((await person.agent.get('/api/v1/auth/me')).status).toBe(401);
    expect(stores.audit.map((event) => event.action)).toContain('member.removed');
  });

  it('validates IDs in URLs before touching the database', async () => {
    const { owner } = await organisation();
    const res = await owner
      .patch('/api/v1/organization/members/not-an-id')
      .send({ role: 'viewer' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('audit log', () => {
  it('lists events newest first, one page at a time', async () => {
    const { owner, invite } = await organisation();
    for (const name of ['a', 'b', 'c']) await invite(`${name}@acme.example`, 'viewer');

    const first = await owner.get('/api/v1/audit-events?limit=2');
    expect(first.status).toBe(200);
    expect(first.body.data.events).toHaveLength(2);
    expect(first.body.data.events[0]).toMatchObject({
      action: 'member.invited',
      actor: { name: 'Asha Rao' },
      target: { label: 'c@acme.example' },
    });
    expect(first.body.data.nextCursor).toEqual(expect.any(String));

    const second = await owner.get(
      `/api/v1/audit-events?limit=2&before=${encodeURIComponent(first.body.data.nextCursor)}`,
    );
    const labels = second.body.data.events.map(
      (e: { target: { label: string } | null }) => e.target?.label,
    );
    expect(labels).toEqual(['a@acme.example', 'Acme Brands']);
    expect(second.body.data.nextCursor).toBeNull();
  });
});

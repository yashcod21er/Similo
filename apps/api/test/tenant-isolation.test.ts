import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildAuthTestApp } from './helpers.js';

/**
 * The most important security property of a multi-tenant product:
 * one organisation can never read or change another organisation's data,
 * even when it knows (or guesses) the other side's IDs.
 */
async function twoOrganisations() {
  const { app, stores } = buildAuthTestApp();
  const signUp = async (email: string, organizationName: string) => {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/auth/sign-up').send({
      name: 'Owner Person',
      email,
      password: 'correct horse battery staple',
      organizationName,
    });
    expect(res.status).toBe(201);
    return { agent, me: res.body.data as { user: { id: string }; organization: { id: string } } };
  };

  const a = await signUp('owner@alpha.example', 'Alpha Ltd');
  const b = await signUp('owner@beta.example', 'Beta Ltd');
  const bInvite = await b.agent
    .post('/api/v1/organization/invites')
    .send({ email: 'pending@beta.example', role: 'viewer' });
  expect(bInvite.status).toBe(201);

  return { app, stores, a, b, bInviteId: bInvite.body.data.invite.id as string };
}

describe('tenant isolation', () => {
  it('shows each organisation only its own members, invites and audit log', async () => {
    const { a } = await twoOrganisations();

    const members = await a.agent.get('/api/v1/organization/members');
    expect(members.body.data.map((m: { email: string }) => m.email)).toEqual([
      'owner@alpha.example',
    ]);

    const invites = await a.agent.get('/api/v1/organization/invites');
    expect(invites.body.data).toEqual([]);

    const audit = await a.agent.get('/api/v1/audit-events');
    expect(JSON.stringify(audit.body)).not.toContain('beta.example');
    expect(JSON.stringify(audit.body)).not.toContain('Beta Ltd');
  });

  it("can't change or remove another organisation's members, even with their IDs", async () => {
    const { a, b } = await twoOrganisations();
    const target = b.me.user.id;

    const change = await a.agent.patch(`/api/v1/organization/members/${target}`).send({
      role: 'viewer',
    });
    const remove = await a.agent.delete(`/api/v1/organization/members/${target}`);
    for (const res of [change, remove]) {
      expect(res.status).toBe(404);
    }

    // Beta's Owner is untouched and still signed in.
    const bMe = await b.agent.get('/api/v1/auth/me');
    expect(bMe.status).toBe(200);
    expect(bMe.body.data.role).toBe('owner');
  });

  it("can't revoke another organisation's invitations", async () => {
    const { a, b, bInviteId } = await twoOrganisations();
    expect((await a.agent.delete(`/api/v1/organization/invites/${bInviteId}`)).status).toBe(404);
    expect((await b.agent.get('/api/v1/organization/invites')).body.data).toHaveLength(1);
  });

  it('ignores any organisation ID sent in the request body', async () => {
    const { a, b, stores } = await twoOrganisations();
    const res = await a.agent
      .patch('/api/v1/organization')
      .send({ name: 'Alpha Renamed', organizationId: b.me.organization.id });
    expect(res.status).toBe(200);
    expect(stores.organizations.get(a.me.organization.id)?.name).toBe('Alpha Renamed');
    expect(stores.organizations.get(b.me.organization.id)?.name).toBe('Beta Ltd');
  });
});

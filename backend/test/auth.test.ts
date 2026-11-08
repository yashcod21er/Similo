import request, { type Response } from 'supertest';
import { describe, expect, it } from 'vitest';
import { LOCK_MS, MAX_FAILED_SIGN_INS } from '../src/modules/auth/auth.service.js';
import { SESSION_IDLE_MS, SESSION_MAX_MS } from '../src/modules/sessions/session.service.js';
import { buildAuthTestApp, RELAXED_RATE_LIMITS } from './helpers.js';

const PASSWORD = 'correct horse battery staple';
const NEW_PASSWORD = 'violet lantern drifts north';
const ASHA = {
  name: 'Asha Rao',
  email: 'Asha.Rao@Example.com',
  password: PASSWORD,
  organizationName: 'Acme Brands',
};
const DAY = 24 * 60 * 60 * 1000;

function setCookie(res: Response): string {
  const raw = res.headers['set-cookie'] as string[] | string | undefined;
  return Array.isArray(raw) ? raw.join('\n') : (raw ?? '');
}

function tokenFrom(res: Response): string {
  return /similo_session=([\w-]+)/.exec(setCookie(res))?.[1] ?? '';
}

async function registered() {
  const context = buildAuthTestApp();
  const agent = request.agent(context.app);
  const signUp = await agent.post('/api/v1/auth/sign-up').send(ASHA);
  expect(signUp.status).toBe(201);
  return { ...context, agent, signUp };
}

describe('sign up', () => {
  it('creates the organisation, makes the person its Owner and signs them in', async () => {
    const { agent, signUp, stores } = await registered();

    expect(signUp.body.data).toMatchObject({
      user: { name: 'Asha Rao', email: 'asha.rao@example.com' },
      organization: { name: 'Acme Brands' },
      role: 'owner',
      roleLabel: 'Owner',
    });
    expect(signUp.body.data.permissions).toContain('members:manage');

    // The session token travels only in an HTTP-only cookie, never in the body.
    const cookie = setCookie(signUp);
    expect(cookie).toMatch(/^similo_session=[\w-]{43};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toContain('Secure'); // local http; production sets Secure + __Host-
    expect(JSON.stringify(signUp.body)).not.toContain(tokenFrom(signUp));

    // Stored safely: the session as a hash, the password as Argon2id.
    const [session] = [...stores.sessions.values()];
    expect(session?.tokenHash).toMatch(/^[a-f\d]{64}$/);
    expect(session?.tokenHash).not.toBe(tokenFrom(signUp));
    const [user] = [...stores.users.values()];
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('asha.rao@example.com');
    expect(me.headers['cache-control']).toBe('no-store');
  });

  it('records the sign-up in the audit log', async () => {
    const { stores } = await registered();
    expect(stores.audit.map((event) => event.action)).toEqual(['auth.signed_up']);
  });

  it('rejects weak passwords with a plain, field-level message', async () => {
    const { app } = buildAuthTestApp();
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ ...ASHA, password: 'password1234' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual([
      { path: 'password', message: expect.stringMatching(/too common/) },
    ]);
  });

  it('allows one account per email, ignoring capital letters', async () => {
    const { app } = await registered();
    const res = await request(app)
      .post('/api/v1/auth/sign-up')
      .send({ ...ASHA, email: 'ASHA.RAO@example.com', organizationName: 'Another' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('reports every missing field at once', async () => {
    const { app } = buildAuthTestApp();
    const res = await request(app).post('/api/v1/auth/sign-up').send({});
    expect(res.status).toBe(400);
    const paths = (res.body.error.details as { path: string }[]).map((detail) => detail.path);
    expect(paths).toEqual(
      expect.arrayContaining(['name', 'email', 'password', 'organizationName']),
    );
  });
});

describe('sign in', () => {
  it('signs in with the right password', async () => {
    const { app } = await registered();
    const agent = request.agent(app);
    const res = await agent
      .post('/api/v1/auth/sign-in')
      .send({ email: 'asha.rao@example.com', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('owner');
    expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
  });

  it('answers a wrong password and an unknown email identically', async () => {
    const { app } = await registered();
    const wrongPassword = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'asha.rao@example.com', password: 'not the password at all' });
    const unknownEmail = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'nobody@example.com', password: 'not the password at all' });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.error.message).toBe('Email or password is incorrect.');
      expect(setCookie(res)).toBe('');
    }
  });

  it(`pauses sign-in for 15 minutes after ${MAX_FAILED_SIGN_INS} wrong passwords`, async () => {
    const { app, clock, stores } = await registered();
    const attempt = (password: string) =>
      request(app).post('/api/v1/auth/sign-in').send({ email: 'asha.rao@example.com', password });

    for (let i = 0; i < MAX_FAILED_SIGN_INS; i += 1) {
      expect((await attempt('wrong password number')).status).toBe(401);
    }
    // Locked: even the right password is refused, with the same generic message.
    expect((await attempt(PASSWORD)).status).toBe(401);
    expect(stores.audit.map((event) => event.action)).toContain('auth.account_locked');

    clock.advance(LOCK_MS + 1000);
    expect((await attempt(PASSWORD)).status).toBe(200);
  });

  it('rate-limits repeated attempts from one connection', async () => {
    const { app } = buildAuthTestApp({
      rateLimits: { ...RELAXED_RATE_LIMITS, signIn: { windowMs: 60_000, limit: 2 } },
    });
    const attempt = () =>
      request(app)
        .post('/api/v1/auth/sign-in')
        .send({ email: 'someone@example.com', password: 'whatever password' });
    await attempt();
    await attempt();
    const third = await attempt();
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('sessions', () => {
  it('requires a valid session for /me', async () => {
    const { app } = buildAuthTestApp();
    const none = await request(app).get('/api/v1/auth/me');
    const junk = await request(app).get('/api/v1/auth/me').set('Cookie', 'similo_session=junk');
    for (const res of [none, junk]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('signs out: clears the cookie and ends the session on the server', async () => {
    const { app, agent, signUp, stores } = await registered();
    const token = tokenFrom(signUp);

    const res = await agent.post('/api/v1/auth/sign-out');
    expect(res.status).toBe(200);
    expect(setCookie(res)).toMatch(/similo_session=;.*Expires=Thu, 01 Jan 1970/);
    expect(stores.sessions.size).toBe(0);

    // Replaying the old cookie no longer works.
    const replay = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `similo_session=${token}`);
    expect(replay.status).toBe(401);
  });

  it('ends after 7 days without activity', async () => {
    const { agent, clock } = await registered();
    clock.advance(SESSION_IDLE_MS + 1000);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('stays alive while used, but never beyond 30 days', async () => {
    const { agent, clock } = await registered();
    for (let day = 6; day < SESSION_MAX_MS / DAY; day += 6) {
      clock.advance(6 * DAY);
      expect((await agent.get('/api/v1/auth/me')).status, `day ${day}`).toBe(200);
    }
    clock.advance(6 * DAY);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });
});

describe('change password', () => {
  it('requires the current password', async () => {
    const { agent } = await registered();
    const res = await agent
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: 'not my password', newPassword: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'currentPassword', message: expect.stringMatching(/incorrect/) },
    ]);
  });

  it('signs out every other session but keeps this one', async () => {
    const { app, agent, stores } = await registered();
    const laptop = request.agent(app);
    await laptop
      .post('/api/v1/auth/sign-in')
      .send({ email: 'asha.rao@example.com', password: PASSWORD })
      .expect(200);

    const res = await agent
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(200);

    expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
    expect((await laptop.get('/api/v1/auth/me')).status).toBe(401);
    expect(stores.audit.map((event) => event.action)).toContain('auth.password_changed');

    const signIn = (password: string) =>
      request(app).post('/api/v1/auth/sign-in').send({ email: 'asha.rao@example.com', password });
    expect((await signIn(PASSWORD)).status).toBe(401);
    expect((await signIn(NEW_PASSWORD)).status).toBe(200);
  });
});

describe('protections', () => {
  it('rejects data-changing requests sent from other websites', async () => {
    const { app } = buildAuthTestApp();
    const evil = await request(app)
      .post('/api/v1/auth/sign-up')
      .set('Origin', 'https://evil.example')
      .send(ASHA);
    expect(evil.status).toBe(403);
    expect(evil.body.error.code).toBe('FORBIDDEN_ORIGIN');

    const ours = await request(app)
      .post('/api/v1/auth/sign-up')
      .set('Origin', 'http://localhost:5173')
      .send(ASHA);
    expect(ours.status).toBe(201);
  });

  it('answers 503 instead of hanging when the database is down', async () => {
    const { app } = buildAuthTestApp({ databaseReady: false });
    const res = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: 'asha.rao@example.com', password: PASSWORD });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

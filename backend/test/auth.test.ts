import request, { type Response } from 'supertest';
import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { ACCESS_TOKEN_TTL_MS } from '../src/modules/auth/access-token.js';
import { LOCK_MS, MAX_FAILED_SIGN_INS } from '../src/modules/auth/auth.service.js';
import { SESSION_IDLE_MS, SESSION_MAX_MS } from '../src/modules/sessions/session.service.js';
import { buildAuthTestApp, RELAXED_RATE_LIMITS, TEST_JWT_SECRET } from './helpers.js';

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

/** The refresh token (random, stored hashed). */
function tokenFrom(res: Response): string {
  return /similo_refresh=([\w-]+)/.exec(setCookie(res))?.[1] ?? '';
}

/** The JWT access token. */
function jwtFrom(res: Response): string {
  return /similo_access=([\w.-]+)/.exec(setCookie(res))?.[1] ?? '';
}

function cookieLine(res: Response, name: string): string {
  return (
    setCookie(res)
      .split('\n')
      .find((line) => line.startsWith(`${name}=`)) ?? ''
  );
}

function claimsOf(jwt: string): Record<string, string | number> {
  return JSON.parse(Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString());
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

    // Both tokens travel only in HTTP-only cookies, never in the body:
    // a JWT access token (header.payload.signature) and a random refresh token.
    expect(cookieLine(signUp, 'similo_access')).toMatch(
      /^similo_access=eyJ[\w-]+\.[\w-]+\.[\w-]+;/,
    );
    expect(cookieLine(signUp, 'similo_refresh')).toMatch(/^similo_refresh=[\w-]{43};/);
    for (const name of ['similo_access', 'similo_refresh']) {
      const cookie = cookieLine(signUp, name);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/');
      expect(cookie).not.toContain('Secure'); // local http; production sets Secure + __Host-
    }
    expect(JSON.stringify(signUp.body)).not.toContain(tokenFrom(signUp));
    expect(JSON.stringify(signUp.body)).not.toContain(jwtFrom(signUp));

    // The JWT holds only ids and times: never the role, password or email.
    const claims = claimsOf(jwtFrom(signUp));
    expect(Object.keys(claims).sort()).toEqual(['aud', 'exp', 'iat', 'iss', 'org', 'sid', 'sub']);
    expect(Number(claims.exp) - Number(claims.iat)).toBe(ACCESS_TOKEN_TTL_MS / 1000);

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
    const junk = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'similo_access=junk; similo_refresh=junk');
    for (const res of [none, junk]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('signs out: clears both cookies and deletes the refresh token on the server', async () => {
    const { app, agent, signUp, stores } = await registered();
    const token = tokenFrom(signUp);

    const res = await agent.post('/api/v1/auth/sign-out');
    expect(res.status).toBe(200);
    expect(cookieLine(res, 'similo_access')).toMatch(/^similo_access=;.*Expires=Thu, 01 Jan 1970/);
    expect(cookieLine(res, 'similo_refresh')).toMatch(
      /^similo_refresh=;.*Expires=Thu, 01 Jan 1970/,
    );
    expect(stores.sessions.size).toBe(0);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);

    // Replaying the old refresh token no longer works.
    const replay = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', `similo_refresh=${token}`);
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

describe('JWT access tokens', () => {
  async function forge(claims: Record<string, unknown>, secret = TEST_JWT_SECRET) {
    // Same clock as the real token, so a rejection is never just "expired".
    const at = Number(claims.iat);
    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('similo')
      .setAudience('similo-web')
      .setIssuedAt(at)
      .setExpirationTime(at + 600)
      .sign(new TextEncoder().encode(secret));
  }

  it('renews an expired access token from the refresh token, without signing out', async () => {
    const { agent, clock, signUp } = await registered();
    clock.advance(ACCESS_TOKEN_TTL_MS + 1000);
    const res = await agent.get('/api/v1/auth/me');
    expect(res.status).toBe(200);
    expect(jwtFrom(res)).not.toBe('');
    expect(jwtFrom(res)).not.toBe(jwtFrom(signUp));
  });

  it('rejects tokens that were tampered with, forged or unsigned', async () => {
    const { app, signUp } = await registered();
    const [header, payload, signature] = jwtFrom(signUp).split('.');
    const claims = claimsOf(jwtFrom(signUp));
    const otherOrg = Buffer.from(JSON.stringify({ ...claims, org: 'f'.repeat(24) }));

    const tampered = `${header}.${otherOrg.toString('base64url')}.${signature}`;
    const wrongSecret = await forge(claims, 'an-attacker-guessed-this-secret-value!!');
    const noneHeader = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url');
    const unsigned = `${noneHeader}.${payload}.`;

    for (const token of [tampered, wrongSecret, unsigned, 'not.a.jwt']) {
      const res = await request(app).get('/api/v1/auth/me').set('Cookie', `similo_access=${token}`);
      expect(res.status, token.slice(0, 30)).toBe(401);
    }
  });

  it('gives no access to an organisation the user is not a member of', async () => {
    const { app, signUp } = await registered();
    const token = await forge({ ...claimsOf(jwtFrom(signUp)), org: 'a'.repeat(24) });
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', `similo_access=${token}`);
    expect(res.status).toBe(401);
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
    const { app, agent, stores, clock } = await registered();
    const laptop = request.agent(app);
    await laptop
      .post('/api/v1/auth/sign-in')
      .send({ email: 'asha.rao@example.com', password: PASSWORD })
      .expect(200);

    const res = await agent
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(200);

    // The laptop's refresh token is deleted at once; its access JWT runs out within 15 minutes.
    expect(stores.sessions.size).toBe(1);
    clock.advance(ACCESS_TOKEN_TTL_MS + 1000);
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

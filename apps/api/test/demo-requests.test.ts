import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createDemoRequestService } from '../src/modules/demo-requests/demo-request.service.js';
import {
  buildTestApp,
  createFakeDemoRequestRepository,
  healthyChecks,
  silentLogger,
} from './helpers.js';

const validBody = {
  fullName: 'Priya Sharma',
  workEmail: 'Priya.Sharma@Example.com',
  company: 'Example Brands Ltd',
  role: 'legal',
  interests: ['domain', 'trademark', 'domain'],
  message: 'We want to monitor lookalike domains.',
  consent: true,
};

function setup({ databaseReady = true, limit = 100 } = {}) {
  const { repository, saved } = createFakeDemoRequestRepository();
  const app = buildTestApp(healthyChecks, {
    demoRequestService: createDemoRequestService({
      repository,
      isDatabaseReady: () => databaseReady,
      logger: silentLogger,
    }),
    demoRequestOptions: { rateLimit: { windowMs: 60_000, limit } },
  });
  return { app, saved };
}

describe('POST /api/v1/demo-requests', () => {
  it('stores a valid request and returns 201', async () => {
    const { app, saved } = setup();

    const res = await request(app).post('/api/v1/demo-requests').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { received: true } });
    expect(saved).toHaveLength(1);
    // Normalised: lowercased email, de-duplicated interests, consent not stored.
    expect(saved[0]).toEqual({
      fullName: 'Priya Sharma',
      workEmail: 'priya.sharma@example.com',
      company: 'Example Brands Ltd',
      role: 'legal',
      interests: ['domain', 'trademark'],
      message: 'We want to monitor lookalike domains.',
    });
  });

  it('rejects invalid fields with 400 and per-field details', async () => {
    const { app, saved } = setup();

    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ ...validBody, workEmail: 'not-an-email', interests: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((detail: { path: string }) => detail.path);
    expect(paths).toEqual(expect.arrayContaining(['workEmail', 'interests']));
    expect(saved).toHaveLength(0);
  });

  it('requires explicit consent', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ ...validBody, consent: false });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('consent');
  });

  it('rejects unknown roles and interests', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ ...validBody, role: 'hacker', interests: ['everything'] });

    expect(res.status).toBe(400);
  });

  it('silently discards honeypot submissions (looks like success, stores nothing)', async () => {
    const { app, saved } = setup();

    const res = await request(app)
      .post('/api/v1/demo-requests')
      .send({ ...validBody, website: 'http://spam.example' });

    expect(res.status).toBe(201);
    expect(saved).toHaveLength(0);
  });

  it('returns 503 instead of pretending to save when the database is unavailable', async () => {
    const { app, saved } = setup({ databaseReady: false });

    const res = await request(app).post('/api/v1/demo-requests').send(validBody);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(saved).toHaveLength(0);
  });

  it('rate-limits repeated submissions with 429', async () => {
    const { app } = setup({ limit: 2 });

    await request(app).post('/api/v1/demo-requests').send(validBody).expect(201);
    await request(app).post('/api/v1/demo-requests').send(validBody).expect(201);
    const res = await request(app).post('/api/v1/demo-requests').send(validBody);

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.headers['ratelimit-policy']).toBeDefined();
  });
});

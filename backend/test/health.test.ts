import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp, fakeCheck } from './helpers.js';

describe('GET /api/v1/health (liveness)', () => {
  it('returns ok in the standard success envelope', async () => {
    const res = await request(buildTestApp()).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok', service: 'similo-api' },
    });
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('GET /api/v1/health/dependencies', () => {
  const dbUp = fakeCheck('database', true, { status: 'up', message: 'Connected' });
  const dbDown = fakeCheck('database', true, { status: 'down', message: 'Unreachable' });
  const dbNotConfigured = fakeCheck('database', true, {
    status: 'not_configured',
    message: 'MONGODB_URI is not set',
  });
  const aiUp = fakeCheck('aiService', false, { status: 'up', message: 'Reachable' });
  const aiDown = fakeCheck('aiService', false, { status: 'down', message: 'Unreachable' });

  it('reports ok when every dependency is up', async () => {
    const res = await request(buildTestApp([dbUp, aiUp])).get('/api/v1/health/dependencies');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.dependencies).toEqual([
      { name: 'database', critical: true, status: 'up', message: 'Connected' },
      { name: 'aiService', critical: false, status: 'up', message: 'Reachable' },
    ]);
  });

  it('reports down when a critical dependency is down', async () => {
    const res = await request(buildTestApp([dbDown, aiUp])).get('/api/v1/health/dependencies');
    expect(res.body.data.status).toBe('down');
  });

  it('reports degraded when only a non-critical dependency is down', async () => {
    const res = await request(buildTestApp([dbUp, aiDown])).get('/api/v1/health/dependencies');
    expect(res.body.data.status).toBe('degraded');
  });

  it('reports degraded when the database is not configured', async () => {
    const res = await request(buildTestApp([dbNotConfigured, aiUp])).get(
      '/api/v1/health/dependencies',
    );
    expect(res.body.data.status).toBe('degraded');
  });

  it('treats a check that throws as down without leaking the error', async () => {
    const broken = fakeCheck('database', true, new Error('connection string mongodb://secret'));
    const res = await request(buildTestApp([broken, aiUp])).get('/api/v1/health/dependencies');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('down');
    expect(res.body.data.dependencies[0]).toMatchObject({
      status: 'down',
      message: 'Check failed',
    });
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});

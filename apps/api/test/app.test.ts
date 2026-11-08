import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../src/lib/errors.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createRequestLogger } from '../src/middleware/request-logger.js';
import { buildTestApp, silentLogger } from './helpers.js';

describe('request IDs', () => {
  it('generates a request ID and returns it in X-Request-Id', async () => {
    const res = await request(buildTestApp()).get('/api/v1/health');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reuses a safe incoming request ID', async () => {
    const res = await request(buildTestApp())
      .get('/api/v1/health')
      .set('X-Request-Id', 'trace-abc12345');
    expect(res.headers['x-request-id']).toBe('trace-abc12345');
  });

  it('replaces an unsafe incoming request ID', async () => {
    const res = await request(buildTestApp())
      .get('/api/v1/health')
      .set('X-Request-Id', 'bad id\twith "quotes"');
    expect(res.headers['x-request-id']).not.toContain('bad id');
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await request(buildTestApp()).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows the configured web origin via CORS', async () => {
    const res = await request(buildTestApp())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not grant CORS access to unknown origins', async () => {
    const res = await request(buildTestApp())
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('error responses', () => {
  it('returns a 404 error envelope for unknown routes', async () => {
    const res = await request(buildTestApp()).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route GET /api/v1/does-not-exist was not found',
        requestId: res.headers['x-request-id'],
      },
    });
  });

  it('returns 400 INVALID_JSON for a malformed JSON body', async () => {
    const res = await request(buildTestApp())
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  describe('central error handler', () => {
    // A tiny app with routes that fail in specific ways.
    function buildFailingApp() {
      const app = express();
      app.use(createRequestLogger(silentLogger));
      app.get('/app-error', () => {
        throw new AppError(409, 'CONFLICT', 'Brand already exists');
      });
      app.get('/validation-error', () => {
        z.object({ name: z.string() }).parse({ name: 42 });
      });
      app.get('/unexpected', async () => {
        throw new Error('db password is hunter2');
      });
      app.use(errorHandler);
      return app;
    }

    it('maps AppError to its status code and code', async () => {
      const res = await request(buildFailingApp()).get('/app-error');
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({ code: 'CONFLICT', message: 'Brand already exists' });
    });

    it('maps ZodError to 400 VALIDATION_ERROR with field details', async () => {
      const res = await request(buildFailingApp()).get('/validation-error');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].path).toBe('name');
    });

    it('hides internal details of unexpected errors (including async ones)', async () => {
      const res = await request(buildFailingApp()).get('/unexpected');
      expect(res.status).toBe(500);
      expect(res.body.error).toMatchObject({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
      expect(JSON.stringify(res.body)).not.toContain('hunter2');
    });
  });
});

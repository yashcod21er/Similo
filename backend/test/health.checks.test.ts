import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiServiceError, createAiServiceClient } from '../src/clients/ai-service.client.js';
import { createAiServiceCheck, createDatabaseCheck } from '../src/modules/health/health.checks.js';
import { silentLogger } from './helpers.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const client = createAiServiceClient({ baseUrl: 'http://ai.test:8000', timeoutMs: 500 });

describe('AI service client', () => {
  it('calls GET /health and returns the validated body', async () => {
    const fetchMock = stubFetch(
      Response.json({ status: 'ok', service: 'similo-ai-service', version: '0.1.0' }),
    );

    await expect(client.getHealth()).resolves.toEqual({
      status: 'ok',
      service: 'similo-ai-service',
      version: '0.1.0',
    });
    expect(String(fetchMock.mock.calls[0]?.at(0))).toBe('http://ai.test:8000/health');
  });

  it('throws AiServiceError on a non-2xx response', async () => {
    stubFetch(new Response('boom', { status: 502 }));
    await expect(client.getHealth()).rejects.toThrow(AiServiceError);
  });

  it('throws AiServiceError when the response has an unexpected shape', async () => {
    stubFetch(Response.json({ healthy: true }));
    await expect(client.getHealth()).rejects.toThrow(/unexpected health response/);
  });
});

describe('createAiServiceCheck', () => {
  it('is non-critical and reports up with latency when healthy', async () => {
    stubFetch(Response.json({ status: 'ok', service: 'ai', version: '0.1.0' }));
    const check = createAiServiceCheck({ client, logger: silentLogger });

    expect(check.critical).toBe(false);
    const result = await check.run();
    expect(result.status).toBe('up');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('reports down when the service is unreachable', async () => {
    stubFetch(new TypeError('fetch failed'));
    const check = createAiServiceCheck({ client, logger: silentLogger });
    await expect(check.run()).resolves.toEqual({ status: 'down', message: 'Unreachable' });
  });
});

describe('createDatabaseCheck', () => {
  const base = { timeoutMs: 50, logger: silentLogger };

  it('reports not_configured without trying to connect', async () => {
    const ping = vi.fn(async () => {});
    const check = createDatabaseCheck({ ...base, configured: false, ping });

    await expect(check.run()).resolves.toMatchObject({ status: 'not_configured' });
    expect(ping).not.toHaveBeenCalled();
  });

  it('reports up when the ping succeeds', async () => {
    const check = createDatabaseCheck({ ...base, configured: true, ping: async () => {} });
    await expect(check.run()).resolves.toMatchObject({ status: 'up', message: 'Connected' });
  });

  it('reports down when the ping fails', async () => {
    const check = createDatabaseCheck({
      ...base,
      configured: true,
      ping: async () => {
        throw new Error('not connected');
      },
    });
    await expect(check.run()).resolves.toEqual({ status: 'down', message: 'Unreachable' });
  });

  it('reports down when the ping hangs longer than the timeout', async () => {
    const check = createDatabaseCheck({
      ...base,
      configured: true,
      ping: () => new Promise<void>(() => {}),
    });
    await expect(check.run()).resolves.toEqual({ status: 'down', message: 'Unreachable' });
  });
});

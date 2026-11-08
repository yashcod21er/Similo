import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './api-client';

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('apiRequest', () => {
  it('prefixes /api/v1, sends cookies and unwraps data', async () => {
    const fetchMock = stubFetch(async () => Response.json({ success: true, data: { ok: 1 } }));

    await expect(apiRequest('/health')).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/health');
    expect(init.credentials).toBe('include');
  });

  it('throws ApiError with code and requestId from an error envelope', async () => {
    stubFetch(async () =>
      Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Nope', requestId: 'req-1' } },
        { status: 404 },
      ),
    );

    const error = await apiRequest('/missing').catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', requestId: 'req-1' });
  });

  it('throws NETWORK_ERROR when the API is unreachable', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(apiRequest('/health')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('throws UNEXPECTED_RESPONSE for non-envelope bodies (e.g. a proxy error page)', async () => {
    stubFetch(async () => new Response('<html>Bad gateway</html>', { status: 502 }));
    await expect(apiRequest('/health')).rejects.toMatchObject({
      code: 'UNEXPECTED_RESPONSE',
      status: 502,
    });
  });
});

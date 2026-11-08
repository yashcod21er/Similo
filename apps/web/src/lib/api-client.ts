/**
 * Thin wrapper around `fetch` for the Similo REST API.
 *
 * The API always answers with `{ success: true, data }` or
 * `{ success: false, error: { code, message, requestId } }`. This module unwraps
 * `data` on success and throws a typed `ApiError` otherwise, so components only
 * deal with real data or a single error type.
 */

export const API_BASE_PATH = '/api/v1';

interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly details: unknown;

  constructor({ status, code, message, requestId, details }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

type Envelope<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { code: string; message: string; requestId?: string; details?: unknown };
    };

function isEnvelope<T>(body: unknown): body is Envelope<T> {
  return typeof body === 'object' && body !== null && 'success' in body;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      ...init,
      // Send/receive the HTTP-only session cookie (used from Phase 2).
      credentials: 'include',
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Could not reach the Similo API. Is it running?',
    });
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (isEnvelope<T>(body)) {
    if (body.success) return body.data;
    throw new ApiError({ status: response.status, ...body.error });
  }

  throw new ApiError({
    status: response.status,
    code: 'UNEXPECTED_RESPONSE',
    message: `The API returned an unexpected response (HTTP ${response.status}).`,
  });
}

/** POST/PATCH/DELETE with a JSON body, through the same envelope handling as `apiRequest`. */
export function sendJson<T>(
  path: string,
  body?: unknown,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
): Promise<T> {
  return apiRequest<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

/** Field-level problems from a 400 VALIDATION_ERROR, as `{ path, message }` pairs. */
export function validationDetails(error: unknown): { path: string; message: string }[] {
  if (
    error instanceof ApiError &&
    error.code === 'VALIDATION_ERROR' &&
    Array.isArray(error.details)
  ) {
    return error.details as { path: string; message: string }[];
  }
  return [];
}

import type { Response } from 'express';

/**
 * Every public API response uses one of these two shapes, so the frontend
 * can handle all endpoints the same way:
 *
 *   { "success": true,  "data": { ... } }
 *   { "success": false, "error": { "code": "NOT_FOUND", "message": "...", "requestId": "..." } }
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(body);
}

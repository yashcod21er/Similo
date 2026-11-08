import type { RequestHandler } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Cross-site request forgery (CSRF) defence, layered on top of SameSite=Lax
 * session cookies: a request that changes data and carries an `Origin` header
 * from a site not in the allow-list is rejected before it reaches any route.
 *
 * Browsers always send `Origin` with cross-site POST/PATCH/DELETE requests.
 * Requests without one (curl, server-to-server, tests) are allowed, because
 * they cannot carry a victim's browser cookie anyway.
 */
export function verifyOrigin(allowedOrigins: string[]): RequestHandler {
  const allowed = new Set(allowedOrigins);
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.get('origin');
    if (origin && !allowed.has(origin)) {
      throw new AppError(
        403,
        ErrorCode.ForbiddenOrigin,
        'This request came from a website that is not allowed to change data here.',
      );
    }
    next();
  };
}

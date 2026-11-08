import type { CookieOptions, Response } from 'express';
import { SESSION_MAX_MS } from '../sessions/session.service.js';

export interface SessionCookieConfig {
  name: string;
  secure: boolean;
}

/**
 * In production the cookie uses the `__Host-` prefix, which browsers only accept
 * when it is Secure, has Path=/ and no Domain — so it can't be set or
 * overridden by a subdomain. Local development runs on http, where Secure
 * cookies can't be stored, so it uses a plain name there.
 */
export function sessionCookieConfig({ secure }: { secure: boolean }): SessionCookieConfig {
  return { name: secure ? '__Host-similo_session' : 'similo_session', secure };
}

function baseOptions(config: SessionCookieConfig): CookieOptions {
  return {
    httpOnly: true, // JavaScript in the page can never read it.
    secure: config.secure,
    sameSite: 'lax', // Not sent on cross-site POSTs (CSRF defence).
    path: '/',
  };
}

export function setSessionCookie(res: Response, config: SessionCookieConfig, token: string): void {
  res.cookie(config.name, token, { ...baseOptions(config), maxAge: SESSION_MAX_MS });
}

export function clearSessionCookie(res: Response, config: SessionCookieConfig): void {
  res.clearCookie(config.name, baseOptions(config));
}

import type { CookieOptions, Response } from 'express';
import { SESSION_MAX_MS } from '../sessions/session.service.js';
import { ACCESS_TOKEN_TTL_MS } from './access-token.js';

/** Names of the two sign-in cookies. */
export interface AuthCookieConfig {
  /** Short-lived JWT access token (15 minutes). */
  access: string;
  /** Random refresh token; MongoDB stores only its hash (up to 30 days). */
  refresh: string;
  secure: boolean;
}

/**
 * In production the cookies use the `__Host-` prefix, which browsers only accept
 * when the cookie is Secure, has Path=/ and no Domain, so a subdomain can't set
 * or override it. Local development runs on http, where Secure cookies can't be
 * stored, so it uses plain names there.
 */
export function authCookieConfig({ secure }: { secure: boolean }): AuthCookieConfig {
  const prefix = secure ? '__Host-' : '';
  return { access: `${prefix}similo_access`, refresh: `${prefix}similo_refresh`, secure };
}

function baseOptions(config: AuthCookieConfig): CookieOptions {
  return {
    httpOnly: true, // JavaScript in the page can never read them.
    secure: config.secure,
    sameSite: 'lax', // Not sent on cross-site POSTs (CSRF defence).
    path: '/',
  };
}

export function setAccessCookie(res: Response, config: AuthCookieConfig, jwt: string): void {
  res.cookie(config.access, jwt, { ...baseOptions(config), maxAge: ACCESS_TOKEN_TTL_MS });
}

export function setAuthCookies(
  res: Response,
  config: AuthCookieConfig,
  { accessToken, refreshToken }: { accessToken: string; refreshToken: string },
): void {
  setAccessCookie(res, config, accessToken);
  res.cookie(config.refresh, refreshToken, { ...baseOptions(config), maxAge: SESSION_MAX_MS });
}

export function clearAuthCookies(res: Response, config: AuthCookieConfig): void {
  res.clearCookie(config.access, baseOptions(config));
  res.clearCookie(config.refresh, baseOptions(config));
}

import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { sendSuccess } from '../../lib/http-response.js';
import { getAuth, requestContext } from '../../middleware/auth.js';
import { clearSessionCookie, setSessionCookie, type SessionCookieConfig } from './auth.cookies.js';
import {
  acceptInviteSchema,
  changePasswordSchema,
  inviteTokenSchema,
  signInSchema,
  signUpSchema,
} from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

export interface RateLimitSetting {
  windowMs: number;
  limit: number;
}

export interface AuthRateLimits {
  signIn: RateLimitSetting;
  signUp: RateLimitSetting;
  invites: RateLimitSetting;
}

export const DEFAULT_AUTH_RATE_LIMITS: AuthRateLimits = {
  signIn: { windowMs: 15 * 60 * 1000, limit: 10 },
  signUp: { windowMs: 60 * 60 * 1000, limit: 5 },
  invites: { windowMs: 15 * 60 * 1000, limit: 30 },
};

function limiter({ windowMs, limit }: RateLimitSetting): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new AppError(
          429,
          ErrorCode.RateLimited,
          'Too many attempts from this connection. Please wait a few minutes and try again.',
        ),
      );
    },
  });
}

/**
 * /api/v1/auth — sign up, sign in, sign out, "me", password change, invitations.
 * The session token only ever travels in the HTTP-only cookie, never in a body.
 */
export function createAuthRouter({
  authService,
  requireAuth,
  cookie,
  rateLimits,
}: {
  authService: AuthService;
  requireAuth: RequestHandler;
  cookie: SessionCookieConfig;
  rateLimits: AuthRateLimits;
}): Router {
  const router = Router();

  // Responses here are personal: never cache them anywhere.
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/sign-up', limiter(rateLimits.signUp), async (req, res) => {
    const input = signUpSchema.parse(req.body);
    const { token, me } = await authService.signUp(input, requestContext(req));
    setSessionCookie(res, cookie, token);
    sendSuccess(res, me, 201);
  });

  router.post('/sign-in', limiter(rateLimits.signIn), async (req, res) => {
    const input = signInSchema.parse(req.body);
    const { token, me } = await authService.signIn(input, requestContext(req));
    setSessionCookie(res, cookie, token);
    sendSuccess(res, me);
  });

  router.post('/sign-out', requireAuth, async (_req, res) => {
    await authService.signOut(getAuth(res));
    clearSessionCookie(res, cookie);
    sendSuccess(res, { signedOut: true });
  });

  router.get('/me', requireAuth, async (_req, res) => {
    sendSuccess(res, await authService.me(getAuth(res)));
  });

  router.post('/change-password', requireAuth, async (req, res) => {
    const input = changePasswordSchema.parse(req.body);
    await authService.changePassword(getAuth(res), input);
    sendSuccess(res, { changed: true });
  });

  const invitesLimiter = limiter(rateLimits.invites);

  router.get('/invites/:token', invitesLimiter, async (req, res) => {
    const token = inviteTokenSchema.safeParse(req.params.token);
    if (!token.success) {
      throw new AppError(
        404,
        ErrorCode.InviteInvalid,
        'This invitation link is invalid or has expired.',
      );
    }
    sendSuccess(res, await authService.previewInvite(token.data));
  });

  router.post('/invites/:token/accept', invitesLimiter, async (req, res) => {
    const token = inviteTokenSchema.safeParse(req.params.token);
    if (!token.success) {
      throw new AppError(
        404,
        ErrorCode.InviteInvalid,
        'This invitation link is invalid or has expired.',
      );
    }
    const input = acceptInviteSchema.parse(req.body);
    const { token: sessionToken, me } = await authService.acceptInvite(
      token.data,
      input,
      requestContext(req),
    );
    setSessionCookie(res, cookie, sessionToken);
    sendSuccess(res, me, 201);
  });

  return router;
}

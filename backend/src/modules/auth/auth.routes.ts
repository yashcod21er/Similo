import { Router, type RequestHandler, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { sendSuccess } from '../../lib/http-response.js';
import { getAuth, requestContext } from '../../middleware/auth.js';
import type { AccessTokenService } from './access-token.js';
import { clearAuthCookies, setAuthCookies, type AuthCookieConfig } from './auth.cookies.js';
import {
  acceptInviteSchema,
  changePasswordSchema,
  inviteTokenSchema,
  signInSchema,
  signUpSchema,
} from './auth.schemas.js';
import type { AuthService, SignedIn } from './auth.service.js';

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
 * Tokens only ever travel in HTTP-only cookies, never in a response body:
 * a 15-minute JWT access token and a refresh token (stored hashed in MongoDB).
 */
export function createAuthRouter({
  authService,
  requireAuth,
  accessTokens,
  cookies,
  rateLimits,
}: {
  authService: AuthService;
  requireAuth: RequestHandler;
  accessTokens: AccessTokenService;
  cookies: AuthCookieConfig;
  rateLimits: AuthRateLimits;
}): Router {
  const router = Router();

  /** Signs the access JWT for a new sign-in and sets both cookies. */
  async function issueTokens(res: Response, { token, sessionId, me }: SignedIn): Promise<void> {
    const accessToken = await accessTokens.sign({
      userId: me.user.id,
      organizationId: me.organization.id,
      sessionId,
    });
    setAuthCookies(res, cookies, { accessToken, refreshToken: token });
  }

  // Responses here are personal: never cache them anywhere.
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/sign-up', limiter(rateLimits.signUp), async (req, res) => {
    const input = signUpSchema.parse(req.body);
    const signedIn = await authService.signUp(input, requestContext(req));
    await issueTokens(res, signedIn);
    sendSuccess(res, signedIn.me, 201);
  });

  router.post('/sign-in', limiter(rateLimits.signIn), async (req, res) => {
    const input = signInSchema.parse(req.body);
    const signedIn = await authService.signIn(input, requestContext(req));
    await issueTokens(res, signedIn);
    sendSuccess(res, signedIn.me);
  });

  router.post('/sign-out', requireAuth, async (_req, res) => {
    await authService.signOut(getAuth(res));
    clearAuthCookies(res, cookies);
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
    const signedIn = await authService.acceptInvite(token.data, input, requestContext(req));
    await issueTokens(res, signedIn);
    sendSuccess(res, signedIn.me, 201);
  });

  return router;
}

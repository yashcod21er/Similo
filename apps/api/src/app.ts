import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import type { Logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { createRequestLogger } from './middleware/request-logger.js';
import { createApiRouter, type ApiRouterDependencies } from './routes.js';

export interface AppDependencies extends ApiRouterDependencies {
  env: Pick<Env, 'CORS_ORIGINS' | 'TRUST_PROXY'>;
  logger: Logger;
}

/**
 * Builds the Express application without starting a server.
 *
 * Keeping "build the app" separate from "listen on a port" (server.ts) means
 * tests can create the app with fake dependencies and call it in-memory.
 *
 * Middleware order matters — each request flows through these top to bottom.
 */
export function createApp({ env, logger, ...routerDependencies }: AppDependencies): Express {
  const app = express();

  // Behind a reverse proxy / load balancer, trust its X-Forwarded-For header so
  // req.ip (used by rate limiting) is the real client, not the proxy.
  // 0 = no proxy (local development without one).
  app.set('trust proxy', env.TRUST_PROXY);

  // 1. Request ID + structured access log for every request.
  app.use(createRequestLogger(logger));

  // 2. Security headers (X-Content-Type-Options, HSTS, CSP...) and no X-Powered-By.
  app.use(helmet());

  // 3. CORS: only listed origins may call the API from a browser. `credentials`
  //    lets the browser send the HTTP-only session cookie added in Phase 2.
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));

  // 4. JSON body parsing with a size limit to block oversized payloads.
  app.use(express.json({ limit: '1mb' }));

  // 5. Versioned API routes.
  app.use('/api/v1', createApiRouter(routerDependencies));

  // 6. Nothing matched → 404. Any error → consistent JSON error response.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

import type { Server } from 'node:http';
import { createApp } from './app.js';
import { createAiServiceClient } from './clients/ai-service.client.js';
import { EnvValidationError, loadDotEnvFile, parseEnv } from './config/env.js';
import { ensureIndexes } from './db/indexes.js';
import { runInMongoTransaction } from './db/transaction.js';
import {
  connectToDatabase,
  disconnectFromDatabase,
  isDatabaseConnected,
  pingDatabase,
} from './db/mongo.js';
import { createLogger, type Logger } from './lib/logger.js';
import { generateToken } from './lib/tokens.js';
import { mongoAuditRepository } from './modules/audit/audit.repository.js';
import { createAuthSystem } from './modules/auth/auth.system.js';
import {
  mongoBrandLogoRepository,
  mongoBrandRepository,
} from './modules/brands/brand.repository.js';
import { createBrandService } from './modules/brands/brand.service.js';
import { mongoDemoRequestRepository } from './modules/demo-requests/demo-request.repository.js';
import { createDemoRequestService } from './modules/demo-requests/demo-request.service.js';
import { createAiServiceCheck, createDatabaseCheck } from './modules/health/health.checks.js';
import { createHealthService } from './modules/health/health.service.js';
import {
  mongoInviteRepository,
  mongoMembershipRepository,
  mongoOrganizationRepository,
} from './modules/organizations/organization.repository.js';
import { mongoSessionRepository } from './modules/sessions/session.repository.js';
import { mongoUserRepository } from './modules/users/user.repository.js';

/**
 * Entry point ("composition root"): reads configuration, creates the real
 * dependencies, wires them into the app and starts listening.
 */
async function main(): Promise<void> {
  loadDotEnvFile();
  const env = parseEnv(process.env);
  const logger = createLogger(env);

  if (env.MONGODB_URI) {
    try {
      await connectToDatabase({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME, logger });
      // Unique emails, auto-expiring sessions etc. must exist before the first request.
      await ensureIndexes();
    } catch (err) {
      if (env.NODE_ENV === 'production') {
        // In production, crash so the platform restarts us and alerts someone.
        logger.fatal({ err }, 'Could not connect to MongoDB');
        process.exit(1);
      }
      // In development, keep running so the status page can show the problem.
      logger.error({ err }, 'Could not connect to MongoDB — continuing without a database');
    }
  } else {
    logger.warn('MONGODB_URI is not set — running without a database (development only)');
  }

  const aiServiceClient = createAiServiceClient({
    baseUrl: env.AI_SERVICE_URL,
    timeoutMs: env.AI_SERVICE_TIMEOUT_MS,
  });

  const healthService = createHealthService([
    createDatabaseCheck({
      configured: Boolean(env.MONGODB_URI),
      ping: pingDatabase,
      timeoutMs: 3000,
      logger,
    }),
    createAiServiceCheck({ client: aiServiceClient, logger }),
  ]);

  const demoRequestService = createDemoRequestService({
    repository: mongoDemoRequestRepository,
    isDatabaseReady: isDatabaseConnected,
    logger,
  });

  const auth = createAuthSystem({
    repositories: {
      users: mongoUserRepository,
      organizations: mongoOrganizationRepository,
      memberships: mongoMembershipRepository,
      invites: mongoInviteRepository,
      sessions: mongoSessionRepository,
      audit: mongoAuditRepository,
    },
    runInTransaction: runInMongoTransaction,
    logger,
    appUrl: env.APP_URL,
    // Secure cookies need https, which production has and local development doesn't.
    cookieSecure: env.NODE_ENV === 'production',
    jwtSecret: env.JWT_SECRET ?? developmentJwtSecret(logger),
  });

  const brandService = createBrandService({
    brands: mongoBrandRepository,
    logos: mongoBrandLogoRepository,
    audit: auth.auditService,
    runInTransaction: runInMongoTransaction,
    now: () => new Date(),
  });

  const app = createApp({
    env,
    logger,
    healthService,
    demoRequestService,
    auth,
    brandService,
    isDatabaseReady: isDatabaseConnected,
  });

  // Express 5 calls the listen callback even when listening fails, so success
  // and failure are handled with the server's own 'listening' / 'error' events.
  const server = app.listen(env.PORT);
  server.on('listening', () => {
    logger.info(`Similo API listening on http://localhost:${env.PORT}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.fatal(
        `Port ${env.PORT} is already in use — another copy of the API is probably still running. ` +
          'Stop it (or change PORT in backend/.env) and try again.',
      );
    } else {
      logger.fatal({ err }, 'HTTP server failed to start');
    }
    process.exit(1);
  });

  registerShutdownHandlers(server, logger);
}

/**
 * Graceful shutdown: stop accepting new requests, let in-flight requests
 * finish, close the database connection, then exit.
 */
function registerShutdownHandlers(server: Server, logger: Logger): void {
  let shuttingDown = false;

  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      await disconnectFromDatabase().catch((err) => logger.error({ err }, 'Error closing MongoDB'));
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    process.exit(1);
  });
}

main().catch((err: unknown) => {
  // The logger may not exist yet (e.g. invalid env), so fall back to stderr.
  if (err instanceof EnvValidationError) {
    console.error(err.message);
  } else {
    console.error('Fatal error during startup:', err);
  }
  process.exit(1);
});

/**
 * Without JWT_SECRET (allowed outside production), use a random secret for this
 * run only. Restarting then invalidates access tokens, and the browser silently
 * gets a new one through its refresh token, so nobody is signed out.
 */
function developmentJwtSecret(logger: Logger): string {
  logger.warn('JWT_SECRET is not set; using a random secret for this run (set it in backend/.env)');
  return generateToken(48);
}

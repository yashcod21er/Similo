import type { Server } from 'node:http';
import { createApp } from './app.js';
import { createAiServiceClient } from './clients/ai-service.client.js';
import { EnvValidationError, loadDotEnvFile, parseEnv } from './config/env.js';
import {
  connectToDatabase,
  disconnectFromDatabase,
  isDatabaseConnected,
  pingDatabase,
} from './db/mongo.js';
import { createLogger, type Logger } from './lib/logger.js';
import { mongoDemoRequestRepository } from './modules/demo-requests/demo-request.repository.js';
import { createDemoRequestService } from './modules/demo-requests/demo-request.service.js';
import { createAiServiceCheck, createDatabaseCheck } from './modules/health/health.checks.js';
import { createHealthService } from './modules/health/health.service.js';

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

  const app = createApp({ env, logger, healthService, demoRequestService });

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
          'Stop it (or change PORT in apps/api/.env) and try again.',
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

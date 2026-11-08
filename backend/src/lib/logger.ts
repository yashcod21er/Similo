import { pino, type Logger } from 'pino';
import type { Env } from '../config/env.js';

export type { Logger };

/**
 * Structured JSON logger (pino).
 *
 * - Production: one JSON object per line, ready for a log platform to index.
 * - Development: pretty, coloured output for humans.
 * - Sensitive headers are redacted so tokens/cookies never reach the logs.
 */
export function createLogger(env: Pick<Env, 'NODE_ENV' | 'LOG_LEVEL'>): Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: { service: 'similo-api' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-internal-token"]',
        'res.headers["set-cookie"]',
      ],
      censor: '[REDACTED]',
    },
    ...(env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' },
      },
    }),
  });
}

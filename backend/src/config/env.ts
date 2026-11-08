import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/**
 * Environment configuration.
 *
 * Every setting the API needs is declared and validated here, once, at startup.
 * If something is missing or malformed the process refuses to start with a clear
 * message, instead of failing later in a confusing way (e.g. on the first request).
 */

/** Treat `KEY=` (empty string) the same as "not set". */
const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    // Number of reverse proxies in front of the API (0 = none). Needed so rate
    // limiting sees real client IPs in production. The Vite dev proxy counts as 1.
    TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
    MONGODB_URI: optionalString.refine(
      (value) => value === undefined || /^mongodb(\+srv)?:\/\//.test(value),
      'must start with mongodb:// or mongodb+srv://',
    ),
    MONGODB_DB_NAME: z.string().min(1).default('similo'),
    // Public address of the website; used to build invitation links.
    APP_URL: z
      .url()
      .default('http://localhost:5173')
      .transform((value) => value.replace(/\/+$/, '')),
    AI_SERVICE_URL: z.url().default('http://localhost:8000'),
    AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.MONGODB_URI) {
      ctx.addIssue({
        code: 'custom',
        path: ['MONGODB_URI'],
        message: 'is required in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid environment configuration:\n  - ${problems.join('\n  - ')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates an environment object (normally `process.env`).
 * Error messages name the variable but never echo its value, so secrets
 * such as connection strings do not end up in logs.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new EnvValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'} ${issue.message}`),
    );
  }
  return result.data;
}

/**
 * Loads `backend/.env` into `process.env` if the file exists.
 * Uses Node's built-in loader, so no `dotenv` dependency is needed.
 * Variables already set in the real environment are not overwritten.
 */
export function loadDotEnvFile(): void {
  const envFilePath = fileURLToPath(new URL('../../.env', import.meta.url));
  if (existsSync(envFilePath)) {
    process.loadEnvFile(envFilePath);
  }
}

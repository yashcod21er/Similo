import { z } from 'zod';

/**
 * HTTP client for the internal Python AI service (the ai/ folder).
 *
 * All calls from Node to Python go through this one module, so timeouts,
 * response validation and (from Phase 5) service-to-service authentication
 * are handled in a single place.
 */

const aiServiceHealthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
});

export type AiServiceHealth = z.infer<typeof aiServiceHealthSchema>;

export interface AiServiceClient {
  getHealth(): Promise<AiServiceHealth>;
}

export class AiServiceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AiServiceError';
  }
}

interface AiServiceClientOptions {
  baseUrl: string;
  timeoutMs: number;
}

export function createAiServiceClient({
  baseUrl,
  timeoutMs,
}: AiServiceClientOptions): AiServiceClient {
  return {
    async getHealth() {
      const response = await fetch(new URL('/health', baseUrl), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new AiServiceError(`AI service health check returned HTTP ${response.status}`);
      }

      // Never trust another service's response shape blindly: validate it.
      const parsed = aiServiceHealthSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new AiServiceError('AI service returned an unexpected health response', {
          cause: parsed.error,
        });
      }
      return parsed.data;
    },
  };
}

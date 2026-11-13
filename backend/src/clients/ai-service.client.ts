import { z } from 'zod';

/**
 * HTTP client for the internal Python AI service (the ai/ folder).
 *
 * All calls from Node to Python go through this one module, so timeouts,
 * response validation and service-to-service authentication (a shared bearer
 * token, AI_SERVICE_TOKEN) are handled in a single place.
 */

const aiServiceHealthSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
});

export type AiServiceHealth = z.infer<typeof aiServiceHealthSchema>;

/* ------------------------------------------------- POST /internal/ai/analyse */

export interface AiAnalyseImage {
  kind: 'favicon' | 'logo' | 'image';
  imageBase64: string;
}

export interface AiAnalysePage {
  finalUrl: string;
  title: string;
  text: string;
  screenshotBase64: string;
  images: AiAnalyseImage[];
  forms: { hasPasswordField: boolean; hasPaymentField: boolean; submitsToOtherDomain: boolean };
  certificateIssuedAt: string | null;
}

/** Request body (fixed contract 1 in the Phase 6 brief). */
export interface AiAnalyseRequest {
  brand: {
    name: string;
    description: string;
    keywords: string[];
    officialDomains: string[];
    logos: { id: string; imageBase64: string }[];
  };
  candidate: {
    domain: string;
    domainScore: number;
    registeredAt: string | null;
    /** null = the site could not be captured; name and age signals still score. */
    page: AiAnalysePage | null;
  };
}

const shortText = (max: number) => z.string().max(max);

export const aiAnalyseResponseSchema = z.object({
  modelVersion: shortText(60),
  score: z.number().int().min(0).max(100),
  level: z.enum(['low', 'medium', 'high']),
  signals: z
    .array(
      z.object({
        id: shortText(60),
        label: shortText(120),
        value: z.number().finite().nullable(),
        points: z.number().min(0).max(100),
        maxPoints: z.number().min(0).max(100),
        detail: shortText(500),
      }),
    )
    .max(20),
  reasons: z.array(shortText(500)).max(20),
  unavailable: z.array(shortText(60)).max(20),
  ocrText: shortText(2000).optional().default(''),
  logoMatch: z
    .object({
      logoId: shortText(64),
      source: z.enum(['favicon', 'logo', 'image', 'screenshot']),
      similarity: z.number().finite(),
      method: z.enum(['phash', 'clip']),
    })
    .nullable(),
  models: z.record(z.string(), z.string().max(200)).optional().default({}),
});

export type AiAnalyseResponse = z.infer<typeof aiAnalyseResponseSchema>;

export interface AiServiceClient {
  getHealth(): Promise<AiServiceHealth>;
  /** True when a service token is configured, so analysis calls can be made. */
  canAnalyse(): boolean;
  analyse(request: AiAnalyseRequest): Promise<AiAnalyseResponse>;
}

/**
 * Why a call failed:
 * - `unavailable`: not configured, unreachable, timed out, or refused us (401/503);
 * - `invalid_response`: answered, but not in the agreed shape;
 * - `rejected`: refused this particular request (400/413/422 and other errors).
 */
export type AiServiceErrorKind = 'unavailable' | 'invalid_response' | 'rejected';

export class AiServiceError extends Error {
  readonly kind: AiServiceErrorKind;

  constructor(
    message: string,
    options?: { cause?: unknown; kind?: AiServiceErrorKind; status?: number },
  ) {
    super(message, options);
    this.name = 'AiServiceError';
    this.kind = options?.kind ?? 'unavailable';
  }
}

interface AiServiceClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Shared secret for /internal/* calls (AI_SERVICE_TOKEN). */
  token?: string;
  /** Timeout for analysis calls (AI_ANALYSIS_TIMEOUT_MS); defaults to 90 s. */
  analysisTimeoutMs?: number;
}

export function createAiServiceClient({
  baseUrl,
  timeoutMs,
  token,
  analysisTimeoutMs = 90_000,
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

    canAnalyse() {
      return Boolean(token);
    },

    async analyse(request) {
      if (!token) {
        throw new AiServiceError('AI_SERVICE_TOKEN is not configured', { kind: 'unavailable' });
      }
      let response: Response;
      try {
        response = await fetch(new URL('/internal/ai/analyse', baseUrl), {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(analysisTimeoutMs),
          redirect: 'error',
        });
      } catch (err) {
        throw new AiServiceError('AI service could not be reached', {
          cause: err,
          kind: 'unavailable',
        });
      }

      if (!response.ok) {
        // Drain the body so the connection can be reused; never surface its text.
        await response.body?.cancel().catch(() => undefined);
        const kind: AiServiceErrorKind =
          response.status === 401 || response.status === 403 || response.status >= 500
            ? 'unavailable'
            : 'rejected';
        throw new AiServiceError(`AI service answered HTTP ${response.status}`, {
          kind,
          status: response.status,
        });
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch (err) {
        const timedOut =
          err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
        throw new AiServiceError(
          timedOut ? 'AI service timed out' : 'AI service answered with invalid JSON',
          { cause: err, kind: timedOut ? 'unavailable' : 'invalid_response' },
        );
      }
      const parsed = aiAnalyseResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new AiServiceError('AI service returned an unexpected analysis response', {
          cause: parsed.error,
          kind: 'invalid_response',
        });
      }
      return parsed.data;
    },
  };
}

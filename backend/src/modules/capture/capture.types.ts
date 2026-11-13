/**
 * What a page capture returns. The pipeline only depends on the `PageCapturer`
 * interface, so tests (and a disabled configuration) can use a fake.
 */

export type CaptureOutcome = 'captured' | 'unreachable' | 'blocked' | 'failed';

export type CapturedImageKind = 'favicon' | 'logo' | 'image';

export interface CapturedImage {
  kind: CapturedImageKind;
  /** PNG bytes (an element screenshot). */
  data: Buffer;
}

export interface CapturedForms {
  hasPasswordField: boolean;
  hasPaymentField: boolean;
  submitsToOtherDomain: boolean;
}

export interface CapturedPage {
  finalUrl: string;
  title: string;
  text: string;
  /** Viewport screenshot (1280×800), JPEG. */
  screenshot: Buffer;
  images: CapturedImage[];
  forms: CapturedForms;
  /** When the site's TLS certificate became valid, if the browser reported it. */
  certificateIssuedAt: string | null;
}

export type CaptureResult =
  | { status: 'captured'; capturedAt: Date; page: CapturedPage }
  | {
      status: Exclude<CaptureOutcome, 'captured'>;
      capturedAt: Date;
      /** Short technical reason for logs; never shown to users as-is. */
      reason: string;
    };

export interface PageCapturer {
  capture(url: string): Promise<CaptureResult>;
}

/** Hard limits for one capture (see docs/ARCHITECTURE.md, Phase 6). */
export const CAPTURE_LIMITS = {
  navigationTimeoutMs: 20_000,
  totalTimeoutMs: 45_000,
  maxBytes: 25 * 1024 * 1024,
  maxRequests: 150,
  maxTitleChars: 300,
  maxTextChars: 20_000,
  maxScreenshotBytes: 1.5 * 1024 * 1024,
  maxImages: 12,
  maxImageBytes: 512 * 1024,
  minImagePx: 24,
  viewport: { width: 1280, height: 800 },
} as const;

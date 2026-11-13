/**
 * The `analysis` stored on each finding (fixed contract 2 in the Phase 6 brief).
 * It stays null until the first analysis runs.
 */

export const ANALYSIS_STATUSES = ['pending', 'complete', 'failed', 'unavailable'] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const CAPTURE_STATUSES = ['captured', 'unreachable', 'blocked', 'failed', 'skipped'] as const;
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number];

export const LOGO_SOURCES = ['favicon', 'logo', 'image', 'screenshot'] as const;
export const LOGO_METHODS = ['phash', 'clip'] as const;

export interface AnalysisSignal {
  id: string;
  label: string;
  value: number | null;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface AnalysisCapture {
  status: CaptureStatus;
  finalUrl: string | null;
  title: string | null;
  hasScreenshot: boolean;
  capturedAt: Date | null;
}

export interface AnalysisLogoMatch {
  logoId: string;
  source: (typeof LOGO_SOURCES)[number];
  similarity: number;
  method: (typeof LOGO_METHODS)[number];
}

export interface FindingAnalysis {
  status: AnalysisStatus;
  score: number | null;
  level: RiskLevel | null;
  signals: AnalysisSignal[];
  reasons: string[];
  unavailable: string[];
  capture: AnalysisCapture | null;
  logoMatch: AnalysisLogoMatch | null;
  modelVersion: string | null;
  analysedAt: Date | null;
  /** A plain sentence for people; never a stack trace or raw error. */
  error: string | null;
}

/** The JSON shape sent to the website. */
export interface FindingAnalysisDto extends Omit<FindingAnalysis, 'capture' | 'analysedAt'> {
  capture: (Omit<AnalysisCapture, 'capturedAt'> & { capturedAt: string | null }) | null;
  analysedAt: string | null;
}

export function toAnalysisDto(analysis: FindingAnalysis | null): FindingAnalysisDto | null {
  if (!analysis) return null;
  return {
    status: analysis.status,
    score: analysis.score,
    level: analysis.level,
    signals: analysis.signals.map((signal) => ({ ...signal })),
    reasons: [...analysis.reasons],
    unavailable: [...analysis.unavailable],
    capture: analysis.capture
      ? {
          status: analysis.capture.status,
          finalUrl: analysis.capture.finalUrl,
          title: analysis.capture.title,
          hasScreenshot: analysis.capture.hasScreenshot,
          capturedAt: analysis.capture.capturedAt?.toISOString() ?? null,
        }
      : null,
    logoMatch: analysis.logoMatch ? { ...analysis.logoMatch } : null,
    modelVersion: analysis.modelVersion,
    analysedAt: analysis.analysedAt?.toISOString() ?? null,
    error: analysis.error,
  };
}

/** The analysis shown while a new run is queued or in progress (earlier results kept). */
export function pendingAnalysis(previous: FindingAnalysis | null): FindingAnalysis {
  return {
    status: 'pending',
    score: previous?.score ?? null,
    level: previous?.level ?? null,
    signals: previous?.signals ?? [],
    reasons: previous?.reasons ?? [],
    unavailable: previous?.unavailable ?? [],
    capture: previous?.capture ?? null,
    logoMatch: previous?.logoMatch ?? null,
    modelVersion: previous?.modelVersion ?? null,
    analysedAt: previous?.analysedAt ?? null,
    error: null,
  };
}

import { ApiError } from '@/lib/api-client';
import type {
  AnalysisCapture,
  AnalysisSignal,
  FindingAnalysis,
  FindingStatus,
  RiskLevel,
} from './api';

/* Plain-language helpers for the finding page. Nothing here touches React. */

export const LEVEL_LABEL: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
};

export const STATUS_OPTIONS: { value: FindingStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dismissed', label: 'Dismissed' },
];

/** Colour never carries the meaning alone: every level also has a word and an icon. */
export const LEVEL_STYLE: Record<RiskLevel, { badge: string; bar: string }> = {
  low: { badge: 'bg-emerald-50 text-emerald-900 ring-emerald-200', bar: 'bg-emerald-700' },
  medium: { badge: 'bg-amber-100 text-amber-900 ring-amber-300', bar: 'bg-amber-600' },
  high: { badge: 'bg-red-100 text-red-900 ring-red-200', bar: 'bg-red-700' },
};

/** The eight checks of the risk score, in the order they are always listed. */
const SIGNAL_ORDER = [
  'domain_similarity',
  'logo_match',
  'text_similarity',
  'brand_mention',
  'credential_form',
  'payment_form',
  'new_domain',
  'new_certificate',
] as const;

/** Used only when a check could not be computed and the API sent no label for it. */
const SIGNAL_FALLBACK_LABEL: Record<string, string> = {
  domain_similarity: 'Domain name',
  logo_match: 'Logo',
  text_similarity: 'Page wording',
  brand_mention: 'Brand name on the page',
  credential_form: 'Password form',
  payment_form: 'Payment form',
  new_domain: 'New domain',
  new_certificate: 'New certificate',
};

/** Checks that need the suspect page itself. */
const PAGE_SIGNALS = new Set([
  'logo_match',
  'text_similarity',
  'brand_mention',
  'credential_form',
  'payment_form',
  'new_certificate',
]);

export type SignalRow =
  | { kind: 'scored'; id: string; label: string; points: number; maxPoints: number; detail: string }
  | { kind: 'unavailable'; id: string; label: string; reason: string };

export function pageWasNotCaptured(capture: AnalysisCapture | null): boolean {
  return capture !== null && capture.status !== 'captured';
}

/** Why a check was not made, in one plain sentence. */
export function unavailableReason(id: string, capture: AnalysisCapture | null): string {
  if (PAGE_SIGNALS.has(id)) {
    return pageWasNotCaptured(capture)
      ? 'Needs the suspect page, which we could not open.'
      : 'Similo could not work this out this time.';
  }
  if (id === 'new_domain') return 'No registration date was available for this domain.';
  return 'Similo could not work this out this time.';
}

/**
 * Every check as one row: scored checks with their points, and the checks that could not be
 * made as "Not checked". Rows follow a fixed order so two findings can be compared by eye.
 */
export function buildSignalRows(analysis: FindingAnalysis): SignalRow[] {
  const missing = new Set(analysis.unavailable);
  const rows = new Map<string, SignalRow>();

  for (const signal of analysis.signals ?? []) {
    if (missing.has(signal.id)) continue;
    rows.set(signal.id, {
      kind: 'scored',
      id: signal.id,
      label: signal.label,
      points: signal.points,
      maxPoints: signal.maxPoints,
      detail: signal.detail,
    });
  }
  for (const id of missing) {
    const sent = analysis.signals?.find((signal) => signal.id === id);
    rows.set(id, {
      kind: 'unavailable',
      id,
      label: sent?.label ?? SIGNAL_FALLBACK_LABEL[id] ?? id.replaceAll('_', ' '),
      reason: unavailableReason(id, analysis.capture),
    });
  }

  const position = (id: string) => {
    const index = (SIGNAL_ORDER as readonly string[]).indexOf(id);
    return index === -1 ? SIGNAL_ORDER.length : index;
  };
  // Array.prototype.sort is stable, so unknown ids keep the order the API sent them in.
  return [...rows.values()].sort((a, b) => position(a.id) - position(b.id));
}

/** Total of the points that were actually scored. */
export function totalPoints(signals: AnalysisSignal[] | undefined): number {
  return (signals ?? []).reduce((sum, signal) => sum + signal.points, 0);
}

/** "We could not open the site safely..." plus one sentence about what happened. */
export function captureProblem(capture: AnalysisCapture | null): {
  headline: string;
  detail: string;
} | null {
  if (!pageWasNotCaptured(capture) || !capture) return null;
  const headline =
    'We could not open the site safely, so only the name and registration were checked.';
  switch (capture.status) {
    case 'unreachable':
      return { headline, detail: 'The site did not answer.' };
    case 'blocked':
      return { headline, detail: 'Our safety checks did not allow the visit.' };
    case 'skipped':
      return { headline, detail: 'Opening the page was skipped for this analysis.' };
    default:
      return { headline, detail: 'Opening the page failed.' };
  }
}

export const LOGO_SOURCE_TEXT: Record<'favicon' | 'logo' | 'image' | 'screenshot', string> = {
  favicon: "the site's small tab icon",
  logo: "the site's logo",
  image: 'an image on the page',
  screenshot: 'the page screenshot',
};

/** A friendly sentence for a failed "Analyse again" request. */
export function analyseErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return 'The analysis service is not available right now. Nothing was changed. Please try again in a few minutes.';
    }
    if (error.status === 429) {
      return 'You have asked for several analyses in a short time. Please wait a while and try again.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_PATH, apiRequest, sendJson } from '@/lib/api-client';

export type FindingStatus = 'new' | 'reviewing' | 'confirmed' | 'dismissed';
export type FindingSource = 'certificate_transparency' | 'fixture';
export type FindingSort = 'recent' | 'risk';

/* ----------------------------------------------------------------- Analysis
 * Mirrors the finding `analysis` sub-document of the API (Phase 6, contract 2). */

export type AnalysisStatus = 'pending' | 'complete' | 'failed' | 'unavailable';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CaptureStatus = 'captured' | 'unreachable' | 'blocked' | 'failed' | 'skipped';

export interface AnalysisSignal {
  /** For example `domain_similarity`, `logo_match`, `credential_form`. */
  id: string;
  label: string;
  value: number | null;
  points: number;
  maxPoints: number;
  /** One plain sentence. */
  detail: string;
}

export interface AnalysisCapture {
  status: CaptureStatus;
  finalUrl: string | null;
  title: string | null;
  hasScreenshot: boolean;
  capturedAt: string | null;
}

export interface LogoMatch {
  logoId: string;
  source: 'favicon' | 'logo' | 'image' | 'screenshot';
  /** 0 to 1 */
  similarity: number;
  method: 'phash' | 'clip';
}

export interface FindingAnalysis {
  status: AnalysisStatus;
  /** 0 to 100, the sum of the signals' points. */
  score: number | null;
  level: RiskLevel | null;
  /** The list endpoint may leave this out. */
  signals?: AnalysisSignal[];
  reasons: string[];
  /** Ids of the signals that could not be computed. */
  unavailable: string[];
  capture: AnalysisCapture | null;
  logoMatch: LogoMatch | null;
  modelVersion: string | null;
  analysedAt: string | null;
  /** A plain sentence, never a stack trace. */
  error: string | null;
}

export interface Finding {
  id: string;
  brandId: string;
  brandName: string;
  domain: string;
  source: FindingSource;
  sourceReferences: string[];
  /** The Phase 5 domain-name score, 0 to 100. */
  score: number;
  matchedTerm: string;
  reasons: string[];
  registration: {
    registeredAt: string | null;
    registrar: string | null;
    nameservers: string[];
    checkedAt: string | null;
  };
  status: FindingStatus;
  /** `null` (or missing on an older API) until the first analysis. */
  analysis?: FindingAnalysis | null;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

interface FindingPage {
  findings: Finding[];
  nextCursor: string | null;
}

/** Where images come from. They need the session cookie, so use them in an <img> only. */
export const brandLogoUrl = (brandId: string, logoId: string) =>
  `${API_BASE_PATH}/brands/${encodeURIComponent(brandId)}/logos/${encodeURIComponent(logoId)}`;

export const findingScreenshotUrl = (findingId: string) =>
  `${API_BASE_PATH}/findings/${encodeURIComponent(findingId)}/screenshot`;

/* ------------------------------------------------------------------- Hooks */

const findingKeys = {
  all: ['findings'] as const,
  list: (status: FindingStatus | 'all', sort: FindingSort) =>
    ['findings', 'list', status, sort] as const,
  detail: (findingId: string) => ['findings', 'detail', findingId] as const,
};

export function useFindings(status: FindingStatus | 'all', sort: FindingSort = 'recent') {
  return useInfiniteQuery({
    queryKey: findingKeys.list(status, sort),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '25' });
      if (status !== 'all') params.set('status', status);
      // "recent" is the API's default, so only the other choice is sent.
      if (sort === 'risk') params.set('sort', 'risk');
      if (pageParam) params.set('before', pageParam);
      return apiRequest<FindingPage>(`/findings?${params.toString()}`);
    },
    getNextPageParam: (page) => page.nextCursor,
  });
}

/** How often the page asks again while an analysis is running. */
export const PENDING_POLL_MS = 3_000;

/**
 * One finding. While its analysis is pending the query asks again every few seconds, and
 * stops as soon as the analysis is complete, failed or unavailable.
 */
export function useFinding(findingId: string) {
  return useQuery({
    queryKey: findingKeys.detail(findingId),
    queryFn: () => apiRequest<Finding>(`/findings/${encodeURIComponent(findingId)}`),
    refetchInterval: (query) =>
      query.state.data?.analysis?.status === 'pending' ? PENDING_POLL_MS : false,
  });
}

export function useUpdateFindingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ findingId, status }: { findingId: string; status: FindingStatus }) =>
      sendJson<Finding>(`/findings/${encodeURIComponent(findingId)}`, { status }, 'PATCH'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: findingKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] });
    },
  });
}

/** Asks for a fresh analysis. The API answers 202 with a pending analysis; the page then polls. */
export function useAnalyseFinding(findingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      sendJson<{ analysis: Partial<FindingAnalysis> & { status: AnalysisStatus } }>(
        `/findings/${encodeURIComponent(findingId)}/analyse`,
        {},
      ),
    onSuccess: ({ analysis }) => {
      queryClient.setQueryData<Finding>(findingKeys.detail(findingId), (current) =>
        current
          ? {
              ...current,
              analysis: {
                score: null,
                level: null,
                signals: [],
                reasons: [],
                unavailable: [],
                capture: null,
                logoMatch: null,
                modelVersion: null,
                analysedAt: null,
                error: null,
                ...analysis,
              },
            }
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: findingKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['audit-events'] });
    },
  });
}

export function useRequestDomainScan(brandId: string) {
  return useMutation({
    mutationFn: () =>
      sendJson<{ status: 'queued'; jobId: string }>(
        `/brands/${encodeURIComponent(brandId)}/scan`,
        {},
      ),
  });
}

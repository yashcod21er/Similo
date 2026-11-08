import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest, sendForm, sendJson } from '@/lib/api-client';

/* Mirrors the Phase 4 brands API (backend/src/modules/brands). Dates are ISO strings. */

export type BrandStatus = 'active' | 'paused';
export type TrademarkOffice = 'USPTO' | 'EUIPO' | 'WIPO' | 'IP_INDIA' | 'UKIPO' | 'OTHER';
export type TrademarkStatus = 'filed' | 'registered' | 'expired';
export type Sensitivity = 'low' | 'medium' | 'high';

export interface BrandSummary {
  id: string;
  name: string;
  /** '' when empty */
  description: string;
  status: BrandStatus;
  /** URL of the first logo, or null. Needs the session cookie, so use it in an <img> only. */
  logoUrl: string | null;
  counts: { keywords: number; domains: number; trademarks: number; logos: number };
  updatedAt: string;
}

export interface Trademark {
  id: string;
  mark: string;
  office: TrademarkOffice;
  number: string;
  /** Nice classes, 1–45, unique and sorted */
  classes: number[];
  status: TrademarkStatus;
  /** 'YYYY-MM-DD' or null */
  date: string | null;
}

export interface Logo {
  id: string;
  fileName: string;
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
  size: number;
  uploadedAt: string;
  /** '/api/v1/brands/<brandId>/logos/<logoId>' (authenticated GET) */
  url: string;
}

export interface Monitoring {
  domains: boolean;
  apps: boolean;
  trademarks: boolean;
  sensitivity: Sensitivity;
  emailAlerts: boolean;
  updatedAt: string | null;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  status: BrandStatus;
  keywords: string[];
  domains: { domain: string; addedAt: string }[];
  trademarks: Trademark[];
  logos: Logo[];
  monitoring: Monitoring;
  createdAt: string;
  updatedAt: string;
}

export interface NewBrand {
  name: string;
  description?: string;
  keywords?: string[];
}

export type BrandChanges = Partial<NewBrand> & { status?: BrandStatus };

export interface TrademarkInput {
  mark: string;
  office: TrademarkOffice;
  number: string;
  classes: number[];
  status: TrademarkStatus;
  date?: string | null;
}

export type MonitoringInput = Omit<Monitoring, 'updatedAt'>;

export const brandKeys = {
  list: ['brands'] as const,
  detail: (brandId: string) => ['brands', brandId] as const,
};

/** The organisation's audit log (kept in step with features/organization/api.ts). */
const AUDIT_KEY = ['audit-events'] as const;

const brandPath = (brandId: string) => `/brands/${encodeURIComponent(brandId)}`;

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.list,
    queryFn: () => apiRequest<BrandSummary[]>('/brands'),
  });
}

export function useBrand(brandId: string) {
  return useQuery({
    queryKey: brandKeys.detail(brandId),
    queryFn: () => apiRequest<Brand>(brandPath(brandId)),
  });
}

const toSummary = (brand: Brand): BrandSummary => ({
  id: brand.id,
  name: brand.name,
  description: brand.description,
  status: brand.status,
  logoUrl: brand.logos[0]?.url ?? null,
  counts: {
    keywords: brand.keywords.length,
    domains: brand.domains.length,
    trademarks: brand.trademarks.length,
    logos: brand.logos.length,
  },
  updatedAt: brand.updatedAt,
});

/**
 * Keeps the cached brand list and brand pages in step with what the API just confirmed, so a
 * change (or a deletion) never shows up as stale data when you go back to the list.
 * Every change also writes an audit event, so the audit log is refreshed too.
 */
function useBrandCache() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: brandKeys.list, exact: true });
    void queryClient.invalidateQueries({ queryKey: AUDIT_KEY });
  };
  return {
    saved(brand: Brand) {
      queryClient.setQueryData(brandKeys.detail(brand.id), brand);
      queryClient.setQueryData<BrandSummary[]>(brandKeys.list, (list) => {
        if (!list) return list;
        const summary = toSummary(brand);
        return list.some((item) => item.id === brand.id)
          ? list.map((item) => (item.id === brand.id ? summary : item))
          : [summary, ...list];
      });
      refresh();
    },
    removed(brandId: string) {
      queryClient.setQueryData<BrandSummary[]>(brandKeys.list, (list) =>
        list?.filter((item) => item.id !== brandId),
      );
      // Mark the cached page stale (without fetching it) so going "Back" never shows a deleted brand.
      void queryClient.invalidateQueries({
        queryKey: brandKeys.detail(brandId),
        refetchType: 'none',
      });
      refresh();
    },
    /** "Someone else changed this brand at the same moment" (409): load it again. */
    conflicted(brandId: string, error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: brandKeys.detail(brandId), exact: true });
      }
    },
  };
}

/** A change to one brand: the API answers with the whole updated brand, which we cache. */
function useBrandChange<TInput>(brandId: string, send: (input: TInput) => Promise<Brand>) {
  const cache = useBrandCache();
  return useMutation({
    mutationFn: send,
    onSuccess: cache.saved,
    // The form shows the API's message; we also reload the brand so the screen matches what is saved.
    onError: (error) => cache.conflicted(brandId, error),
  });
}

export function useCreateBrand() {
  const cache = useBrandCache();
  return useMutation({
    mutationFn: (input: NewBrand) => sendJson<Brand>('/brands', input),
    onSuccess: cache.saved,
  });
}

export function useUpdateBrand(brandId: string) {
  return useBrandChange(brandId, (changes: BrandChanges) =>
    sendJson<Brand>(brandPath(brandId), changes, 'PATCH'),
  );
}

export function useDeleteBrand(brandId: string) {
  const cache = useBrandCache();
  return useMutation({
    mutationFn: () => sendJson<{ deleted: true }>(brandPath(brandId), undefined, 'DELETE'),
    onSuccess: () => cache.removed(brandId),
  });
}

export function useAddDomain(brandId: string) {
  return useBrandChange(brandId, (domain: string) =>
    sendJson<Brand>(`${brandPath(brandId)}/domains`, { domain }),
  );
}

export function useRemoveDomain(brandId: string) {
  return useBrandChange(brandId, (domain: string) =>
    sendJson<Brand>(
      `${brandPath(brandId)}/domains/${encodeURIComponent(domain)}`,
      undefined,
      'DELETE',
    ),
  );
}

export function useAddTrademark(brandId: string) {
  return useBrandChange(brandId, (input: TrademarkInput) =>
    sendJson<Brand>(`${brandPath(brandId)}/trademarks`, input),
  );
}

export function useUpdateTrademark(brandId: string) {
  return useBrandChange(
    brandId,
    ({ trademarkId, changes }: { trademarkId: string; changes: Partial<TrademarkInput> }) =>
      sendJson<Brand>(
        `${brandPath(brandId)}/trademarks/${encodeURIComponent(trademarkId)}`,
        changes,
        'PATCH',
      ),
  );
}

export function useRemoveTrademark(brandId: string) {
  return useBrandChange(brandId, (trademarkId: string) =>
    sendJson<Brand>(
      `${brandPath(brandId)}/trademarks/${encodeURIComponent(trademarkId)}`,
      undefined,
      'DELETE',
    ),
  );
}

export function useSaveMonitoring(brandId: string) {
  return useBrandChange(brandId, (settings: MonitoringInput) =>
    sendJson<Brand>(`${brandPath(brandId)}/monitoring`, settings, 'PUT'),
  );
}

export function useUploadLogo(brandId: string) {
  return useBrandChange(brandId, (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return sendForm<Brand>(`${brandPath(brandId)}/logos`, form);
  });
}

export function useRemoveLogo(brandId: string) {
  return useBrandChange(brandId, (logoId: string) =>
    sendJson<Brand>(
      `${brandPath(brandId)}/logos/${encodeURIComponent(logoId)}`,
      undefined,
      'DELETE',
    ),
  );
}

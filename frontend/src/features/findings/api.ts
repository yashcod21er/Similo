import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, sendJson } from '@/lib/api-client';

export type FindingStatus = 'new' | 'reviewing' | 'confirmed' | 'dismissed';
export type FindingSource = 'certificate_transparency' | 'fixture';

export interface Finding {
  id: string;
  brandId: string;
  brandName: string;
  domain: string;
  source: FindingSource;
  sourceReferences: string[];
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
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

interface FindingPage {
  findings: Finding[];
  nextCursor: string | null;
}

const findingKeys = {
  all: ['findings'] as const,
  list: (status: FindingStatus | 'all') => ['findings', 'list', status] as const,
};

export function useFindings(status: FindingStatus | 'all') {
  return useInfiniteQuery({
    queryKey: findingKeys.list(status),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '25' });
      if (status !== 'all') params.set('status', status);
      if (pageParam) params.set('before', pageParam);
      return apiRequest<FindingPage>(`/findings?${params.toString()}`);
    },
    getNextPageParam: (page) => page.nextCursor,
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

export function useRequestDomainScan(brandId: string) {
  return useMutation({
    mutationFn: () =>
      sendJson<{ status: 'queued'; jobId: string }>(
        `/brands/${encodeURIComponent(brandId)}/scan`,
        {},
      ),
  });
}

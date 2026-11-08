import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';

/** Mirrors the API's SystemStatusReport (backend/src/modules/health/health.types.ts). */
export type DependencyState = 'up' | 'down' | 'not_configured';
export type OverallStatus = 'ok' | 'degraded' | 'down';

export interface DependencyReport {
  name: string;
  critical: boolean;
  status: DependencyState;
  message: string;
  latencyMs?: number;
}

export interface SystemStatusReport {
  status: OverallStatus;
  checkedAt: string;
  dependencies: DependencyReport[];
}

export function getSystemStatus(): Promise<SystemStatusReport> {
  return apiRequest<SystemStatusReport>('/health/dependencies');
}

/**
 * TanStack Query caches the result, de-duplicates concurrent requests and
 * re-fetches every 15 seconds so the page stays current.
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: getSystemStatus,
    refetchInterval: 15_000,
  });
}

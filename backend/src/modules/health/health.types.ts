export type DependencyState = 'up' | 'down' | 'not_configured';

export interface DependencyCheckResult {
  status: DependencyState;
  /** Short, user-safe description. Never include connection strings or stack traces. */
  message: string;
  latencyMs?: number;
}

export interface DependencyCheck {
  name: string;
  /** A critical dependency being down means the API cannot do its core job. */
  critical: boolean;
  run(): Promise<DependencyCheckResult>;
}

export interface DependencyReport extends DependencyCheckResult {
  name: string;
  critical: boolean;
}

/**
 * - ok: everything is up.
 * - degraded: core features work, but an optional dependency is down or not configured.
 * - down: a critical dependency is unavailable.
 */
export type OverallStatus = 'ok' | 'degraded' | 'down';

export interface SystemStatusReport {
  status: OverallStatus;
  checkedAt: string;
  dependencies: DependencyReport[];
}

export interface LivenessReport {
  status: 'ok';
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

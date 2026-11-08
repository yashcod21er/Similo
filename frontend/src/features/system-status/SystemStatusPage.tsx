import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';
import { useSystemStatus, type DependencyState, type OverallStatus } from './api';

const DEPENDENCY_LABELS: Record<string, string> = {
  database: 'MongoDB Atlas',
  aiService: 'AI intelligence service',
};

const OVERALL_COPY: Record<OverallStatus, { label: string; tone: string }> = {
  ok: { label: 'All systems operational', tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  degraded: { label: 'Partially available', tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
  down: { label: 'Core service unavailable', tone: 'bg-red-50 text-red-800 ring-red-200' },
};

function StatusIcon({ state }: { state: DependencyState }) {
  switch (state) {
    case 'up':
      return <CheckCircle2 aria-hidden className="size-5 text-emerald-600" />;
    case 'down':
      return <XCircle aria-hidden className="size-5 text-crimson-dark" />;
    case 'not_configured':
      return <CircleDashed aria-hidden className="size-5 text-amber-600" />;
  }
}

const STATE_LABELS: Record<DependencyState, string> = {
  up: 'Operational',
  down: 'Down',
  not_configured: 'Not configured',
};

function Row({
  name,
  state,
  detail,
  latencyMs,
}: {
  name: string;
  state: DependencyState;
  detail: string;
  latencyMs?: number | undefined;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <StatusIcon state={state} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{name}</p>
        <p className="truncate text-sm text-muted">{detail}</p>
      </div>
      <div className="text-right text-sm">
        <p className="font-medium">{STATE_LABELS[state]}</p>
        {latencyMs !== undefined && <p className="text-muted">{latencyMs} ms</p>}
      </div>
    </li>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line">
      {children}
    </section>
  );
}

export function SystemStatusPage() {
  const { data, error, isPending, isFetching, refetch } = useSystemStatus();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] font-medium tracking-[0.08em] text-crimson-dark uppercase">
            Platform
          </p>
          <h1 className="text-headline mt-4 font-semibold">System status</h1>
          <p className="mt-3 text-muted">
            Live connectivity between the web app, API, database and AI service.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm font-medium hover:bg-paper disabled:opacity-50"
        >
          <RefreshCw aria-hidden className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {isPending && (
        <Panel>
          <p role="status" className="px-5 py-8 text-center text-muted">
            Checking services…
          </p>
        </Panel>
      )}

      {error && (
        <Panel>
          <div role="alert" className="flex items-start gap-3 px-5 py-5">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-crimson-dark" />
            <div>
              <p className="font-medium">The API could not be reached</p>
              <p className="mt-1 text-sm text-muted">{error.message}</p>
              {error instanceof ApiError && error.requestId && (
                <p className="mt-1 text-xs text-muted">Request ID: {error.requestId}</p>
              )}
            </div>
          </div>
        </Panel>
      )}

      {data && (
        <div className="space-y-4">
          <p
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ring-1 ${OVERALL_COPY[data.status].tone}`}
          >
            {OVERALL_COPY[data.status].label}
          </p>
          <Panel>
            <ul className="divide-y divide-line">
              <Row name="Similo API" state="up" detail="Reachable from the web app" />
              {data.dependencies.map((dependency) => (
                <Row
                  key={dependency.name}
                  name={DEPENDENCY_LABELS[dependency.name] ?? dependency.name}
                  state={dependency.status}
                  detail={dependency.message}
                  latencyMs={dependency.latencyMs}
                />
              ))}
            </ul>
          </Panel>
          <p className="text-xs text-muted">
            Last checked {new Date(data.checkedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

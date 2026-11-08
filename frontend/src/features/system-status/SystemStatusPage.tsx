import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';
import { useSystemStatus, type DependencyState, type OverallStatus } from './api';

const DEPENDENCY_LABELS: Record<string, string> = {
  database: 'MongoDB Atlas',
  aiService: 'AI intelligence service',
};

const OVERALL_COPY: Record<OverallStatus, { label: string; dot: string; tone: string }> = {
  ok: {
    label: 'All systems operational',
    dot: 'bg-emerald-500',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  degraded: {
    label: 'Partially available',
    dot: 'bg-amber-500',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  down: {
    label: 'Core service unavailable',
    dot: 'bg-red-600',
    tone: 'border-red-200 bg-red-50 text-red-900',
  },
};

function StatusIcon({ state }: { state: DependencyState }) {
  switch (state) {
    case 'up':
      return <CheckCircle2 aria-hidden className="size-5 shrink-0 text-emerald-600" />;
    case 'down':
      return <XCircle aria-hidden className="size-5 shrink-0 text-accent-ink" />;
    case 'not_configured':
      return <CircleDashed aria-hidden className="size-5 shrink-0 text-amber-600" />;
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
    <li className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <StatusIcon state={state} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{name}</p>
        <p className="truncate text-sm text-muted">{detail}</p>
      </div>
      <div className="shrink-0 text-right text-sm">
        <p className="font-medium">{STATE_LABELS[state]}</p>
        {latencyMs !== undefined && <p className="text-muted">{latencyMs} ms</p>}
      </div>
    </li>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white">{children}</section>
  );
}

export function SystemStatusPage() {
  const { data, error, isPending, isFetching, refetch } = useSystemStatus();

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-accent-ink">Platform</p>
            <h1 className="text-headline mt-4 font-semibold">System status</h1>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Live checks of the connection between the web app, the API, the database and the AI
              service.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm font-medium hover:bg-cream disabled:opacity-50"
          >
            <RefreshCw aria-hidden className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <div className="mt-10 space-y-4">
          {isPending && (
            <Panel>
              <p role="status" className="px-5 py-8 text-center text-muted">
                Checking services…
              </p>
            </Panel>
          )}

          {error && (
            <Panel>
              <div role="alert" className="flex items-start gap-3 px-5 py-5 sm:px-6">
                <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
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
            <>
              <p
                className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-[1.0625rem] font-medium sm:px-6 ${OVERALL_COPY[data.status].tone}`}
              >
                <span
                  aria-hidden
                  className={`size-2.5 rounded-full ${OVERALL_COPY[data.status].dot}`}
                />
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
              <p className="text-[13px] text-muted">
                Last checked {new Date(data.checkedAt).toLocaleTimeString()}. This page checks again
                every 15 seconds while it is open. It shows the current state only, not a history.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { Container, Eyebrow } from '@/components/ui/layout';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useSystemStatus, type DependencyState, type OverallStatus } from './api';

const DEPENDENCY_LABELS: Record<string, string> = {
  database: 'MongoDB Atlas',
  aiService: 'AI intelligence service',
};

/** `dot` is the colour on the dark band: semantic status colours, not brand colours. */
const OVERALL_COPY: Record<OverallStatus, { label: string; dot: string }> = {
  ok: { label: 'All systems operational', dot: 'bg-emerald-400' },
  degraded: { label: 'Partially available', dot: 'bg-amber-400' },
  down: { label: 'Core service unavailable', dot: 'bg-red-400' },
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
    <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line">
      {children}
    </section>
  );
}

/** The one-line verdict on the dark band. It is a live region, so changes are announced. */
function Verdict({ dot, children }: { dot: string | null; children: ReactNode }) {
  return (
    <p
      role="status"
      className="inline-flex items-center gap-3 rounded-full bg-cream/[0.07] py-3 pr-6 pl-5 text-[1.0625rem] font-medium text-cream ring-1 ring-cream/15"
    >
      {dot ? (
        <span className="relative flex size-2.5" aria-hidden>
          <span
            className={cn(
              'absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping-slow',
              dot,
            )}
          />
          <span className={cn('relative size-2.5 rounded-full', dot)} />
        </span>
      ) : (
        <span aria-hidden className="size-2.5 rounded-full bg-cream/40" />
      )}
      {children}
    </p>
  );
}

export function SystemStatusPage() {
  const { data, error, isPending, isFetching, refetch } = useSystemStatus();

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-cream">
        <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-50" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/80 to-night/40"
        />
        <Container className="py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <Eyebrow tone="dark">Platform</Eyebrow>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="text-display font-semibold text-cream">System status</h1>
                <p className="text-lead mt-5 max-w-md text-cream/75">
                  Live checks of the connection between the web app, the API, the database and the
                  AI service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-cream/25 px-4 text-sm font-medium text-cream transition-colors hover:border-cream/50 hover:bg-cream/5 disabled:opacity-50"
              >
                <RefreshCw aria-hidden className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="mt-10">
              {isPending ? (
                <Verdict dot={null}>Checking services…</Verdict>
              ) : data ? (
                <Verdict dot={OVERALL_COPY[data.status].dot}>
                  {OVERALL_COPY[data.status].label}
                </Verdict>
              ) : (
                <Verdict dot="bg-red-400">Status unavailable</Verdict>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6 sm:py-16">
          {isPending && (
            <Panel>
              <ul aria-hidden className="divide-y divide-line">
                {[0, 1, 2].map((row) => (
                  <li key={row} className="flex items-center gap-4 px-5 py-5 sm:px-6">
                    <span className="size-5 rounded-full bg-cream-deep" />
                    <span className="h-3.5 w-40 rounded-full bg-cream-deep" />
                  </li>
                ))}
              </ul>
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
      </section>
    </>
  );
}

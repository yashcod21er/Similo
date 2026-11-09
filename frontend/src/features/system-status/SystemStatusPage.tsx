import { AlertTriangle, CheckCircle2, CircleDashed, RefreshCw, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Container } from '@/components/ui/layout';
import { MonoLabel } from '@/components/ui/specimen';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useSystemStatus, type DependencyState, type OverallStatus } from './api';

const DEPENDENCY_LABELS: Record<string, string> = {
  database: 'MongoDB Atlas',
  aiService: 'AI intelligence service',
  monitoringQueue: 'Domain-monitoring queue',
};

/** `dot` is the colour on the light band: semantic status colours, not brand colours. */
const OVERALL_COPY: Record<OverallStatus, { label: string; dot: string }> = {
  ok: { label: 'All systems operational', dot: 'bg-emerald-600' },
  degraded: { label: 'Partially available', dot: 'bg-amber-500' },
  down: { label: 'Core service unavailable', dot: 'bg-red-600' },
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
  index,
}: {
  name: string;
  state: DependencyState;
  detail: string;
  latencyMs?: number | undefined;
  index: number;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-5 sm:px-6">
      <MonoLabel className="hidden w-8 shrink-0 sm:block">0{index + 1}</MonoLabel>
      <StatusIcon state={state} />
      <div className="min-w-0 flex-1">
        <p className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{name}</p>
        <p className="truncate text-sm text-muted">{detail}</p>
      </div>
      <div className="shrink-0 text-right text-sm">
        <p className="font-medium">{STATE_LABELS[state]}</p>
        {latencyMs !== undefined && (
          <p className="font-mono text-[12.5px] text-muted">{latencyMs} ms</p>
        )}
      </div>
    </li>
  );
}

/** A ledger: hairline frame, rows ruled apart. */
function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-line-strong bg-white">
      {children}
    </section>
  );
}

/** The one-line verdict under the headline. It is a live region, so changes are announced. */
function Verdict({ dot, children }: { dot: string | null; children: ReactNode }) {
  return (
    <p
      role="status"
      className="inline-flex items-center gap-3 rounded-full bg-white py-3 pr-6 pl-5 text-[1.0625rem] font-medium text-ink ring-1 ring-line-strong"
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
        <span aria-hidden className="size-2.5 rounded-full bg-ink/30" />
      )}
      {children}
    </p>
  );
}

export function SystemStatusPage() {
  const { data, error, isPending, isFetching, refetch } = useSystemStatus();

  return (
    <>
      <section className="bg-cream">
        <Container className="py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <MonoLabel>Platform · Live check</MonoLabel>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="text-[clamp(2.75rem,1rem+6vw,5.75rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-ink">
                  System status
                </h1>
                <p className="text-lead mt-6 max-w-md text-muted">
                  Live checks of the connection between the web app, the API, the database and the
                  AI service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                disabled={isFetching}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink/40 disabled:opacity-50"
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
                <Verdict dot="bg-red-600">Status unavailable</Verdict>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line-strong bg-cream">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6 sm:py-16">
          {isPending && (
            <Panel>
              <ul aria-hidden className="divide-y divide-line-strong">
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
                <ul className="divide-y divide-line-strong">
                  <Row index={0} name="Similo API" state="up" detail="Reachable from the web app" />
                  {data.dependencies.map((dependency, index) => (
                    <Row
                      key={dependency.name}
                      index={index + 1}
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

      {/* The page's one orange band. A plain link: this page must also render without a router. */}
      <section className="bg-accent text-white">
        <Container className="flex flex-wrap items-center justify-between gap-6 py-12 sm:py-14">
          <div>
            <MonoLabel tone="orange">Something look wrong?</MonoLabel>
            <p className="mt-3 max-w-xl text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance text-white">
              Tell us, and we will look into it.
            </p>
          </div>
          <a
            href="/contact"
            className="inline-flex h-12 items-center justify-center rounded-full bg-night px-6 text-base font-medium tracking-[-0.01em] whitespace-nowrap text-cream transition-colors duration-200 hover:bg-night-raised focus-visible:outline-white"
          >
            Contact us
          </a>
        </Container>
      </section>
    </>
  );
}

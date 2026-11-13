import { ArrowUpRight, Clock3, ExternalLink, Radar } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { FormAlert, inputClass } from '@/components/ui/form';
import { PageHeader } from '@/features/app-shell/AppLayout';
import { useCan } from '@/features/auth/api';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { STATUS_OPTIONS } from './analysis';
import { useFindings, type Finding, type FindingSort, type FindingStatus } from './api';
import { FindingStatusBadge, FindingStatusSelect, RiskBadge, SourceBadge } from './finding-ui';

const STATUSES: { value: FindingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All findings' },
  ...STATUS_OPTIONS,
];

const SORTS: { value: FindingSort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'risk', label: 'Highest risk' },
];

const isStatus = (value: string | null): value is FindingStatus =>
  STATUS_OPTIONS.some((option) => option.value === value);

function FindingCard({ finding, canUpdate }: { finding: Finding; canUpdate: boolean }) {
  const detailPath = `/app/findings/${encodeURIComponent(finding.id)}`;
  return (
    <article className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-mono text-[1.125rem] font-semibold tracking-[-0.025em] break-all">
              {/* Our own detail page, never the suspect site. */}
              <Link
                to={detailPath}
                className="rounded-sm underline-offset-4 hover:text-accent-ink hover:underline"
              >
                {finding.domain}
              </Link>
            </h2>
            <FindingStatusBadge status={finding.status} />
            <SourceBadge source={finding.source} />
          </div>
          <p className="mt-2 text-[14px] text-muted">
            Looks related to <span className="font-medium text-ink">{finding.brandName}</span>
            {' · '}
            <span className="font-mono">“{finding.matchedTerm}”</span>
          </p>
        </div>
        <dl className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <dt className="text-[12px] text-muted">Name match</dt>
            <dd className="rounded-full bg-cream px-2.5 py-1 font-mono text-[13px] font-semibold ring-1 ring-line">
              {finding.score}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-[12px] text-muted">Risk</dt>
            <dd>
              <RiskBadge analysis={finding.analysis} />
            </dd>
          </div>
        </dl>
      </div>

      <ul className="mt-5 grid gap-2 border-t border-line pt-4 text-[14px] text-ink/80 sm:grid-cols-2">
        {finding.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            {reason}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden className="size-3.5" />
          First seen {formatDateTime(finding.firstSeenAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Radar aria-hidden className="size-3.5" />
          Updated {formatDateTime(finding.lastSeenAt)}
        </span>
        {finding.registration.registrar && <span>Registrar: {finding.registration.registrar}</span>}
        {finding.registration.registeredAt && (
          <span>Registered {formatDateTime(finding.registration.registeredAt)}</span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to={detailPath}
            aria-label={`View details for ${finding.domain}`}
            className="inline-flex items-center gap-1.5 rounded-sm text-[13.5px] font-semibold text-accent-ink hover:underline"
          >
            View details <ArrowUpRight aria-hidden className="size-4" />
          </Link>
          <Link
            to={`/app/brands/${encodeURIComponent(finding.brandId)}?tab=monitoring`}
            className="inline-flex items-center gap-1.5 rounded-sm text-[13.5px] font-medium text-muted hover:text-ink hover:underline"
          >
            Brand monitoring
          </Link>
          {finding.source === 'certificate_transparency' && finding.sourceReferences[0] && (
            <a
              href={`https://crt.sh/?id=${encodeURIComponent(finding.sourceReferences[0])}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm text-[13.5px] font-medium text-muted hover:text-ink hover:underline"
            >
              CT record <ExternalLink aria-hidden className="size-3.5" />
            </a>
          )}
        </div>
        {canUpdate && <FindingStatusSelect finding={finding} />}
      </div>
    </article>
  );
}

export function FindingsPage() {
  const can = useCan();
  // The filter and the order live in the address, so going back from a finding keeps them.
  const [params, setParams] = useSearchParams();
  const requestedStatus = params.get('status');
  const status: FindingStatus | 'all' = isStatus(requestedStatus) ? requestedStatus : 'all';
  const sort: FindingSort = params.get('sort') === 'risk' ? 'risk' : 'recent';
  const findings = useFindings(status, sort);
  const rows = findings.data?.pages.flatMap((page) => page.findings) ?? [];

  const choose = (key: 'status' | 'sort', value: string, fallback: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value === fallback) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <PageHeader
        title="Findings"
        description="Possible lookalike domains from the configured discovery source. Certificate Transparency coverage is incomplete and delayed, so treat every match as a lead for human review. Open a finding to see how Similo scored it."
        actions={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-[13.5px] font-medium text-muted">
              <span className="sr-only">Filter findings</span>
              <select
                value={status}
                onChange={(event) => choose('status', event.target.value, 'all')}
                className={cn(inputClass, 'mt-0 h-11 min-w-40 py-2')}
              >
                {STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13.5px] font-medium whitespace-nowrap text-muted">
              Sort by
              <select
                value={sort}
                onChange={(event) => choose('sort', event.target.value, 'recent')}
                className={cn(inputClass, 'mt-0 h-11 min-w-36 py-2')}
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
      />

      <div className="mt-8 space-y-4">
        {findings.isPending && (
          <p className="rounded-2xl bg-white p-6 text-muted">Loading findings…</p>
        )}
        {findings.isError && <FormAlert>{findings.error.message}</FormAlert>}
        {findings.data && rows.length === 0 && (
          <div className="rounded-3xl bg-white p-8 ring-1 ring-line sm:p-10">
            <div className="grid size-11 place-items-center rounded-full bg-cream">
              <Radar aria-hidden className="size-5 text-muted" />
            </div>
            <h2 className="mt-5 text-[1.25rem] font-semibold">No findings yet</h2>
            <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-muted">
              Findings appear after a domain scan finds a close match. Set up monitoring on a brand,
              then use “Scan this brand now” to start a check.
            </p>
            <Link
              to="/app/brands"
              className="mt-5 inline-flex items-center gap-2 text-[14px] font-medium text-accent-ink hover:underline"
            >
              Go to brands <ExternalLink aria-hidden className="size-4" />
            </Link>
          </div>
        )}
        {rows.map((finding) => (
          <FindingCard key={finding.id} finding={finding} canUpdate={can('findings:update')} />
        ))}
        {findings.hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              disabled={findings.isFetchingNextPage}
              onClick={() => void findings.fetchNextPage()}
            >
              {findings.isFetchingNextPage ? 'Loading…' : 'Load more findings'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

import { ArrowUpRight, Clock3, ExternalLink, Radar, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { FormAlert, inputClass } from '@/components/ui/form';
import { PageHeader } from '@/features/app-shell/AppLayout';
import { useCan } from '@/features/auth/api';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useFindings, useUpdateFindingStatus, type Finding, type FindingStatus } from './api';

const STATUSES: { value: FindingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All findings' },
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_STYLE: Record<FindingStatus, string> = {
  new: 'bg-accent/10 text-accent-ink',
  reviewing: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-red-100 text-red-900',
  dismissed: 'bg-cream text-muted',
};

function FindingCard({ finding, canUpdate }: { finding: Finding; canUpdate: boolean }) {
  const update = useUpdateFindingStatus();
  return (
    <article className="rounded-3xl bg-white p-5 ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-all font-mono text-[1.125rem] font-semibold tracking-[-0.025em]">
              {finding.domain}
            </h2>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[12px] font-medium capitalize',
                STATUS_STYLE[finding.status],
              )}
            >
              {finding.status}
            </span>
            {finding.source === 'fixture' ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-900 ring-1 ring-amber-200">
                Development fixture
              </span>
            ) : (
              <span className="rounded-full bg-cream px-2.5 py-1 text-[11.5px] font-medium text-muted ring-1 ring-line">
                Certificate Transparency
              </span>
            )}
          </div>
          <p className="mt-2 text-[14px] text-muted">
            Looks related to <span className="font-medium text-ink">{finding.brandName}</span>
            {' · '}
            <span className="font-mono">“{finding.matchedTerm}”</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-cream px-3 py-2">
          <ShieldAlert aria-hidden className="size-4 text-accent-ink" />
          <span className="font-mono text-[15px] font-semibold">{finding.score}</span>
          <span className="text-[12px] text-muted">match</span>
        </div>
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
            to={`/app/brands/${encodeURIComponent(finding.brandId)}?tab=monitoring`}
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent-ink hover:underline"
          >
            Brand monitoring <ArrowUpRight aria-hidden className="size-4" />
          </Link>
          {finding.source === 'certificate_transparency' && finding.sourceReferences[0] && (
            <a
              href={`https://crt.sh/?id=${encodeURIComponent(finding.sourceReferences[0])}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted hover:text-ink hover:underline"
            >
              CT record <ExternalLink aria-hidden className="size-3.5" />
            </a>
          )}
        </div>
        {canUpdate && (
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Update status
            <select
              aria-label={`Update status for ${finding.domain}`}
              value={finding.status}
              disabled={update.isPending}
              onChange={(event) =>
                update.mutate({
                  findingId: finding.id,
                  status: event.target.value as FindingStatus,
                })
              }
              className="h-10 rounded-xl border border-line-strong bg-white px-3 text-[13.5px] text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
            >
              {STATUSES.filter((option) => option.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {update.isError && <FormAlert className="mt-4">{update.error.message}</FormAlert>}
    </article>
  );
}

export function FindingsPage() {
  const can = useCan();
  const [status, setStatus] = useState<FindingStatus | 'all'>('all');
  const findings = useFindings(status);
  const rows = findings.data?.pages.flatMap((page) => page.findings) ?? [];

  return (
    <>
      <PageHeader
        title="Findings"
        description="Possible lookalike domains from the configured discovery source. Certificate Transparency coverage is incomplete and delayed, so treat every match as a lead for human review."
        actions={
          <label className="flex items-center gap-2 text-[13.5px] font-medium text-muted">
            <span className="sr-only">Filter findings</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as FindingStatus | 'all')}
              className={cn(inputClass, 'mt-0 h-11 min-w-40 py-2')}
            >
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
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
              {findings.isFetchingNextPage ? 'Loading…' : 'Load older findings'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

import { CircleSlash, Loader2, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { FormAlert } from '@/components/ui/form';
import { cn } from '@/lib/cn';
import { LEVEL_LABEL, LEVEL_STYLE, STATUS_OPTIONS } from './analysis';
import {
  useUpdateFindingStatus,
  type Finding,
  type FindingAnalysis,
  type FindingSource,
  type FindingStatus,
  type RiskLevel,
} from './api';

/* Small pieces shared by the findings list and the finding page. */

const STATUS_STYLE: Record<FindingStatus, string> = {
  new: 'bg-accent/10 text-accent-ink',
  reviewing: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-red-100 text-red-900',
  dismissed: 'bg-cream text-muted',
};

export function FindingStatusBadge({ status }: { status: FindingStatus }) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[12px] font-medium capitalize',
        STATUS_STYLE[status],
      )}
    >
      {status}
    </span>
  );
}

export function SourceBadge({ source }: { source: FindingSource }) {
  return source === 'fixture' ? (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-medium text-amber-900 ring-1 ring-amber-200">
      Development fixture
    </span>
  ) : (
    <span className="rounded-full bg-cream px-2.5 py-1 text-[11.5px] font-medium text-muted ring-1 ring-line">
      Certificate Transparency
    </span>
  );
}

/** Change a finding's status. The API checks the permission; callers only decide whether to show it. */
export function FindingStatusSelect({ finding }: { finding: Finding }) {
  const update = useUpdateFindingStatus();
  return (
    <div>
      <label className="flex items-center gap-2 text-[13px] text-muted">
        Update status
        <select
          aria-label={`Update status for ${finding.domain}`}
          value={finding.status}
          disabled={update.isPending}
          onChange={(event) =>
            update.mutate({ findingId: finding.id, status: event.target.value as FindingStatus })
          }
          className="h-10 rounded-xl border border-line-strong bg-white px-3 text-[13.5px] text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {update.isError && <FormAlert className="mt-3">{update.error.message}</FormAlert>}
    </div>
  );
}

/* ---------------------------------------------------------------- Risk level */

const LEVEL_ICON = { low: ShieldCheck, medium: ShieldAlert, high: TriangleAlert } as const;

/** The level on its own, larger: "High risk" with its icon. */
export function LevelBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const Icon = LEVEL_ICON[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[15px] font-semibold ring-1',
        LEVEL_STYLE[level].badge,
        className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      {LEVEL_LABEL[level]}
    </span>
  );
}

const quietBadge =
  'inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[12.5px] font-medium text-muted ring-1 ring-line';

/**
 * The risk of one finding as a badge: "72 High risk", or a plain word when there is no score
 * (not analysed, running, failed, not available).
 */
export function RiskBadge({
  analysis,
  className,
}: {
  analysis: FindingAnalysis | null | undefined;
  className?: string;
}) {
  if (analysis?.status === 'complete' && analysis.level && analysis.score !== null) {
    const Icon = LEVEL_ICON[analysis.level];
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium ring-1',
          LEVEL_STYLE[analysis.level].badge,
          className,
        )}
      >
        <Icon aria-hidden className="size-3.5" />
        <span className="font-mono font-semibold">{analysis.score}</span>
        <span>{LEVEL_LABEL[analysis.level]}</span>
      </span>
    );
  }
  if (analysis?.status === 'pending') {
    return (
      <span className={cn(quietBadge, className)}>
        <Loader2 aria-hidden className="size-3.5 animate-spin motion-reduce:animate-none" />
        Analysing
      </span>
    );
  }
  if (analysis?.status === 'failed') {
    return (
      <span className={cn(quietBadge, className)}>
        <CircleSlash aria-hidden className="size-3.5" />
        Analysis failed
      </span>
    );
  }
  return <span className={cn(quietBadge, className)}>Not analysed</span>;
}

/** A thin bar with a text equivalent: `role="meter"` plus a readable value. */
export function Meter({
  value,
  max,
  label,
  valueText,
  barClassName = 'bg-accent',
  className,
}: {
  value: number;
  max: number;
  label: string;
  valueText: string;
  barClassName?: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={cn('h-2 overflow-hidden rounded-full bg-ink/10', className)}
    >
      <div className={cn('h-full rounded-full', barClassName)} style={{ width: `${percent}%` }} />
    </div>
  );
}

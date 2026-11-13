import {
  ArrowLeft,
  Check,
  Copy,
  ImageOff,
  Info,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldOff,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/form';
import { Exhibit, MonoLabel } from '@/components/ui/specimen';
import { useBrand } from '@/features/brands/api';
import { Card } from '@/features/brands/ui/Card';
import { useCan } from '@/features/auth/api';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import {
  analyseErrorMessage,
  buildSignalRows,
  captureProblem,
  LEVEL_STYLE,
  LOGO_SOURCE_TEXT,
  totalPoints,
  type SignalRow,
} from './analysis';
import {
  brandLogoUrl,
  findingScreenshotUrl,
  useAnalyseFinding,
  useFinding,
  type Finding,
  type FindingAnalysis,
} from './api';
import {
  FindingStatusBadge,
  FindingStatusSelect,
  LevelBadge,
  Meter,
  SourceBadge,
} from './finding-ui';

/* ------------------------------------------------------------------ Header */

function CopyDomainButton({ domain }: { domain: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2500);
    return () => window.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(domain);
      setState('copied');
    } catch {
      setState('failed');
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => void copy()}>
        {state === 'copied' ? (
          <Check aria-hidden className="size-4" />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Could not copy' : 'Copy domain'}
      </Button>
      <span role="status" className="sr-only">
        {state === 'copied' ? 'Domain copied to the clipboard.' : ''}
        {state === 'failed' ? 'The domain could not be copied. Select it and copy it by hand.' : ''}
      </span>
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt>
        <MonoLabel>{label}</MonoLabel>
      </dt>
      <dd className="mt-1 text-[14px] break-words text-ink">{children}</dd>
    </div>
  );
}

function FindingHeader({ finding, canUpdate }: { finding: Finding; canUpdate: boolean }) {
  const { registration } = finding;
  return (
    <header>
      <Link
        to="/app/findings"
        className="inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        All findings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1 basis-80">
          {/* Text only, on purpose: nobody should open a suspect site by accident. */}
          <h1 className="font-mono text-[1.5rem] leading-tight font-semibold tracking-[-0.03em] break-all sm:text-[2rem]">
            {finding.domain}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FindingStatusBadge status={finding.status} />
            <SourceBadge source={finding.source} />
          </div>
          <p className="mt-3 text-[14.5px] text-muted">
            Looks related to{' '}
            <Link
              to={`/app/brands/${encodeURIComponent(finding.brandId)}`}
              className="rounded-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              {finding.brandName}
            </Link>
            {' · '}
            <span className="font-mono">“{finding.matchedTerm}”</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
            <ShieldOff aria-hidden className="size-3.5 shrink-0" />
            Shown as text only, so nobody opens the suspect site by accident.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CopyDomainButton domain={finding.domain} />
          {canUpdate && <FindingStatusSelect finding={finding} />}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-3xl bg-white p-5 ring-1 ring-line sm:grid-cols-4 sm:p-6">
        <Fact label="First seen">{formatDateTime(finding.firstSeenAt)}</Fact>
        <Fact label="Last seen">{formatDateTime(finding.lastSeenAt)}</Fact>
        <Fact label="Registered">
          {registration.registeredAt ? formatDateTime(registration.registeredAt) : 'Not known'}
        </Fact>
        <Fact label="Name match">
          <span className="font-mono font-semibold">{finding.score}</span>
          <span className="text-muted"> out of 100</span>
        </Fact>
      </dl>
    </header>
  );
}

/* -------------------------------------------------------------- Risk panel */

const HUMAN_DECIDES =
  "Similo's AI suggests a risk level. A person on your team decides what happens next.";

function AnalyseButton({
  findingId,
  label,
  first,
  onError,
}: {
  findingId: string;
  label: string;
  /** The very first analysis is the page's one main action. */
  first: boolean;
  onError: (message: string | null) => void;
}) {
  const analyse = useAnalyseFinding(findingId);
  return (
    <Button
      variant={first ? 'primary' : 'outline'}
      size="sm"
      disabled={analyse.isPending}
      onClick={() => {
        onError(null);
        analyse.mutate(undefined, { onError: (error) => onError(analyseErrorMessage(error)) });
      }}
    >
      <RefreshCw
        aria-hidden
        className={cn('size-4', analyse.isPending && 'animate-spin motion-reduce:animate-none')}
      />
      {analyse.isPending ? 'Requesting…' : label}
    </Button>
  );
}

/** A quiet message inside the risk panel: an icon, a short title, a plain explanation. */
function PanelMessage({
  icon,
  title,
  children,
  live,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <div
      {...(live ? { role: 'status' } : {})}
      className="flex items-start gap-4 rounded-2xl bg-cream px-4 py-5 ring-1 ring-line sm:px-5"
    >
      <span aria-hidden className="mt-0.5 shrink-0 text-muted">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">{title}</p>
        <div className="mt-1.5 space-y-2 text-[14.5px] text-muted">{children}</div>
      </div>
    </div>
  );
}

function CompleteSummary({ analysis }: { analysis: FindingAnalysis }) {
  const { level, score } = analysis;
  const problem = captureProblem(analysis.capture);
  if (level === null || score === null) {
    return (
      <PanelMessage icon={<Info className="size-5" />} title="No score was recorded">
        <p>The analysis finished without a score. Run it again to get one.</p>
      </PanelMessage>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <p className="font-mono text-[3.5rem] leading-none font-semibold tracking-[-0.05em] sm:text-[4.25rem]">
          {score}
          <span className="ml-1.5 text-[1.25rem] font-medium tracking-normal text-muted">
            / 100
          </span>
        </p>
        <LevelBadge level={level} className="mb-1" />
      </div>
      <Meter
        className="mt-5 h-3"
        value={score}
        max={100}
        label="Risk score"
        valueText={`${score} out of 100, ${level} risk`}
        barClassName={LEVEL_STYLE[level].bar}
      />
      {problem && (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-[14.5px] text-ink ring-1 ring-amber-200">
          <ShieldOff aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-900" />
          <span>
            <span className="font-medium">{problem.headline}</span> {problem.detail}
          </span>
        </p>
      )}
      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
        {analysis.analysedAt && <Fact label="Analysed">{formatDateTime(analysis.analysedAt)}</Fact>}
        {analysis.modelVersion && (
          <Fact label="Analysis version">
            <span className="font-mono">{analysis.modelVersion}</span>
          </Fact>
        )}
      </dl>
    </div>
  );
}

function RiskPanel({ finding, canAnalyse }: { finding: Finding; canAnalyse: boolean }) {
  const analysis = finding.analysis ?? null;
  const [requestError, setRequestError] = useState<string | null>(null);
  const status = analysis?.status ?? null;
  const analyseLabel = status === null ? 'Run analysis' : 'Analyse again';

  let body: ReactNode;
  if (status === null || analysis === null) {
    body = (
      <PanelMessage icon={<ScanSearch className="size-5" />} title="Not analysed yet">
        <p>
          So far Similo has only compared the domain name. An analysis opens the site safely,
          compares its logo and wording with your brand, and shows a risk score with every reason.
        </p>
        {!canAnalyse && <p>Ask an Owner, Admin or Analyst on your team to run it.</p>}
      </PanelMessage>
    );
  } else if (status === 'pending') {
    body = (
      <PanelMessage
        live
        icon={<Loader2 className="size-5 animate-spin motion-reduce:animate-none" />}
        title="Analysis in progress"
      >
        <p>
          Similo is looking at this domain. This page updates by itself when the result is ready.
        </p>
      </PanelMessage>
    );
  } else if (status === 'unavailable') {
    body = (
      <PanelMessage icon={<Info className="size-5" />} title="Analysis is not available right now">
        <p>
          The AI service or the background worker is not set up for this installation, so Similo
          could not analyse this domain. The name match above still stands.
        </p>
        <p>Ask whoever runs your Similo installation to check them, then try again.</p>
      </PanelMessage>
    );
  } else if (status === 'failed') {
    body = (
      <PanelMessage icon={<Info className="size-5" />} title="The analysis did not finish">
        <p>{analysis.error ?? 'Something went wrong while analysing this domain.'}</p>
        <p>You can try again. Nothing about this finding was changed.</p>
      </PanelMessage>
    );
  } else {
    body = <CompleteSummary analysis={analysis} />;
  }

  return (
    <Card
      title="Risk level"
      description={status === 'complete' ? 'How risky this domain looks to Similo.' : undefined}
      actions={
        canAnalyse && status !== 'pending' ? (
          <AnalyseButton
            findingId={finding.id}
            label={analyseLabel}
            first={status === null}
            onError={setRequestError}
          />
        ) : undefined
      }
    >
      {body}
      {requestError && <FormAlert className="mt-4">{requestError}</FormAlert>}
      <p className="mt-6 flex items-start gap-2.5 border-t border-dashed border-line-strong pt-5 text-[14px] text-ink">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
        {HUMAN_DECIDES}
      </p>
    </Card>
  );
}

/* --------------------------------------------------------- Why this score */

function SignalItem({ row }: { row: SignalRow }) {
  if (row.kind === 'unavailable') {
    return (
      <li className="py-4 first:pt-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-[15px] font-semibold">{row.label}</p>
          <span className="rounded-full bg-cream px-2.5 py-1 text-[12px] font-medium text-muted ring-1 ring-line">
            Not checked
          </span>
        </div>
        <p className="mt-2 text-[14px] text-muted">{row.reason}</p>
      </li>
    );
  }
  return (
    <li className="py-4 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[15px] font-semibold">{row.label}</p>
        <p className="font-mono text-[13.5px] text-muted">
          <span className="font-semibold text-ink">{row.points}</span> of {row.maxPoints} points
        </p>
      </div>
      <Meter
        className="mt-2.5"
        value={row.points}
        max={row.maxPoints}
        label={`${row.label}: points`}
        valueText={`${row.points} out of ${row.maxPoints} points`}
      />
      <p className="mt-2.5 text-[14px] text-muted">{row.detail}</p>
    </li>
  );
}

function WhyThisScore({ analysis }: { analysis: FindingAnalysis }) {
  const rows = buildSignalRows(analysis);
  const total = analysis.score ?? totalPoints(analysis.signals);
  return (
    <Card
      title="Why this score"
      description="Every check Similo makes is listed here. The points from all checks add up to the score."
    >
      {analysis.reasons.length > 0 && (
        <div className="mb-6 rounded-2xl bg-cream px-4 py-4 ring-1 ring-line sm:px-5">
          <p>
            <MonoLabel>The main reasons</MonoLabel>
          </p>
          <ul className="mt-3 space-y-2 text-[14.5px] text-ink">
            {analysis.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {rows.length > 0 ? (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <SignalItem key={row.id} row={row} />
          ))}
        </ul>
      ) : (
        <p className="text-[14.5px] text-muted">No checks were recorded for this analysis.</p>
      )}
      <p className="mt-2 flex items-baseline justify-between gap-4 border-t border-line-strong pt-4">
        <span className="text-[15px] font-semibold">Total</span>
        <span className="font-mono text-[14px] text-muted">
          <span className="text-[1.125rem] font-semibold text-ink">{total}</span> out of 100
        </span>
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------ Evidence */

/** An image that falls back to a plain sentence when it cannot be loaded. */
function EvidenceImage({
  src,
  alt,
  fit,
  failedText,
}: {
  src: string;
  alt: string;
  fit: 'logo' | 'page';
  failedText: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src)
    return <FrameNote icon={<ImageOff className="size-5" />}>{failedText}</FrameNote>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={
        fit === 'logo' ? 'size-full object-contain p-8' : 'size-full object-cover object-top'
      }
    />
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-sm bg-cream ring-1 ring-line-strong">
      {children}
    </div>
  );
}

function FrameNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex max-w-sm flex-col items-center gap-3 px-6 py-6 text-center text-[14px] text-muted">
      <span aria-hidden>{icon}</span>
      <p>{children}</p>
    </div>
  );
}

/** Exhibit A's picture when the API did not say which logo matched: the brand's first logo. */
function FirstLogoImage({ finding }: { finding: Finding }) {
  const brand = useBrand(finding.brandId);
  if (brand.isPending)
    return (
      <FrameNote icon={<Loader2 className="size-5 animate-spin motion-reduce:animate-none" />}>
        Loading the logo…
      </FrameNote>
    );
  const logo = brand.data?.logos[0];
  if (!logo) {
    return (
      <FrameNote icon={<ImageOff className="size-5" />}>
        No logo has been uploaded for {finding.brandName}, so there is nothing to compare yet.{' '}
        <Link
          to={`/app/brands/${encodeURIComponent(finding.brandId)}?tab=logos`}
          className="font-medium text-accent-ink underline underline-offset-4"
        >
          Add a logo
        </Link>
      </FrameNote>
    );
  }
  return (
    <EvidenceImage
      src={brandLogoUrl(finding.brandId, logo.id)}
      alt={`${finding.brandName} logo, the original`}
      fit="logo"
      failedText="The logo could not be loaded."
    />
  );
}

function LogoPicture({ finding, analysis }: { finding: Finding; analysis: FindingAnalysis }) {
  if (analysis.logoMatch) {
    return (
      <EvidenceImage
        src={brandLogoUrl(finding.brandId, analysis.logoMatch.logoId)}
        alt={`${finding.brandName} logo, the original that matched`}
        fit="logo"
        failedText="The logo could not be loaded. It may have been removed from the brand."
      />
    );
  }
  return <FirstLogoImage finding={finding} />;
}

function PagePicture({ finding, analysis }: { finding: Finding; analysis: FindingAnalysis }) {
  const capture = analysis.capture;
  if (capture?.hasScreenshot) {
    return (
      <EvidenceImage
        src={findingScreenshotUrl(finding.id)}
        alt={`Screenshot of the suspect page for ${finding.domain}, taken by Similo`}
        fit="page"
        failedText="The screenshot could not be loaded."
      />
    );
  }
  const problem = captureProblem(capture);
  if (problem) {
    return (
      <FrameNote icon={<ShieldOff className="size-5" />}>
        <span className="font-medium text-ink">{problem.headline}</span>
        <br />
        {problem.detail}
      </FrameNote>
    );
  }
  return (
    <FrameNote icon={<ImageOff className="size-5" />}>
      {capture
        ? 'No screenshot was saved for this page.'
        : 'No page was captured for this analysis.'}
    </FrameNote>
  );
}

function EvidenceComparison({
  finding,
  analysis,
}: {
  finding: Finding;
  analysis: FindingAnalysis;
}) {
  const { capture, logoMatch } = analysis;
  return (
    <Card
      title="Evidence comparison"
      description="Your logo next to what Similo saw on the suspect page. The screenshot is a picture only: nothing on the suspect page is run or linked from here."
    >
      <div className="grid gap-10 md:grid-cols-2 md:gap-8">
        <div>
          <Exhibit label="Exhibit A">
            <Frame>
              <LogoPicture finding={finding} analysis={analysis} />
            </Frame>
          </Exhibit>
          <dl className="mt-5 space-y-3">
            <Fact label="Original">
              {finding.brandName}
              {logoMatch ? ', the logo that matched' : ', first logo on file'}
            </Fact>
            {logoMatch && (
              <Fact label="Logo match">
                {Math.round(logoMatch.similarity * 100)}% similar to{' '}
                {LOGO_SOURCE_TEXT[logoMatch.source]}
              </Fact>
            )}
          </dl>
        </div>

        <div>
          <Exhibit label="Exhibit B">
            <Frame>
              <PagePicture finding={finding} analysis={analysis} />
            </Frame>
          </Exhibit>
          <dl className="mt-5 space-y-3">
            <Fact label="The suspect page">
              {capture?.finalUrl ? (
                <span className="font-mono text-[13px] break-all">{capture.finalUrl}</span>
              ) : (
                <span className="text-muted">No address was recorded</span>
              )}
            </Fact>
            {capture?.title && <Fact label="Page title">{capture.title}</Fact>}
            {capture?.capturedAt && (
              <Fact label="Captured">{formatDateTime(capture.capturedAt)}</Fact>
            )}
          </dl>
          {capture?.hasScreenshot && (
            <a
              href={findingScreenshotUrl(finding.id)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-sm text-[13.5px] font-medium text-accent-ink underline underline-offset-4"
            >
              Open the screenshot full size
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------- Name check */

/** Before an analysis there is only the name check from the scan. */
function NameCheck({ finding }: { finding: Finding }) {
  return (
    <Card
      title="What the name check found"
      description="The scan compared this domain's name with your brand and found:"
    >
      <ul className="space-y-2 text-[14.5px]">
        {finding.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            {reason}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------------------------------------------------------------------- Page */

function FindingView({ finding }: { finding: Finding }) {
  const can = useCan();
  const analysis = finding.analysis ?? null;
  const complete = analysis?.status === 'complete';
  const showEvidence = analysis !== null && (complete || analysis.capture !== null);

  return (
    <div className="space-y-6">
      <FindingHeader finding={finding} canUpdate={can('findings:update')} />
      {/* Starting an analysis is allowed for the same roles as updating a finding. */}
      <RiskPanel finding={finding} canAnalyse={can('findings:update')} />
      {analysis && complete && <WhyThisScore analysis={analysis} />}
      {analysis && showEvidence && <EvidenceComparison finding={finding} analysis={analysis} />}
      {!complete && finding.reasons.length > 0 && <NameCheck finding={finding} />}
    </div>
  );
}

function FindingNotFound() {
  return (
    <div className="mx-auto mt-8 flex max-w-xl flex-col items-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-line">
      <h1 className="text-title font-semibold">Finding not found</h1>
      <p className="mt-3 text-muted">
        We couldn&apos;t find that finding. It may belong to another organisation, or the link may
        be wrong.
      </p>
      <ButtonLink to="/app/findings" variant="dark" className="mt-6">
        <ArrowLeft aria-hidden className="size-4" />
        Back to all findings
      </ButtonLink>
    </div>
  );
}

export function FindingDetailPage() {
  const { findingId = '' } = useParams();
  const finding = useFinding(findingId);

  if (finding.isPending) {
    return <p className="rounded-2xl bg-white p-6 text-muted">Loading finding…</p>;
  }
  if (finding.isError) {
    const missing =
      finding.error instanceof ApiError &&
      (finding.error.status === 404 || finding.error.code === 'VALIDATION_ERROR');
    return missing ? (
      <FindingNotFound />
    ) : (
      <div className="space-y-4">
        <Link
          to="/app/findings"
          className="inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-muted hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          All findings
        </Link>
        <FormAlert>{finding.error.message}</FormAlert>
      </div>
    );
  }
  return <FindingView finding={finding.data} />;
}

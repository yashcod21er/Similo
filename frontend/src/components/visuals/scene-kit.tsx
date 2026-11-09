import { AlertTriangle, Check } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { MonoLabel } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';

/*
 * Small pieces shared by every product scene (the animated, high-fidelity app mock-ups).
 *
 * Two ways a scene moves:
 *  - Hero scenes loop with `useSceneStep`: a step counter that pauses off-screen, in a hidden
 *    tab and with reduced motion (then it shows the finished scene).
 *  - Story panels (inside a ScrollStory) play once with `usePanelShown`: they fill in when
 *    their step becomes the one being read.
 * Everything moves with opacity and transform only.
 */

/* ----------------------------------------------------------------- Frame */

/**
 * Wraps a scene: announces it as one image to screen readers (the looping text would be noise),
 * makes it a size container (so layouts follow the window's width, not the screen's) and
 * adds the one discreet mono caption ("FIG. 03: Sample data, made-up names"). `tone` is the
 * band the scene sits on (the caption colour); the scene's own window stays dark.
 */
export function SceneFigure({
  label,
  caption = 'Sample data, made-up names.',
  tone = 'dark',
  index,
  className,
  children,
}: {
  label: string;
  caption?: string;
  tone?: 'light' | 'dark';
  /** The figure number, for example "03"; shown as "FIG. 03". */
  index?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn('w-full min-w-0', className)}>
      <div role="img" aria-label={label} className="@container">
        {children}
      </div>
      {caption && (
        <figcaption className="mt-5">
          <MonoLabel tone={tone}>
            {index ? `FIG. ${index} — ` : ''}
            {caption}
          </MonoLabel>
        </figcaption>
      )}
    </figure>
  );
}

/* ---------------------------------------------------------------- Motion */

/** Fades and lifts its children in when `when` becomes true. The space is always reserved. */
export function Show({
  when,
  children,
  className,
  delay = 0,
  y = 8,
  style,
  as: Tag = 'div',
}: {
  when: boolean;
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  style?: CSSProperties;
  /** Use `li` inside a list so the markup stays valid. */
  as?: 'div' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
        className,
      )}
      style={{
        opacity: when ? 1 : 0,
        transform: when ? 'none' : `translateY(${y}px)`,
        transitionDelay: when ? `${delay}ms` : '0ms',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------------- Chips */

export type Level = 'high' | 'medium' | 'low' | 'review' | 'ok' | 'neutral';

const CHIP_DARK: Record<Level, string> = {
  high: 'bg-accent text-white',
  medium: 'bg-accent-soft/15 text-accent-soft ring-1 ring-accent-soft/35',
  low: 'bg-white/[0.07] text-cream/70 ring-1 ring-white/10',
  review: 'bg-cream text-ink',
  ok: 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30',
  neutral: 'bg-white/[0.07] text-cream/70 ring-1 ring-white/10',
};

const CHIP_LIGHT: Record<Level, string> = {
  high: 'bg-accent text-white',
  medium: 'bg-accent/10 text-accent-ink ring-1 ring-accent/25',
  low: 'bg-cream-deep text-ink',
  review: 'bg-ink text-cream',
  ok: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  neutral: 'bg-cream-deep text-ink',
};

export function Chip({
  level = 'neutral',
  tone = 'dark',
  children,
  className,
}: {
  level?: Level;
  tone?: 'light' | 'dark';
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] leading-5 font-semibold whitespace-nowrap',
        tone === 'dark' ? CHIP_DARK[level] : CHIP_LIGHT[level],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- Signals */

function barColour(value: number) {
  if (value >= 75) return 'bg-accent';
  if (value >= 50) return 'bg-accent-soft';
  return 'bg-cream/45';
}

/**
 * A named score from 0 to 100: label, number and a bar that fills (transform only).
 * Never shown as one unlabelled number.
 */
export function SignalBar({
  label,
  value,
  shown,
  delay = 0,
  note,
  tone = 'dark',
  className,
}: {
  label: string;
  value: number;
  shown: boolean;
  delay?: number;
  note?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className={dark ? 'text-cream/85' : 'text-ink'}>{label}</span>
        <span
          className={cn(
            'font-mono font-medium tabular-nums transition-opacity duration-500 motion-reduce:transition-none',
            dark ? 'text-cream' : 'text-ink',
          )}
          style={{ opacity: shown ? 1 : 0, transitionDelay: shown ? `${delay + 250}ms` : '0ms' }}
        >
          {value}
        </span>
      </div>
      <div
        className={cn(
          'mt-1.5 h-1.5 overflow-hidden rounded-full',
          dark ? 'bg-white/10' : 'bg-cream-deep',
        )}
      >
        <div
          className={cn(
            'h-full w-full rounded-full transition-transform duration-[900ms] ease-out motion-reduce:transition-none',
            barColour(value),
          )}
          style={{
            transform: `translateX(${shown ? value - 100 : -100}%)`,
            transitionDelay: shown ? `${delay}ms` : '0ms',
          }}
        />
      </div>
      {note && (
        <p className={cn('mt-1 text-[11.5px] leading-snug', dark ? 'text-cream/60' : 'text-muted')}>
          {note}
        </p>
      )}
    </div>
  );
}

/** A small label above a group of rows. */
export function PaneLabel({
  children,
  aside,
  className,
}: {
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <p className="text-[11px] font-semibold tracking-[0.04em] text-cream/60 uppercase">
        {children}
      </p>
      {aside}
    </div>
  );
}

/** A key-and-value row (registration facts, listing facts). */
export function Fact({
  label,
  value,
  shown = true,
  delay = 0,
  flag = false,
}: {
  label: string;
  value: ReactNode;
  shown?: boolean;
  delay?: number;
  flag?: boolean;
}) {
  return (
    <Show
      when={shown}
      delay={delay}
      y={5}
      className="flex items-baseline justify-between gap-4 py-1.5 text-[12px]"
    >
      <dt className="shrink-0 text-cream/60">{label}</dt>
      <dd
        className={cn(
          'min-w-0 truncate text-right font-medium',
          flag ? 'text-accent-soft' : 'text-cream/90',
        )}
      >
        {value}
      </dd>
    </Show>
  );
}

/* ------------------------------------------------------------ Page frame */

/**
 * A tiny web page drawn in shapes: browser bar, logo, a sign-in form. `copy` gives the
 * look-alike version. Used for "page capture" frames.
 */
export function MiniPage({
  url,
  copy = false,
  className,
}: {
  url: string;
  copy?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg bg-cream text-ink ring-1',
        copy ? 'ring-accent/60' : 'ring-white/15',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-ink/10 bg-cream-deep px-2.5 py-1.5">
        <span aria-hidden className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-1.5 rounded-full bg-ink/20" />
          ))}
        </span>
        <span className="min-w-0 flex-1 truncate rounded bg-white px-2 py-0.5 font-mono text-[10px] text-muted">
          {url}
        </span>
      </div>
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5">
          <span aria-hidden className="size-4 rounded-[5px] bg-night" />
          <span className="text-[11px] font-semibold tracking-[-0.01em]">Acme</span>
        </div>
        <p className="mt-2.5 text-[10.5px] font-semibold">Sign in to your account</p>
        <div aria-hidden className="mt-2 space-y-1.5">
          <div className="h-5 rounded border border-ink/15 bg-white" />
          <div className="h-5 rounded border border-ink/15 bg-white" />
          <div
            className={cn(
              'flex h-5 items-center justify-center rounded text-[9.5px] font-medium text-white',
              copy ? 'bg-accent' : 'bg-night',
            )}
          >
            Sign in
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Decision */

/**
 * "Needs review", then approved by a person. `stage` 0 hides it, 1 = needs review,
 * 2 = approved. Similo never acts on its own, and the note says so.
 */
export function DecisionBar({
  stage,
  approvedLabel = 'Approved for takedown request',
  approvedNote = 'Approved by the legal reviewer. A draft request is ready; nothing is sent until a person sends it.',
}: {
  stage: 0 | 1 | 2;
  approvedLabel?: string;
  approvedNote?: string;
}) {
  return (
    <Show when={stage >= 1}>
      <div className="rounded-lg bg-white/[0.045] p-3 ring-1 ring-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2">
          <Chip level={stage === 1 ? 'review' : 'neutral'}>
            {stage === 1 ? (
              <AlertTriangle aria-hidden className="size-3" />
            ) : (
              <Check aria-hidden className="size-3" />
            )}
            Needs review
          </Chip>
          <span aria-hidden className="text-cream/40">
            →
          </span>
          <Chip level={stage === 2 ? 'ok' : 'neutral'} className={cn(stage < 2 && 'opacity-60')}>
            {stage === 2 && <Check aria-hidden className="size-3" />}
            {approvedLabel}
          </Chip>
        </div>
        <p className="mt-2 text-[11.5px] leading-snug text-cream/65">
          {stage === 2 ? approvedNote : 'Waiting for a person. Similo never acts on its own.'}
        </p>
      </div>
    </Show>
  );
}

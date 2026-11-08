import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
  );
}

type Tone = 'light' | 'dark';

/**
 * Small label above a heading. With an `index` it reads like a chapter
 * marker: "01 — The problem". Without one it is a quiet mono label.
 */
export function Eyebrow({
  children,
  index,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  index?: string | undefined;
  tone?: Tone;
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <p
      className={cn(
        'inline-flex items-center gap-3 font-mono text-[12px] font-medium tracking-[0.08em] uppercase',
        dark ? 'text-white/60' : 'text-muted',
        className,
      )}
    >
      {index ? (
        <>
          <span className={dark ? 'text-coral' : 'text-crimson-dark'}>{index}</span>
          <span aria-hidden className={cn('h-px w-6', dark ? 'bg-white/25' : 'bg-line-strong')} />
        </>
      ) : (
        <span
          aria-hidden
          className={cn('size-1.5 rounded-full', dark ? 'bg-coral' : 'bg-crimson')}
        />
      )}
      {children}
    </p>
  );
}

/** Rounded label chip, e.g. above a hero headline. */
export function Pill({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-medium',
        tone === 'dark'
          ? 'bg-white/[0.06] text-white/80 ring-1 ring-white/15'
          : 'bg-white text-ink/80 shadow-soft ring-1 ring-line',
        className,
      )}
    >
      {children}
    </span>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  /** Chapter number shown before the eyebrow, e.g. "01". */
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  align?: 'left' | 'center' | 'split';
  /** Put on the <h2>, so a section can use aria-labelledby. */
  id?: string;
  className?: string;
}

/**
 * Standard section intro. `split` puts the title left and description right
 * on large screens. Use one <em> in the title for the serif accent word.
 */
export function SectionHeading({
  eyebrow,
  index,
  title,
  description,
  tone = 'light',
  align = 'left',
  id,
  className,
}: SectionHeadingProps) {
  const titleClass = cn(
    'text-headline font-semibold text-balance',
    tone === 'dark' ? 'text-white' : 'text-ink',
  );
  const descriptionClass = cn(
    'text-lead text-pretty',
    tone === 'dark' ? 'text-white/65' : 'text-muted',
  );
  const eyebrowEl = eyebrow && (
    <Eyebrow tone={tone} index={index}>
      {eyebrow}
    </Eyebrow>
  );

  if (align === 'split') {
    return (
      <Reveal
        className={cn(
          'grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-20',
          className,
        )}
      >
        <div>
          {eyebrowEl}
          <h2 id={id} className={cn(titleClass, eyebrow && 'mt-5')}>
            {title}
          </h2>
        </div>
        {description && <p className={cn(descriptionClass, 'lg:pb-1.5')}>{description}</p>}
      </Reveal>
    );
  }

  return (
    <Reveal
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto flex flex-col items-center text-center',
        className,
      )}
    >
      {eyebrowEl}
      <h2 id={id} className={cn(titleClass, eyebrow && 'mt-5')}>
        {title}
      </h2>
      {description && <p className={cn(descriptionClass, 'mt-5')}>{description}</p>}
    </Reveal>
  );
}

/**
 * Framed dark "stage" that holds product visuals on light pages: a thin outer
 * bezel, then the navy surface. Keeps every product preview consistent.
 */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[28px] bg-white/60 p-1.5 shadow-stage ring-1 ring-line sm:rounded-[36px] sm:p-2',
        className,
      )}
    >
      <div className="relative isolate h-full overflow-hidden rounded-[22px] bg-midnight text-white sm:rounded-[28px]">
        {children}
      </div>
    </div>
  );
}

/** Marks product visuals that use sample data, so nothing passes as live monitoring. */
export function ExampleTag({ className, tone = 'dark' }: { className?: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider whitespace-nowrap uppercase',
        tone === 'dark' ? 'bg-white/10 text-white/60' : 'bg-card text-muted',
        className,
      )}
    >
      Illustrative example
    </span>
  );
}

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
 * Small label above a heading: 13 px, medium weight, crimson. `index` is
 * accepted so older markup keeps compiling, but v3 no longer shows chapter
 * numbers.
 */
export function Eyebrow({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  index?: string | undefined;
  tone?: Tone;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[13px] font-medium',
        tone === 'dark' ? 'text-coral' : 'text-crimson-dark',
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Small rounded label chip. */
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
          : 'bg-paper text-ink/80 ring-1 ring-line',
        className,
      )}
    >
      {children}
    </span>
  );
}

interface SectionHeadingProps {
  eyebrow?: string;
  /** Not shown any more (v3 has no chapter numbers); kept so older markup compiles. */
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
 * Standard section intro. Left-aligned by default; use `center` only for a
 * short intro. `split` puts the title left and description right on large
 * screens.
 */
export function SectionHeading({
  eyebrow,
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
    tone === 'dark' ? 'text-white/70' : 'text-muted',
  );
  const eyebrowEl = eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>;

  if (align === 'split') {
    return (
      <Reveal
        className={cn(
          'grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16',
          className,
        )}
      >
        <div>
          {eyebrowEl}
          <h2 id={id} className={cn(titleClass, eyebrow && 'mt-3')}>
            {title}
          </h2>
        </div>
        {description && <p className={cn(descriptionClass, 'lg:pb-1')}>{description}</p>}
      </Reveal>
    );
  }

  return (
    <Reveal
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto flex flex-col items-center text-center',
        className,
      )}
    >
      {eyebrowEl}
      <h2 id={id} className={cn(titleClass, eyebrow && 'mt-3')}>
        {title}
      </h2>
      {description && <p className={cn(descriptionClass, 'mt-4')}>{description}</p>}
    </Reveal>
  );
}

/**
 * Dark panel that holds a product visual on a light page. Flat: a navy
 * surface with a hairline ring, no bezel and no shadow.
 */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-midnight text-white ring-1 ring-ink/10',
        className,
      )}
    >
      <div className="relative isolate h-full">{children}</div>
    </div>
  );
}

/** Marks product visuals that use sample data, so nothing passes as live monitoring. */
export function ExampleTag({ className, tone = 'dark' }: { className?: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap',
        tone === 'dark' ? 'bg-white/10 text-white/70' : 'bg-card text-muted',
        className,
      )}
    >
      Illustrative example
    </span>
  );
}

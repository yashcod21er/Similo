import type { ReactNode } from 'react';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
  );
}

/** `orange` is for the full-bleed burnt-orange band: white text, never cream below 24 px. */
type Tone = 'light' | 'dark' | 'orange';

/**
 * Small label above a heading (v6): a short rule, then mono microtype (11 px, uppercase,
 * open tracking). Orange-ink on light, accent-soft on night, white on the orange band.
 * `index` is accepted so older markup keeps compiling, but chapter numbers are not shown.
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
        'text-micro flex items-center gap-2.5',
        "before:h-px before:w-6 before:shrink-0 before:content-['']",
        tone === 'orange'
          ? 'text-white before:bg-white/70'
          : tone === 'dark'
            ? 'text-accent-soft before:bg-accent-soft/70'
            : 'text-accent-ink before:bg-accent/60',
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
        'text-micro inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        tone === 'orange'
          ? 'text-white ring-1 ring-white/50'
          : tone === 'dark'
            ? 'bg-cream/[0.06] text-cream/80 ring-1 ring-cream/15'
            : 'bg-white text-ink/80 ring-1 ring-line-strong',
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
 * screens. The title's words slide up out of a mask as it enters the view
 * (`SplitReveal`; plain text with reduced motion); the label and intro fade in after it.
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
    tone === 'light' ? 'text-ink' : tone === 'orange' ? 'text-white' : 'text-cream',
    eyebrow && 'mt-4',
  );
  const descriptionClass = cn(
    'text-lead text-pretty',
    tone === 'dark' ? 'text-cream/70' : tone === 'orange' ? 'text-white' : 'text-muted',
  );
  const eyebrowEl = eyebrow && (
    <Reveal y={12}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
    </Reveal>
  );
  const titleEl = (
    <SplitReveal as="h2" id={id} className={titleClass}>
      {title}
    </SplitReveal>
  );

  if (align === 'split') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16',
          className,
        )}
      >
        <div>
          {eyebrowEl}
          {titleEl}
        </div>
        {description && (
          <Reveal delay={0.2} className="lg:pb-1">
            <p className={descriptionClass}>{description}</p>
          </Reveal>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto flex flex-col items-center text-center',
        className,
      )}
    >
      {eyebrowEl}
      {titleEl}
      {description && (
        <Reveal delay={0.2} className="mt-4">
          <p className={descriptionClass}>{description}</p>
        </Reveal>
      )}
    </div>
  );
}

/**
 * Dark panel that holds a product visual on a light page: a night surface with a hairline
 * ring and the layered window shadow.
 */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-night text-cream shadow-window ring-1 ring-ink/10',
        className,
      )}
    >
      <div className="relative isolate h-full">{children}</div>
    </div>
  );
}

/**
 * Marks product visuals that use sample data, so nothing passes as live monitoring. Mono
 * microtype; for a figure caption use `FigCaption` from `ui/specimen` instead.
 */
export function ExampleTag({ className, tone = 'dark' }: { className?: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        'text-micro inline-flex shrink-0 items-center rounded-sm px-2 py-1 whitespace-nowrap',
        tone === 'orange'
          ? 'text-white ring-1 ring-white/50'
          : tone === 'dark'
            ? 'bg-cream/10 text-cream/75'
            : 'bg-cream-deep text-muted',
        className,
      )}
    >
      Illustrative example
    </span>
  );
}

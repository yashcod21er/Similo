import type { ReactNode } from 'react';
import { MonoLabel, RegMarks, type SpecimenTone } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';

/*
 * Pieces shared by the home page's bands (v6). Each band is one "plate" of the evidence room:
 * a tone (cream, white, night or the one orange flood), hairline column lines at the container
 * edges, `+` registration marks at its top corners, and a mono plate line ("FIG. 03 — …").
 */

export type BandTone = 'cream' | 'white' | 'night' | 'orange';

const TONE: Record<BandTone, string> = {
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink',
  night: 'bg-night text-cream',
  orange: 'bg-accent text-cream',
};

const RULE: Record<BandTone, string> = {
  cream: 'bg-ink/[0.08]',
  white: 'bg-ink/[0.08]',
  night: 'bg-cream/[0.09]',
  orange: 'bg-white/20',
};

/** The specimen tone (labels and marks) that suits a band. */
function specimenTone(tone: BandTone): SpecimenTone {
  if (tone === 'night') return 'dark';
  if (tone === 'orange') return 'orange';
  return 'light';
}

/** The page gutter, as in `Container`. */
export const GUTTER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/**
 * A full-bleed band with hairline scaffolding. Children are placed in the page container
 * unless `bleed` is set (then they span the full width and bring their own gutter).
 */
export function Band({
  tone,
  id,
  labelledBy,
  className,
  bleed = false,
  children,
}: {
  tone: BandTone;
  id?: string;
  labelledBy?: string;
  className?: string;
  bleed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('relative isolate scroll-mt-16', TONE[tone], className)}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className={cn(GUTTER, 'relative h-full')}>
          <span className={cn('absolute inset-y-0 left-4 w-px sm:left-6 lg:left-8', RULE[tone])} />
          <span
            className={cn('absolute inset-y-0 right-4 w-px sm:right-6 lg:right-8', RULE[tone])}
          />
        </div>
      </div>
      {bleed ? children : <div className={GUTTER}>{children}</div>}
    </section>
  );
}

/**
 * The plate line at the top of a band: a hairline with `+` marks at both ends, the figure
 * label on the left and an optional note on the right.
 */
export function PlateLine({
  tone,
  index,
  title,
  note,
  className,
}: {
  tone: BandTone;
  index: string;
  title: string;
  note?: ReactNode;
  className?: string;
}) {
  const specimen = specimenTone(tone);
  return (
    <div
      className={cn(
        'relative flex items-start justify-between gap-6 border-t pt-3',
        tone === 'night'
          ? 'border-cream/[0.12]'
          : tone === 'orange'
            ? 'border-white/30'
            : 'border-ink/10',
        className,
      )}
    >
      <RegMarks tone={specimen} className="-top-px h-0 [&>span:nth-child(n+3)]:hidden" />
      <MonoLabel tone={specimen}>
        Fig. {index} <span aria-hidden>&mdash;</span> {title}
      </MonoLabel>
      {note && (
        <MonoLabel tone={specimen} className="hidden text-right sm:block">
          {note}
        </MonoLabel>
      )}
    </div>
  );
}

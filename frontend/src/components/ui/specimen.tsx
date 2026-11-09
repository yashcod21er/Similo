import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * "Spot the difference" specimen language (design system v6): the small pieces that make
 * the site read like an evidence room, not an app. Mono microtype labels, corner brackets
 * around a featured visual, registration crosshairs on section corners, and figure captions.
 * All of it is decorative or a plain caption: no pointer events, nothing animates.
 *
 * Contrast: `light` labels are `muted` (6.3:1 on cream), `dark` labels are `cream/65` on night,
 * `orange` labels are white (4.7:1 on the burnt-orange band, which is why cream is only used
 * for text of 24 px and up on that band).
 */

export type SpecimenTone = 'light' | 'dark' | 'orange';

const labelTone: Record<SpecimenTone, string> = {
  light: 'text-muted',
  dark: 'text-cream/65',
  orange: 'text-white',
};

const markTone: Record<SpecimenTone, string> = {
  light: 'text-ink/45',
  dark: 'text-cream/45',
  orange: 'text-white/70',
};

/*
 * `cn` only joins class names (no conflict resolution), so a caller's `className` replaces a
 * default instead of fighting it: an inset class (`-inset-2`) replaces the default `inset-0`,
 * and a text colour class replaces the tone's colour.
 */
const HAS_INSET = /(^|\s)-?inset-/;
const HAS_COLOUR = /(^|\s)text-(ink|cream|white|black|muted|accent|night|current|inherit|\[#)/;

function markClasses(tone: SpecimenTone, className: string | undefined) {
  return cn(
    'pointer-events-none absolute',
    !(className && HAS_INSET.test(className)) && 'inset-0',
    !(className && HAS_COLOUR.test(className)) && markTone[tone],
    className,
  );
}

/** Mono, uppercase microtype (11 px, open tracking): labels, numbers and captions. */
export function MonoLabel({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: SpecimenTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-micro',
        !(className && HAS_COLOUR.test(className)) && labelTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const bracket = 'absolute size-3 border-current';

/**
 * Four small L-shaped marks, one in each corner of the nearest positioned parent
 * (`relative`). Pass a negative inset (`-inset-2`) in `className` to hang them just outside
 * the visual they frame.
 */
export function CornerBrackets({
  tone = 'light',
  className,
}: {
  tone?: SpecimenTone;
  className?: string;
}) {
  return (
    <span aria-hidden className={markClasses(tone, className)}>
      <span className={cn(bracket, 'top-0 left-0 border-t border-l')} />
      <span className={cn(bracket, 'top-0 right-0 border-t border-r')} />
      <span className={cn(bracket, 'bottom-0 left-0 border-b border-l')} />
      <span className={cn(bracket, 'right-0 bottom-0 border-r border-b')} />
    </span>
  );
}

const cross =
  "absolute size-3.5 before:absolute before:top-0 before:left-1/2 before:h-full before:w-px before:bg-current before:content-[''] after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:bg-current after:content-['']";

/**
 * `+` registration (crosshair) marks centred on the four corners of the nearest positioned
 * parent. The marks reach 7 px outside the corner, so the parent must not clip overflow.
 */
export function RegMarks({
  tone = 'light',
  className,
}: {
  tone?: SpecimenTone;
  className?: string;
}) {
  return (
    <span aria-hidden className={markClasses(tone, className)}>
      <span className={cn(cross, 'top-0 left-0 -translate-x-1/2 -translate-y-1/2')} />
      <span className={cn(cross, 'top-0 right-0 translate-x-1/2 -translate-y-1/2')} />
      <span className={cn(cross, 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2')} />
      <span className={cn(cross, 'right-0 bottom-0 translate-x-1/2 translate-y-1/2')} />
    </span>
  );
}

/**
 * A framed specimen: a mono label top-left ("EXHIBIT A", with a small orange tick), the
 * visual inside four corner brackets, and an optional mono caption underneath.
 */
export function Exhibit({
  label,
  caption,
  tone = 'light',
  className,
  children,
}: {
  label: string;
  caption?: string;
  tone?: 'light' | 'dark';
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className={cn('relative', className)}>
      <p className="mb-4 flex items-center gap-2">
        <span
          aria-hidden
          className={cn('size-1.5 shrink-0', tone === 'dark' ? 'bg-accent-soft' : 'bg-accent')}
        />
        <MonoLabel tone={tone}>{label}</MonoLabel>
      </p>
      <div className="relative">
        {children}
        <CornerBrackets tone={tone} className="-inset-2" />
      </div>
      {caption && (
        <figcaption className="mt-5">
          <MonoLabel tone={tone}>{caption}</MonoLabel>
        </figcaption>
      )}
    </figure>
  );
}

/**
 * "FIG. 01 — caption" in mono microtype. Use it for the one discreet "sample data" note a
 * scene needs (`<FigCaption index="02">Sample data, not live</FigCaption>`).
 */
export function FigCaption({
  index,
  children,
  tone = 'light',
  as: Tag = 'p',
  className,
}: {
  /** The figure number, for example "01". */
  index: string;
  children: ReactNode;
  tone?: SpecimenTone;
  /** Use `figcaption` only when it is the direct child of a `figure`. */
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag className={cn(className)}>
      <MonoLabel tone={tone}>
        FIG. {index} <span aria-hidden>&mdash;</span> {children}
      </MonoLabel>
    </Tag>
  );
}

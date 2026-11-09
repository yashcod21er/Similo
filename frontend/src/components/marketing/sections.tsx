import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow } from '@/components/ui/layout';
import { LogoSymbol } from '@/components/ui/Logo';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { RegMarks } from '@/components/ui/specimen';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ Hero */

interface HeroProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  primaryCta?: { label: string; to: string };
  secondaryCta?: { label: string; to: string };
  /** Short plain facts shown under the buttons (not metrics). */
  highlights?: { value: string; label: string }[];
  /** A product scene (ideally in an `AppWindow`). Stock photos do not go in heroes (v4). */
  visual: ReactNode;
  /**
   * v4 heroes are dark (night) with the SimilarityWave signature behind them. `light` keeps
   * a cream hero for pages that need a quieter start.
   */
  tone?: 'dark' | 'light';
}

/**
 * Hero for inner pages: copy left, one product visual right. Dark by default (every long page
 * opens on night with the signature wave). Nothing animates on load except the wave, so the
 * headline is readable immediately. An `<em>` in the title is the page's one serif italic
 * phrase (Instrument Serif, burnt orange); use it once per page and nowhere else.
 */
export function SplitHero({
  eyebrow,
  title,
  description,
  primaryCta = { label: 'Request a demo', to: '/contact' },
  secondaryCta,
  highlights,
  visual,
  tone = 'dark',
}: HeroProps) {
  const dark = tone === 'dark';
  return (
    <section
      className={cn('relative isolate overflow-hidden', dark ? 'bg-night text-cream' : 'bg-cream')}
    >
      {dark && (
        <>
          <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-70" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/80 to-night/20"
          />
        </>
      )}
      {/* grid-cols-1 (minmax(0, 1fr)) stops a wide visual from stretching the column on phones. */}
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div>
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
          <h1
            className={cn(
              'text-display serif-em-accent mt-6 font-semibold text-balance',
              dark ? 'text-cream' : 'text-ink',
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              'text-lead mt-6 max-w-xl text-pretty',
              dark ? 'text-cream/75' : 'text-muted',
            )}
          >
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={primaryCta.to} size="lg">
              {primaryCta.label}
            </ButtonLink>
            {secondaryCta && (
              <ButtonLink
                to={secondaryCta.to}
                variant={dark ? 'outline-dark' : 'outline'}
                size="lg"
              >
                {secondaryCta.label}
              </ButtonLink>
            )}
          </div>
          {highlights && (
            <dl
              className={cn(
                'mt-10 grid max-w-lg grid-cols-3 gap-6 border-t pt-6',
                dark ? 'border-cream/15' : 'border-line',
              )}
            >
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt className={cn('text-micro', dark ? 'text-cream/65' : 'text-muted')}>
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="min-w-0">{visual}</div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------------- Section */

export type SectionTone = 'cream' | 'white' | 'night' | 'orange' | 'light' | 'dark';

const scaffoldTone = {
  cream: { line: 'border-ink/[0.1]', marks: 'light' },
  white: { line: 'border-ink/[0.1]', marks: 'light' },
  night: { line: 'border-cream/[0.1]', marks: 'dark' },
  orange: { line: 'border-white/30', marks: 'orange' },
} as const;

/**
 * One band of a page. Rhythm: dark hero → cream → white → night (a scroll story or product
 * moment) → … → one full-bleed orange band → dark CTA. Never two bands of the same weight in
 * a row without a change of tone or layout.
 */
export function Section({
  children,
  className,
  tone = 'light',
  id,
  scaffold = false,
}: {
  children: ReactNode;
  className?: string;
  /**
   * `cream`, `white`, `night`, `orange`. `light` (= cream) and `dark` (= night) still work.
   * `orange` is the one full-bleed burnt-orange band of a page: text on it is white; cream is
   * for text of 24 px and up only (cream on #c2500a is 4.1:1).
   */
  tone?: SectionTone;
  id?: string;
  /** Hairline column lines at the container edges and `+` registration marks at the corners. */
  scaffold?: boolean;
}) {
  const key = tone === 'light' ? 'cream' : tone === 'dark' ? 'night' : tone;
  const look = scaffoldTone[key];
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 py-20 lg:py-32',
        scaffold && 'relative',
        key === 'white' && 'border-y border-line bg-white',
        key === 'night' && 'bg-night text-cream',
        key === 'orange' && 'bg-accent text-white',
        className,
      )}
    >
      {scaffold && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-7xl -translate-x-1/2"
        >
          {/* The lines sit half-way between the page edge and the content. */}
          <div className="absolute inset-y-0 right-2 left-2 sm:right-3 sm:left-3 lg:right-4 lg:left-4">
            <div className={cn('absolute inset-y-0 left-0 border-l', look.line)} />
            <div className={cn('absolute inset-y-0 right-0 border-r', look.line)} />
            <RegMarks tone={look.marks} />
          </div>
        </div>
      )}
      <Container className={cn(scaffold && 'relative')}>{children}</Container>
    </section>
  );
}

/* ------------------------------------------------------------- CTA band */

/**
 * Closing call to action. `night` (default): a dark band with the calm SimilarityWave behind
 * it. `orange`: the page's one full-bleed burnt-orange band (white text, a dark primary button).
 * Text left, buttons right. An `<em>` in the title is plain unless the caller opts in with
 * `serifAccent` (the serif italic phrase is for one place per page).
 */
export function CtaBand({
  eyebrow = 'Get started',
  title,
  description,
  primary = { label: 'Request a demo', to: '/contact' },
  secondary = { label: 'See how it works', to: '/platform' },
  tone = 'night',
  serifAccent = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
  tone?: 'night' | 'orange';
  serifAccent?: boolean;
}) {
  const orange = tone === 'orange';
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden border-b',
        orange ? 'border-white/20 bg-accent text-white' : 'border-cream/10 bg-night text-cream',
      )}
    >
      {orange ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-full max-w-7xl -translate-x-1/2"
        >
          <div className="absolute inset-y-0 right-2 left-2 sm:right-3 sm:left-3 lg:right-4 lg:left-4">
            <div className="absolute inset-y-0 left-0 border-l border-white/30" />
            <div className="absolute inset-y-0 right-0 border-r border-white/30" />
          </div>
        </div>
      ) : (
        <>
          <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-80" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-b from-night/40 via-night/70 to-night"
          />
        </>
      )}
      <Container className="grid grid-cols-1 gap-10 py-20 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16 lg:py-32">
        <div>
          <Reveal y={12}>
            <Eyebrow tone={orange ? 'orange' : 'dark'}>{eyebrow}</Eyebrow>
          </Reveal>
          <SplitReveal
            as="h2"
            className={cn(
              'text-statement mt-6 max-w-3xl font-semibold text-balance',
              orange ? 'text-white' : 'text-cream',
              serifAccent && 'serif-em-accent',
            )}
          >
            {title}
          </SplitReveal>
          <Reveal delay={0.25}>
            <p
              className={cn(
                'text-lead mt-6 max-w-xl text-pretty',
                orange ? 'text-white' : 'text-cream/75',
              )}
            >
              {description}
            </p>
          </Reveal>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end lg:pb-2">
          <ButtonLink to={primary.to} variant={orange ? 'dark' : 'primary'} size="lg">
            {primary.label}
            <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
          <ButtonLink to={secondary.to} variant={orange ? 'light' : 'outline-dark'} size="lg">
            {secondary.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------- Process steps */

export interface ProcessStep {
  title: string;
  description: string;
  detail?: string;
}

/** Numbered steps separated by a hairline. */
export function ProcessSteps({
  steps,
  tone = 'light',
}: {
  steps: ProcessStep[];
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <RevealGroup
      className={cn(
        'grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2',
        steps.length >= 5
          ? 'lg:grid-cols-5'
          : steps.length === 3
            ? 'lg:grid-cols-3'
            : 'lg:grid-cols-4',
      )}
    >
      {steps.map((step, index) => (
        <RevealItem key={step.title}>
          <div className={cn('border-t pt-5', dark ? 'border-cream/20' : 'border-line-strong')}>
            <p className={cn('text-micro', dark ? 'text-accent-soft' : 'text-accent-ink')}>
              Step {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className={cn('text-title mt-3 font-semibold', dark && 'text-cream')}>
              {step.title}
            </h3>
            <p className={cn('mt-2.5 leading-relaxed', dark ? 'text-cream/70' : 'text-muted')}>
              {step.description}
            </p>
            {step.detail && (
              <p className={cn('text-micro mt-4', dark ? 'text-cream/65' : 'text-muted')}>
                {step.detail}
              </p>
            )}
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/* --------------------------------------------------------- Feature card */

/** Plain card: optional icon, title, one description, optional footer content. */
export function FeatureCard({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <SpotlightCard className={cn('flex h-full flex-col p-6 lg:p-7', className)}>
      {/* Signature detail: the logo's ∼ in the corner, turning orange and sliding on hover. */}
      <LogoSymbol className="pointer-events-none absolute top-7 right-6 h-3.5 w-auto text-line-strong transition-[color,transform] duration-200 ease-out group-hover/spot:translate-x-1 group-hover/spot:text-accent motion-reduce:transition-none" />
      {icon && (
        <span className="relative mb-6 inline-flex size-11 self-start items-center justify-center rounded-xl bg-night text-accent-soft transition-[background-color,color] duration-200 group-hover/spot:bg-accent group-hover/spot:text-white [&>svg]:size-5">
          {icon}
        </span>
      )}
      <h3 className="text-title relative font-semibold">{title}</h3>
      <p className="relative mt-2.5 leading-relaxed text-muted">{description}</p>
      {children && (
        <div className="relative mt-auto pt-6">
          <div className="border-t border-dashed border-line-strong/80 pt-4 text-[13px] [&_p]:text-[13px]">
            {children}
          </div>
        </div>
      )}
    </SpotlightCard>
  );
}

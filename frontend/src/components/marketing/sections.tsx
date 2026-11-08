import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
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
 * Hero for inner pages: copy left, one product visual right. Dark by default (v4 rhythm:
 * every long page opens on night with the signature wave). Nothing animates on load
 * except the wave, so the headline is readable immediately. An `<em>` in the title is set
 * in Instrument Serif italic (one phrase at most).
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
              'text-display mt-5 font-semibold text-balance',
              dark ? 'text-cream' : 'text-ink',
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              'text-lead mt-5 max-w-xl text-pretty',
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
                  <dt className={cn('text-[13px]', dark ? 'text-cream/65' : 'text-muted')}>
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{item.value}</dd>
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

/**
 * One band of a page. v4 rhythm: dark hero → `light` (cream) → `white` → `dark` (night,
 * a scroll story or product moment) → … → dark CTA. Never two bands of the same weight in
 * a row without a change of tone or layout.
 */
export function Section({
  children,
  className,
  tone = 'light',
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'white' | 'dark';
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-20 py-20 lg:py-32',
        tone === 'white' && 'border-y border-line bg-white',
        tone === 'dark' && 'bg-night text-cream',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/* ------------------------------------------------------------- CTA band */

/**
 * Closing call to action: a dark band with the calm SimilarityWave behind it. Text left,
 * buttons right. An `<em>` in the title is set in Instrument Serif italic (one phrase).
 */
export function CtaBand({
  eyebrow = 'Get started',
  title,
  description,
  primary = { label: 'Request a demo', to: '/contact' },
  secondary = { label: 'See how it works', to: '/platform' },
}: {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-cream/10 bg-night text-cream">
      <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-80" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-night/40 via-night/70 to-night"
      />
      <Container className="grid grid-cols-1 gap-10 py-20 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16 lg:py-32">
        <Reveal>
          <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          <h2 className="text-statement serif-em mt-5 max-w-3xl font-semibold text-balance text-cream">
            {title}
          </h2>
          <p className="text-lead mt-5 max-w-xl text-pretty text-cream/75">{description}</p>
        </Reveal>
        <div className="flex flex-wrap gap-3 lg:justify-end lg:pb-2">
          <ButtonLink to={primary.to} size="lg">
            {primary.label}
            <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
          <ButtonLink to={secondary.to} variant="outline-dark" size="lg">
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
            <p
              className={cn(
                'font-mono text-[12.5px] font-medium',
                dark ? 'text-accent-soft' : 'text-accent-ink',
              )}
            >
              Step {index + 1}
            </p>
            <h3 className={cn('text-title mt-2 font-semibold', dark && 'text-cream')}>
              {step.title}
            </h3>
            <p className={cn('mt-2.5 leading-relaxed', dark ? 'text-cream/70' : 'text-muted')}>
              {step.description}
            </p>
            {step.detail && (
              <p className={cn('mt-3 text-[13px]', dark ? 'text-cream/65' : 'text-muted')}>
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
    <SpotlightCard className={cn('flex h-full flex-col p-6', className)}>
      {icon && (
        <span className="mb-5 inline-flex size-10 self-start items-center justify-center rounded-xl bg-accent/[0.08] text-accent ring-1 ring-accent/15 [&>svg]:size-5">
          {icon}
        </span>
      )}
      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted">{description}</p>
      {children && <div className="mt-5 flex-1">{children}</div>}
    </SpotlightCard>
  );
}

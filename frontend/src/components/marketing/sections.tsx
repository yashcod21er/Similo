import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
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
  /** A photo (`PhotoFrame`) or one clearly captioned product visual. */
  visual: ReactNode;
}

/**
 * Hero for inner pages: copy left, one photo or visual right, on a plain white
 * canvas. Nothing animates on load, so the headline is readable immediately.
 */
export function SplitHero({
  eyebrow,
  title,
  description,
  primaryCta = { label: 'Request a demo', to: '/contact' },
  secondaryCta,
  highlights,
  visual,
}: HeroProps) {
  return (
    <section className="bg-white">
      {/* grid-cols-1 (minmax(0, 1fr)) stops a wide visual from stretching the column on phones. */}
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-display mt-4 font-semibold text-balance">{title}</h1>
          <p className="text-lead mt-5 max-w-xl text-pretty text-muted">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={primaryCta.to} size="lg">
              {primaryCta.label}
            </ButtonLink>
            {secondaryCta && (
              <ButtonLink to={secondaryCta.to} variant="outline" size="lg">
                {secondaryCta.label}
              </ButtonLink>
            )}
          </div>
          {highlights && (
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt className="text-[13px] text-muted">{item.label}</dt>
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
 * One band of a page. Alternate `light` (paper) and `white`; use `dark`
 * (night) at most once per page.
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
        'scroll-mt-20 py-20 lg:py-28',
        tone === 'white' && 'border-y border-line bg-white',
        tone === 'dark' && 'bg-night text-white',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/* ------------------------------------------------------------- CTA band */

/** Closing call to action: the page's one dark band. Text left, buttons right. */
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
    <section className="bg-night text-white">
      <Container className="grid grid-cols-1 gap-8 py-16 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:gap-16 lg:py-20">
        <Reveal>
          <Eyebrow tone="dark">{eyebrow}</Eyebrow>
          <h2 className="text-headline mt-3 max-w-2xl font-semibold text-balance">{title}</h2>
          <p className="text-lead mt-4 max-w-xl text-pretty text-white/70">{description}</p>
        </Reveal>
        <div className="flex flex-wrap gap-3 lg:justify-end">
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
          <div className={cn('border-t pt-5', dark ? 'border-white/20' : 'border-line-strong')}>
            <p className={cn('text-[13px] font-medium', dark ? 'text-accent-soft' : 'text-accent-ink')}>
              Step {index + 1}
            </p>
            <h3 className={cn('text-title mt-2 font-semibold', dark && 'text-white')}>
              {step.title}
            </h3>
            <p className={cn('mt-2.5 leading-relaxed', dark ? 'text-white/70' : 'text-muted')}>
              {step.description}
            </p>
            {step.detail && (
              <p className={cn('mt-3 text-[13px]', dark ? 'text-white/60' : 'text-muted')}>
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
      {icon && <span className="mb-5 text-accent [&>svg]:size-5">{icon}</span>}
      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted">{description}</p>
      {children && <div className="mt-5 flex-1">{children}</div>}
    </SpotlightCard>
  );
}

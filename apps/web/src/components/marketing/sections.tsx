import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';
import { Container, Eyebrow } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { EASE_OUT } from '@/lib/motion';
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
  visual: ReactNode;
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
});

/** Hero for inner pages: copy left, product visual right, on a calm light canvas. */
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
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-dots mask-radial absolute inset-0 -z-10 opacity-70" />
      <div
        aria-hidden
        className="absolute -top-48 right-[-10%] -z-10 size-[620px] rounded-full bg-coral/25 blur-[120px]"
      />
      {/* grid-cols-1 (minmax(0, 1fr)) stops a wide visual from stretching the column on phones. */}
      <Container className="grid grid-cols-1 items-center gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pt-24 lg:pb-28">
        <div>
          <motion.div {...rise(0)}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </motion.div>
          <motion.h1
            {...rise(0.05)}
            className="text-headline mt-6 font-semibold text-balance lg:text-[3.9rem]"
          >
            {title}
          </motion.h1>
          <motion.p {...rise(0.12)} className="text-lead mt-6 max-w-xl text-pretty text-muted">
            {description}
          </motion.p>
          <motion.div {...rise(0.2)} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to={primaryCta.to} size="lg">
              {primaryCta.label}
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
            {secondaryCta && (
              <ButtonLink to={secondaryCta.to} variant="outline" size="lg">
                {secondaryCta.label}
              </ButtonLink>
            )}
          </motion.div>
          {highlights && (
            <motion.dl
              {...rise(0.3)}
              className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6"
            >
              {highlights.map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold">{item.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}
        </div>
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.15 }}
        >
          {visual}
        </motion.div>
      </Container>
    </section>
  );
}

/* --------------------------------------------------------------- Section */

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
        'scroll-mt-24 py-20 sm:py-28 lg:py-32',
        tone === 'white' && 'border-y border-line bg-white',
        tone === 'dark' && 'bg-midnight text-white',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/* ------------------------------------------------------------- CTA band */

/** Closing call to action: a contained navy panel rather than a full-bleed band. */
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
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[32px] bg-midnight px-6 py-16 text-center text-white shadow-stage sm:rounded-[40px] sm:px-12 sm:py-24">
            <div aria-hidden className="bg-dots-dark mask-radial absolute inset-0 -z-10" />
            <div
              aria-hidden
              className="absolute bottom-[-55%] left-1/2 -z-10 h-[480px] w-[860px] -translate-x-1/2 rounded-full bg-crimson/40 blur-[120px]"
            />
            <LogoMark className="mx-auto size-11 rounded-xl ring-1 ring-white/15" />
            <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center">
              <Eyebrow tone="dark">{eyebrow}</Eyebrow>
              <h2 className="text-headline mt-5 font-semibold text-balance">{title}</h2>
              <p className="text-lead mt-5 max-w-2xl text-pretty text-white/65">{description}</p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <ButtonLink to={primary.to} size="lg">
                  {primary.label}
                  <ArrowRight aria-hidden className="size-4" />
                </ButtonLink>
                <ButtonLink to={secondary.to} variant="outline-dark" size="lg">
                  {secondary.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
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

/** Numbered steps; a hairline above each step fills in crimson as it scrolls into view. */
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
        'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2',
        steps.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
      )}
    >
      {steps.map((step, index) => (
        <RevealItem key={step.title}>
          <div className={cn('relative h-px', dark ? 'bg-white/15' : 'bg-line')}>
            <motion.div
              aria-hidden
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '0px 0px -15% 0px' }}
              transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 * index }}
              className="absolute inset-0 origin-left bg-crimson"
            />
          </div>
          <p
            className={cn(
              'mt-5 font-mono text-[13px] font-medium',
              dark ? 'text-coral' : 'text-crimson-dark',
            )}
          >
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className={cn('text-title mt-3 font-semibold', dark && 'text-white')}>
            {step.title}
          </h3>
          <p className={cn('mt-2.5 leading-relaxed', dark ? 'text-white/60' : 'text-muted')}>
            {step.description}
          </p>
          {step.detail && (
            <p
              className={cn(
                'mt-4 font-mono text-[12px] tracking-wide',
                dark ? 'text-white/60' : 'text-muted',
              )}
            >
              {step.detail}
            </p>
          )}
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/* ---------------------------------------------------------- Signal strip */

const SIGNAL_SOURCES = [
  'New domain registrations',
  'Certificate Transparency logs',
  'Domain registration records',
  'DNS & mail records',
  'App store listings',
  'Trademark journals',
  'Scanned gazettes',
  'Evidence your team uploads',
];

/** Infinite marquee of the *kinds* of sources the platform is designed around. */
export function SignalStrip() {
  const items = [...SIGNAL_SOURCES, ...SIGNAL_SOURCES];
  return (
    <div className="border-y border-line bg-white py-5">
      <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-10">
        <p className="shrink-0 font-mono text-[12px] tracking-[0.08em] text-muted uppercase">
          Where we look
        </p>
        <div className="mask-fade-x relative flex-1 overflow-hidden">
          <ul className="flex w-max gap-10 motion-safe:animate-marquee">
            {items.map((source, index) => (
              <li
                key={`${source}-${index}`}
                aria-hidden={index >= SIGNAL_SOURCES.length}
                className="flex items-center gap-2.5 text-sm font-medium whitespace-nowrap text-ink/70"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-crimson" />
                {source}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}

/* --------------------------------------------------------- Feature card */

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
    <SpotlightCard className={cn('flex h-full flex-col p-6 sm:p-7', className)}>
      {icon && (
        <span className="mb-6 flex size-10 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line transition-colors duration-300 group-hover/spot:bg-crimson group-hover/spot:text-white group-hover/spot:ring-crimson">
          {icon}
        </span>
      )}
      <h3 className="text-[1.125rem] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted">{description}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </SpotlightCard>
  );
}

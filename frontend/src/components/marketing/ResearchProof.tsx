import { ArrowUpRight, Info } from 'lucide-react';
import { CountUp } from '@/components/motion/CountUp';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Container, Eyebrow } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { RESEARCH_CHECKED, RESEARCH_FIGURES, RESEARCH_NOTE } from '@/content/research';
import { cn } from '@/lib/cn';

/**
 * "The problem in numbers": a dark band with four real, sourced figures from public
 * research (APWG, Interisle, WIPO). Every figure names its source, its period and links to
 * the page that states it. This is our honest substitute for customer logos and statistics
 * (we have no customers to quote). Figures live in `content/research.ts`.
 *
 * Place it between light bands; it brings its own wave and padding.
 */
export function ResearchProof({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="research-heading"
      className={cn('relative isolate overflow-hidden bg-night text-cream', className)}
    >
      {/* The signature wave runs along the foot of the band, under the closing note. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-52 [mask-image:linear-gradient(to_top,black_35%,transparent)] lg:h-72"
      >
        <SimilarityWave tone="dark" density="calm" className="opacity-70" />
      </div>

      <Container className="pt-20 pb-48 lg:pt-32 lg:pb-56">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Reveal y={12}>
              <Eyebrow tone="dark">The problem in numbers</Eyebrow>
            </Reveal>
            <SplitReveal
              as="h2"
              id="research-heading"
              className="text-statement mt-6 font-semibold text-balance text-cream"
            >
              What the research says about copycats.
            </SplitReveal>
          </div>
          <Reveal delay={0.25}>
            <p className="text-lead text-pretty text-cream/75">
              Independent groups measure phishing sites, impersonated brands and domain disputes.
              These are their latest published figures, each with the page that states it.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-x-0 lg:gap-y-0">
          {RESEARCH_FIGURES.map((figure, index) => (
            <RevealItem key={figure.id} className="lg:px-7 lg:first:pl-0 lg:last:pr-0">
              <figure className="flex h-full flex-col border-t border-cream/20 pt-6 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-7 lg:first:border-l-0 lg:first:pl-0">
                <p aria-hidden className="text-micro mb-5 text-cream/65">
                  Fig. {String(index + 1).padStart(2, '0')}
                </p>
                <p className="text-[clamp(2.75rem,1.6rem+2.4vw,3.75rem)] leading-none font-semibold tracking-[-0.045em] text-cream">
                  <CountUp
                    value={figure.value}
                    {...(figure.prefix ? { prefix: figure.prefix } : {})}
                    {...(figure.suffix ? { suffix: figure.suffix } : {})}
                  />
                </p>
                <span aria-hidden className="mt-5 block h-[3px] w-9 rounded-full bg-accent-soft" />
                <figcaption className="mt-5 flex flex-1 flex-col">
                  <span className="text-[1.0625rem] leading-snug font-medium text-cream">
                    {figure.label}
                  </span>
                  <span className="mt-3 text-[14.5px] leading-relaxed text-cream/70">
                    {figure.explanation}
                  </span>
                  <span className="mt-auto block pt-6 text-[13px] leading-relaxed text-cream/65">
                    {figure.period}
                    <br />
                    <a
                      href={figure.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline font-medium text-cream underline decoration-cream/35 underline-offset-4 transition-colors hover:decoration-accent-soft"
                    >
                      {figure.source}
                      <ArrowUpRight aria-hidden className="ml-1 inline size-3.5 align-[-2px]" />
                      <span className="sr-only">(opens the source in a new tab)</span>
                    </a>
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-16 lg:mt-24">
          <p className="flex max-w-3xl items-start gap-2.5 text-[13.5px] leading-relaxed text-cream/75">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-soft" />
            <span>
              {RESEARCH_NOTE} Checked against each source on {RESEARCH_CHECKED}. Numbers are quoted
              exactly as published; the sources define what each one counts.
            </span>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

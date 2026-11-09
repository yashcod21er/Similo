import { ArrowRight } from 'lucide-react';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ButtonLink } from '@/components/ui/Button';
import { LogoSymbol } from '@/components/ui/Logo';
import { MonoLabel } from '@/components/ui/specimen';
import { Reveal } from '@/components/ui/Reveal';
import { Band, PlateLine } from './band';

/** FIG. 10, the close: one line and two ways forward, on night (the footer follows). */
export function ClosingSection() {
  return (
    <Band
      tone="night"
      labelledBy="closing-title"
      className="overflow-hidden py-20 sm:py-24 lg:py-32"
    >
      {/* The mark, very large and almost dark, cropped by the right edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-[20%] -z-10 hidden w-[56%] -translate-y-1/2 opacity-[0.09] lg:block"
      >
        <LogoSymbol accent className="h-auto! w-full text-cream" />
      </span>
      <PlateLine tone="night" index="10" title="Next" />
      <SplitReveal
        as="h2"
        id="closing-title"
        className="mt-14 max-w-5xl text-[clamp(2.75rem,1rem+6vw,6.5rem)] leading-[0.95] font-semibold tracking-[-0.05em] text-balance text-cream lg:mt-20"
      >
        See your brand’s copies before anyone else does.
      </SplitReveal>
      <Reveal delay={0.2}>
        <div className="mt-12 flex flex-col gap-8 border-t border-cream/[0.12] pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-16">
          <MonoLabel tone="dark">
            Monitoring, alerts and one investigation, with your brand
          </MonoLabel>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              Request a demo
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
            <ButtonLink to="/platform" variant="outline-dark" size="lg">
              See the platform
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Band>
  );
}

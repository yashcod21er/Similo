import { SplitReveal } from '@/components/motion/SplitReveal';
import { CornerBrackets } from '@/components/ui/specimen';
import { Reveal } from '@/components/ui/Reveal';
import { Band, PlateLine } from './band';
import { LookalikeChecker } from './LookalikeChecker';

/**
 * FIG. 04, the working brand checker: the page's hands-on moment, on the cream canvas. Keeps
 * the `#check` anchor that the header and the hero link to.
 */
export function CheckerSection() {
  return (
    <Band tone="cream" id="check" labelledBy="check-title" className="py-20 sm:py-24 lg:py-28">
      <PlateLine
        tone="cream"
        index="04"
        title="Try it with your name"
        note="Runs in your browser"
      />
      <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <SplitReveal
          as="h2"
          id="check-title"
          className="text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance"
        >
          Type your brand. Meet its copies.
        </SplitReveal>
        <Reveal delay={0.15}>
          <p className="max-w-sm text-[1.0625rem] leading-relaxed text-pretty text-muted lg:pb-1">
            Similo builds the look-alike names copycats really use and marks exactly what changed.
            No account needed.
          </p>
        </Reveal>
      </div>
      <Reveal className="relative mt-12 lg:mt-16">
        <LookalikeChecker />
        <CornerBrackets className="-inset-3 sm:-inset-4" />
      </Reveal>
    </Band>
  );
}

import { Marquee } from '@/components/motion/Marquee';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { LogoSymbol } from '@/components/ui/Logo';
import { MonoLabel } from '@/components/ui/specimen';
import { Reveal } from '@/components/ui/Reveal';
import { Band, GUTTER, PlateLine } from './band';

/*
 * FIG. 08, the page's one burnt-orange flood: the idea of the whole site in one sentence, set
 * huge in the serif (upright, regular), then the marquee of what Similo does. Cream is only
 * used for type of 24 px and more on this band (cream on #c2500a is about 4.2:1); smaller
 * text is white (4.7:1).
 */

const WORDS = ['spot the difference', 'keep the evidence', 'a person decides'];

/** Full-bleed orange band. */
export function FloodSection() {
  return (
    <Band
      tone="orange"
      bleed
      labelledBy="flood-title"
      className="overflow-hidden pt-20 sm:pt-24 lg:pt-28"
    >
      <div className={GUTTER}>
        <PlateLine tone="orange" index="08" title="The rule we work by" />
        <SplitReveal
          as="h2"
          id="flood-title"
          className="serif-display mt-14 text-[clamp(3.5rem,1rem+13.5vw,15rem)] leading-[0.9] text-balance text-cream lg:mt-20"
        >
          The difference is the evidence.
        </SplitReveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mt-14">
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-pretty text-white">
              Every copy changes something. Similo finds what changed, saves the proof and puts it
              in front of a person.
            </p>
            <MonoLabel tone="orange">Nothing is sent without your say</MonoLabel>
          </div>
        </Reveal>
      </div>
      <div className="mt-16 border-t border-white/25 py-6 lg:mt-24 lg:py-8">
        <Marquee
          label="Spot the difference, keep the evidence, a person decides."
          speed={50}
          className="text-[clamp(2rem,1rem+3vw,3.5rem)] leading-none font-semibold tracking-[-0.04em] text-cream"
        >
          {WORDS.map((word) => (
            <span key={word} className="flex items-center whitespace-nowrap">
              {word}
              <LogoSymbol className="mx-[0.45em] h-[0.42em]! w-auto shrink-0 text-night" />
            </span>
          ))}
        </Marquee>
      </div>
    </Band>
  );
}

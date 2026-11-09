import { LetterSwap } from '@/components/scenes';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { FigCaption, MonoLabel } from '@/components/ui/specimen';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { Band, GUTTER, PlateLine } from './band';

/*
 * FIG. 03, a type specimen on night: one giant address in which a letter quietly changes
 * (acme.com → acrne.com, "rn" passing for "m"), then three more tricks set small like the
 * notes on a specimen sheet.
 */

const TRICKS = [
  { name: 'acme-login.com', changed: '-login', trick: 'An extra word' },
  { name: 'acme.co', changed: '.co', trick: 'A new ending' },
  { name: 'acmme.com', changed: 'mm', trick: 'A doubled letter' },
] as const;

function Trick({ name, changed }: { name: string; changed: string }) {
  const at = name.indexOf(changed);
  return (
    <span className="font-mono text-[15px] text-cream">
      {name.slice(0, at)}
      <mark className="bg-transparent text-accent-soft underline decoration-accent-soft decoration-[1.5px] underline-offset-4">
        {changed}
      </mark>
      {name.slice(at + changed.length)}
    </span>
  );
}

/** Night band: the letter swap, set as large as the page allows. */
export function LetterSection() {
  return (
    <Band tone="night" bleed labelledBy="letter-title" className="py-20 sm:py-24 lg:py-28">
      <div className={GUTTER}>
        <PlateLine tone="night" index="03" title="One letter is enough" note="r + n ≈ m" />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <SplitReveal
            as="h2"
            id="letter-title"
            className="text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance text-cream"
          >
            Read it again. Slowly.
          </SplitReveal>
          <Reveal delay={0.15}>
            <p className="max-w-sm text-[1.0625rem] leading-relaxed text-pretty text-cream/70 lg:pb-1">
              Copycats swap “m” for “rn”, add a word or change the ending. Similo checks every new
              name for tricks like these.
            </p>
          </Reveal>
        </div>
      </div>

      {/* The specimen: full width, between two hairlines. */}
      <div className="relative mt-14 border-y border-cream/[0.12] py-8 sm:py-10 lg:mt-20">
        <div className={GUTTER}>
          <div className="flex items-center justify-between gap-6">
            <MonoLabel tone="dark">Specimen</MonoLabel>
            <MonoLabel tone="dark">acme.com, as a copycat could register it</MonoLabel>
          </div>
        </div>
        <div className="overflow-hidden px-2 pt-4 pb-10 text-center sm:pb-14">
          <LetterSwap
            from="acme.com"
            to="acrne.com"
            tone="dark"
            className="text-[15.5vw] leading-[1.05] font-medium tracking-[-0.06em] text-cream"
          />
        </div>
      </div>

      <div className={GUTTER}>
        <RevealGroup className="mt-10 grid grid-cols-1 sm:grid-cols-3">
          {TRICKS.map((trick) => (
            <RevealItem
              key={trick.name}
              className="flex items-baseline justify-between gap-4 border-b border-cream/[0.12] py-4 sm:block sm:border-r sm:border-b-0 sm:px-6 sm:py-1 sm:first:pl-0 sm:last:border-r-0"
            >
              <Trick name={trick.name} changed={trick.changed} />
              <MonoLabel tone="dark" className="block sm:mt-2">
                {trick.trick}
              </MonoLabel>
            </RevealItem>
          ))}
        </RevealGroup>
        <FigCaption index="03" tone="dark" className="mt-8">
          Example names for the fictional brand Acme
        </FigCaption>
      </div>
    </Band>
  );
}

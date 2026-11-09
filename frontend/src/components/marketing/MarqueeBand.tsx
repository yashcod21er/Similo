import { Marquee } from '@/components/motion/Marquee';
import { LogoSymbol } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

/*
 * A full-bleed band of giant type: two lines that flow in opposite directions and follow the
 * page's scroll speed. The words are what Similo watches and what it does (plain nouns and
 * verbs, no logos or customer names); the ∼ between them is the brand mark, "is similar to".
 */

const WHERE = ['websites', 'apps', 'trademarks', 'look-alikes'];
const WHAT = ['watch', 'explain', 'you decide'];

/** One line of words with the ∼ mark after each. */
function Line({ words, outline }: { words: string[]; outline?: boolean }) {
  return (
    <>
      {words.map((word) => (
        <span key={word} className="flex items-center">
          <span
            className={cn(
              outline &&
                'tracking-[-0.04em] text-transparent [-webkit-text-stroke:0.012em_var(--color-cream)]',
            )}
          >
            {word}
          </span>
          <LogoSymbol
            accent
            className="mx-[0.32em] h-[0.4em]! w-auto shrink-0 text-cream/90 motion-reduce:mx-[0.2em]"
          />
        </span>
      ))}
    </>
  );
}

/** The home page's kinetic type band (night, cream type, the ∼ in burnt orange). */
export function MarqueeBand() {
  const type =
    'pb-[0.22em] text-[clamp(4rem,12.5vw,13rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-cream motion-reduce:text-[clamp(2.25rem,6.5vw,5.5rem)] motion-reduce:leading-[1.05]';
  return (
    <section className="relative overflow-hidden bg-night py-12 text-cream sm:py-16 lg:py-24">
      <Marquee label="Websites, apps, trademarks and look-alikes." className={type} speed={70}>
        <Line words={WHERE} />
      </Marquee>
      <Marquee
        label="Watch, explain, you decide."
        className={cn(type, '-mt-[0.1em]')}
        speed={55}
        direction={-1}
      >
        <Line words={WHAT} outline />
      </Marquee>
    </section>
  );
}

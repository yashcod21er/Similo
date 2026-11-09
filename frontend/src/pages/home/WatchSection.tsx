import { IsometricStack } from '@/components/scenes';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Reveal } from '@/components/ui/Reveal';
import { Band, PlateLine } from './band';

/*
 * FIG. 06, "What Similo watches": an isometric stack of sheets, one per source, resting on the
 * case file (the evidence). A diagram, not a screenshot.
 */

const LAYERS = [
  { label: 'Websites', detail: 'Newly registered domain names' },
  { label: 'Apps', detail: 'New listings in the app stores' },
  { label: 'Trademarks', detail: 'New filings in official trademark journals' },
  { label: 'Evidence', detail: 'Screenshots, records and page code, saved per alert' },
];

/** White band: three sources to watch, one case file to keep. */
export function WatchSection() {
  return (
    <Band tone="white" labelledBy="watch-title" className="py-20 sm:py-24 lg:py-28">
      <PlateLine
        tone="white"
        index="06"
        title="What Similo watches"
        note="Three sources, one file"
      />
      <div className="mt-12 grid grid-cols-1 items-center gap-14 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <SplitReveal
            as="h2"
            id="watch-title"
            className="text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance"
          >
            Three places to watch. One file to keep.
          </SplitReveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-sm text-[1.0625rem] leading-relaxed text-pretty text-muted">
              New websites, apps and trademark filings are checked every day. Whatever looks like
              you is saved, with the proof, in one case file.
            </p>
          </Reveal>
        </div>
        <Reveal>
          <IsometricStack layers={LAYERS} className="mx-auto w-full max-w-2xl" />
        </Reveal>
      </div>
    </Band>
  );
}

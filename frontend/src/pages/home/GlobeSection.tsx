import { lazy, Suspense, useCallback, useState } from 'react';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { CornerBrackets, FigCaption, MonoLabel } from '@/components/ui/specimen';
import { Reveal } from '@/components/ui/Reveal';
import { Band, PlateLine } from './band';

// three.js is shared with the hero's GlassMark, so this costs no extra download.
const DomainGlobe = lazy(() => import('@/components/motion/DomainGlobe'));

/**
 * FIG. 07, "Wherever they appear": the globe of domains, drawn as an ink engraving on the cream
 * canvas (`DomainGlobe tone="light"`), with orange copycats and arcs from your brand to them.
 * The globe pauses off-screen, so it never animates at the same time as the hero's GlassMark.
 */
export function GlobeSection() {
  const [webglFailed, setWebglFailed] = useState(false);
  const onFail = useCallback(() => setWebglFailed(true), []);

  return (
    <Band tone="cream" labelledBy="globe-title" className="overflow-hidden py-20 sm:py-24 lg:py-28">
      <PlateLine tone="cream" index="07" title="Wherever they appear" />
      <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:mt-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:pt-12">
          <SplitReveal
            as="h2"
            id="globe-title"
            className="text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance"
          >
            Copies don’t stay local.
          </SplitReveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-sm text-[1.0625rem] leading-relaxed text-pretty text-muted">
              A look-alike can be registered anywhere, under any ending. Similo checks the new names
              against your brand and links each match back to it.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <dl className="mt-10 grid max-w-sm grid-cols-2 border-t border-ink/10">
              <div className="border-r border-ink/10 py-4 pr-4">
                <dt>
                  <MonoLabel>Your brand</MonoLabel>
                </dt>
                <dd className="mt-2 flex items-center gap-2 text-[15px] font-medium">
                  <span aria-hidden className="size-2.5 rounded-full bg-accent" />
                  One point
                </dd>
              </div>
              <div className="py-4 pl-4">
                <dt>
                  <MonoLabel>Look-alikes</MonoLabel>
                </dt>
                <dd className="mt-2 flex items-center gap-2 text-[15px] font-medium">
                  <span aria-hidden className="h-px w-5 bg-accent" />
                  An arc to each
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <figure className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-[640px]">
            {webglFailed ? (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <SimilarityWave tone="light" density="calm" />
              </div>
            ) : (
              <Suspense fallback={null}>
                <DomainGlobe tone="light" onFail={onFail} className="absolute inset-0" />
              </Suspense>
            )}
            <CornerBrackets className="inset-[4%]" />
          </div>
          <FigCaption as="figcaption" index="07" className="mt-4 text-center">
            An illustration, not live data
          </FigCaption>
        </figure>
      </div>
    </Band>
  );
}

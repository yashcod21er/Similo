import { Globe, Smartphone, Stamp } from 'lucide-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { Container, Eyebrow } from '@/components/ui/layout';

// three.js is shared with the hero's GlassMark, so this costs no extra download.
const DomainGlobe = lazy(() => import('@/components/motion/DomainGlobe'));

const SOURCES = [
  {
    icon: Globe,
    title: 'Newly registered websites',
    body: 'Fresh domain names that borrow your name or swap a letter.',
  },
  {
    icon: Smartphone,
    title: 'App store listings',
    body: 'Apps that copy your name, icon or screenshots.',
  },
  {
    icon: Stamp,
    title: 'Trademark journals',
    body: 'New filings for marks that sound or look like yours.',
  },
];

/**
 * "The whole internet" band (v5): the 3D globe of domains (it used to be the hero) on a warm
 * amber glow with a faint scanline and vignette, beside the three places Similo watches.
 * The globe pauses off-screen, so it never animates at the same time as the hero's GlassMark.
 */
export function GlobeSection() {
  const [webglFailed, setWebglFailed] = useState(false);
  const onFail = useCallback(() => setWebglFailed(true), []);

  return (
    <section
      aria-labelledby="globe-title"
      className="relative isolate overflow-hidden bg-night py-20 text-cream sm:py-28 lg:py-32"
    >
      {/* Warm amber glow and a soft vignette. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_72%_50%,rgb(194_80_10/0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgb(0_0_0/0.55))]"
      />

      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
        <div>
          <Eyebrow tone="dark">What Similo watches</Eyebrow>
          <h2
            id="globe-title"
            className="serif-em text-statement mt-5 font-semibold text-balance text-cream"
          >
            One brand. <em className="text-accent-soft">The whole internet</em> to watch.
          </h2>
          <p className="text-lead mt-6 max-w-lg text-pretty text-cream/75">
            New look-alikes appear every day, in places your team cannot check by hand. Similo
            checks the new ones against your brand and tells you which deserve a closer look.
          </p>
          <ul className="mt-10 grid gap-6">
            {SOURCES.map((source) => (
              <li key={source.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cream/[0.06] ring-1 ring-cream/10">
                  <source.icon aria-hidden className="size-[18px] text-accent-soft" />
                </span>
                <div>
                  <p className="text-[15.5px] font-semibold text-cream">{source.title}</p>
                  <p className="mt-1 text-[14.5px] text-cream/70">{source.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-[620px]">
            {webglFailed ? (
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <SimilarityWave tone="dark" density="calm" />
              </div>
            ) : (
              <Suspense fallback={null}>
                <DomainGlobe onFail={onFail} className="absolute inset-0" />
              </Suspense>
            )}
            {/* A faint scanline, like an old amber monitor, fading out at the edges. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(18_17_15/0.28)_0_1px,transparent_1px_4px)] [mask-image:radial-gradient(closest-side,black_55%,transparent)]"
            />
          </div>
          <figcaption className="mt-4 text-center text-[12.5px] text-cream/65">
            The globe is an illustration, not live data.
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}

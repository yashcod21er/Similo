import { ArrowDown, ArrowRight, Globe, Smartphone, Stamp } from 'lucide-react';
import { motion } from 'motion/react';
import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { Container, Eyebrow } from '@/components/ui/layout';

// three.js is only downloaded on the home page, after the text is on screen.
const DomainGlobe = lazy(() => import('@/components/motion/DomainGlobe'));

const SOURCES = [
  { icon: Globe, label: 'Newly registered websites' },
  { icon: Smartphone, label: 'App store listings' },
  { icon: Stamp, label: 'Trademark journals' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** One headline line that slides up from behind a mask. */
function Line({ children, index }: { children: ReactNode; index: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay: 0.15 + index * 0.09, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Home hero ("bold and immersive"): a full-screen night band with a 3D globe of
 * the world's domains, where copycats flare up and are traced back to your brand,
 * and a giant headline. Falls back to the 2D SimilarityWave without WebGL.
 */
export function HomeHero() {
  const [webglFailed, setWebglFailed] = useState(false);
  const onFail = useCallback(() => setWebglFailed(true), []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night text-cream">
      <div aria-hidden className="absolute inset-0 -z-10">
        {/* A warm glow behind the globe. */}
        <div className="absolute top-[18%] right-[-10%] aspect-square w-[90vw] max-w-[820px] rounded-full bg-accent/12 blur-[140px] lg:right-[2%] lg:w-[55vw]" />
        {webglFailed ? (
          <SimilarityWave tone="dark" density="full" />
        ) : (
          <Suspense fallback={null}>
            <DomainGlobe
              onFail={onFail}
              className="absolute top-[34%] right-[-45%] h-[78%] w-[150%] opacity-60 sm:right-[-25%] sm:w-[110%] lg:top-[4%] lg:right-[-6%] lg:h-[96%] lg:w-[64%] lg:opacity-100"
            />
          </Suspense>
        )}
        {/* Keep the headline side calm. */}
        <div className="absolute inset-0 bg-linear-to-b from-night/80 via-night/40 to-night lg:bg-linear-to-r lg:from-night lg:via-night/70 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-night to-transparent" />
      </div>

      <Container className="flex flex-1 flex-col justify-center pt-28 pb-12 lg:pt-28 lg:pb-14">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <Eyebrow tone="dark">Brand protection for websites, apps and trademarks</Eyebrow>
        </motion.div>

        <h1 className="text-mega mt-6 max-w-[13ch] font-semibold text-cream">
          <Line index={0}>Find the</Line> <Line index={1}>copycats</Line>{' '}
          <Line index={2}>
            <em className="text-accent-soft">before your</em>
          </Line>{' '}
          <Line index={3}>
            <em className="text-accent-soft">customers do.</em>
          </Line>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: EASE }}
        >
          <p className="text-lead mt-8 max-w-xl text-pretty text-cream/75">
            Similo watches the world’s new websites, apps and trademark filings for look-alikes of
            your brand, shows exactly why each one looks like you, and lets a person on your team
            decide what happens next.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              Request a demo
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
            <a href="#check" className={buttonClasses({ variant: 'outline-dark', size: 'lg' })}>
              Check your brand
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </div>
        </motion.div>
      </Container>

      <div className="border-t border-cream/10">
        <Container className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:gap-10">
          <p className="text-[13px] font-medium text-cream/65">Similo watches</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {SOURCES.map((source) => (
              <li key={source.label} className="flex items-center gap-2 text-[14px] text-cream/85">
                <source.icon aria-hidden className="size-4 text-accent-soft" />
                {source.label}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-cream/50 sm:ml-auto">
            The globe is an illustration, not live data.
          </p>
        </Container>
      </div>
    </section>
  );
}

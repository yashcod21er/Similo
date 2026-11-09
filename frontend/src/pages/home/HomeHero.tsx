import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { lazy, Suspense, useCallback, useRef, useState, type ReactNode } from 'react';
import { introDelay } from '@/components/motion/intro';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { Eyebrow } from '@/components/ui/layout';
import { LogoMark } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

// three.js is only downloaded on the home page, after the text is on screen.
const GlassMark = lazy(() => import('@/components/motion/GlassMark'));

const EASE = [0.22, 1, 0.36, 1] as const;

/** The page gutter, as in `Container` (spans, because they sit inside the h1). */
const GUTTER = 'mx-auto block w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/** The glow behind the word; GlassMark paints the same gradient into its refraction. */
const GLOW =
  'radial-gradient(closest-side, rgba(194, 80, 10, 0.26), rgba(194, 80, 10, 0.09) 45%, rgba(194, 80, 10, 0))';

/** One headline line that slides up from behind a mask. */
function Line({
  children,
  index,
  delay,
  className,
}: {
  children: ReactNode;
  index: number;
  delay: number;
  className?: string;
}) {
  return (
    <span className={cn('block overflow-hidden pb-[0.08em]', className)}>
      <motion.span
        className="block"
        initial={{ y: '105%' }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay: delay + 0.1 + index * 0.09, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Home hero (v5, "dark luxury"): the giant word "copycats" runs edge to edge across a night
 * band, and the logo's ∼ floats in front of it in 3D: the original half polished black, the
 * copy half smoked burnt-orange glass that refracts the word. The halves drift apart and snap
 * back together (original vs copy). Without WebGL the 2D logo tile and a calm SimilarityWave
 * stand in.
 *
 * Layers: the giant word (z-0) < the 3D canvas (z-10) < every other line of text (z-20), so the
 * mark never covers the reading text or the buttons.
 */
export function HomeHero() {
  const [webglFailed, setWebglFailed] = useState(false);
  const onFail = useCallback(() => setWebglFailed(true), []);
  // When the site intro plays, the entrance waits for its curtain to lift.
  const [delay] = useState(introDelay);
  const wordRef = useRef<HTMLSpanElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-night text-cream">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          ref={glowRef}
          className="absolute top-[50%] left-1/2 aspect-square w-[130vw] max-w-[1400px] -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundImage: GLOW }}
        />
        {webglFailed && (
          // Kept behind the giant word and faded out before the reading text.
          <div className="absolute inset-x-0 top-[22%] h-[48%] opacity-70 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_60%,transparent)]">
            <SimilarityWave tone="dark" density="calm" />
          </div>
        )}
      </div>

      {!webglFailed && (
        <Suspense fallback={null}>
          <GlassMark
            anchorRef={wordRef}
            glowRef={glowRef}
            onFail={onFail}
            showAfterMs={Math.round((delay + 1.1) * 1000)}
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100"
          />
        </Suspense>
      )}

      <div className="flex flex-1 flex-col justify-center pt-14 pb-10 sm:pt-16 lg:pt-12 lg:pb-12">
        <motion.div
          className={cn(GUTTER, 'relative z-20')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay, ease: EASE }}
        >
          <Eyebrow tone="dark">Brand protection for websites, apps and trademarks</Eyebrow>
        </motion.div>

        <h1 className="mt-6 font-semibold text-cream lg:mt-4">
          <span className={cn(GUTTER, 'text-hero-line relative z-20')}>
            <Line index={0} delay={delay}>
              Find the
            </Line>
          </span>{' '}
          <span className="relative z-0 block py-2 sm:py-0">
            <Line index={1} delay={delay} className="text-giant text-center">
              <span ref={wordRef}>copycats</span>
            </Line>
            {webglFailed && (
              <LogoMark className="absolute top-1/2 left-1/2 size-auto h-[48%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_16px_40px_rgb(0_0_0/0.55)]" />
            )}
          </span>{' '}
          <span className={cn(GUTTER, 'text-hero-line relative z-20 text-right')}>
            <Line index={2} delay={delay}>
              <em className="text-accent-soft">before your customers do.</em>
            </Line>
          </span>
        </h1>

        <motion.div
          className={cn(
            GUTTER,
            'relative z-20 mt-10 flex flex-col gap-8 lg:mt-12 lg:flex-row lg:items-end lg:justify-between',
          )}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: delay + 0.55, ease: EASE }}
        >
          <p className="text-lead max-w-xl text-pretty text-cream/75">
            Similo watches the world’s new websites, apps and trademark filings for look-alikes of
            your brand, shows exactly why each one looks like you, and lets a person on your team
            decide what happens next.
          </p>
          <div className="flex shrink-0 flex-wrap gap-3">
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
      </div>
    </section>
  );
}

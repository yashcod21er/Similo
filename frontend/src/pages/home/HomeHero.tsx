import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { lazy, Suspense, useCallback, useRef, useState, type ReactNode } from 'react';
import { EASE_OUT_EXPO } from '@/components/motion/easing';
import { introDelay } from '@/components/motion/intro';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { LogoSymbol } from '@/components/ui/Logo';
import { MonoLabel, RegMarks } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';

// three.js is only downloaded on the home page, after the text is on screen.
const GlassMark = lazy(() => import('@/components/motion/GlassMark'));

/** The page gutter, as in `Container` (spans, because some sit inside the h1). */
const GUTTER = 'mx-auto block w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/** The cream canvas (`--color-cream`): GlassMark paints it behind the glass it refracts. */
const CREAM = '#f6f0e6';

/** One headline line that slides up from behind a mask and sharpens from a blur. */
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
        initial={{ y: '105%', filter: 'blur(8px)' }}
        animate={{ y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.1, delay: delay + 0.1 + index * 0.08, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Fades in after the headline (labels, lead, buttons). */
function After({
  delay,
  className,
  children,
}: {
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Home hero (v6, "Spot the difference"): figure 01 of the evidence room. On the cream canvas
 * the giant word "copycats" runs edge to edge, and the logo's ∼ floats in front of it in 3D,
 * lit like a jewel: the original half clear crystal, the copy half burnt-orange glass, both
 * refracting the word. Hairline column lines, registration marks and mono specimen labels
 * frame it like a plate in a catalogue. Without WebGL the 2D logo tile and a calm
 * SimilarityWave stand in.
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

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-cream text-ink"
    >
      {/* Scaffolding: hairline column lines at the container edges. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className={cn(GUTTER, 'relative h-full')}>
          <span className="absolute inset-y-0 left-4 w-px bg-ink/[0.08] sm:left-6 lg:left-8" />
          <span className="absolute inset-y-0 right-4 w-px bg-ink/[0.08] sm:right-6 lg:right-8" />
        </div>
        {webglFailed && (
          <div className="absolute inset-x-0 top-[26%] h-[44%] opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_60%,transparent)]">
            <SimilarityWave tone="light" density="calm" />
          </div>
        )}
      </div>

      {!webglFailed && (
        <Suspense fallback={null}>
          <GlassMark
            anchorRef={wordRef}
            background={CREAM}
            onFail={onFail}
            showAfterMs={Math.round((delay + 0.9) * 1000)}
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
          />
        </Suspense>
      )}

      <div className="flex flex-1 flex-col justify-center pt-10 pb-8 sm:pt-14 lg:pt-10 lg:pb-6">
        <After delay={delay + 0.2} className={cn(GUTTER, 'relative z-20')}>
          <div className="flex items-start justify-between gap-6 border-t border-ink/10 pt-3">
            <MonoLabel>Brand protection for websites, apps and trademarks</MonoLabel>
            <MonoLabel className="hidden text-right md:block">
              Fig. 01 <span aria-hidden>&mdash;</span> The original and the copy
            </MonoLabel>
          </div>
        </After>

        <h1
          id="home-hero-title"
          className="serif-em-accent mt-8 font-semibold text-ink sm:mt-10 lg:mt-8"
        >
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
              <LogoSymbol
                accent
                className="absolute top-1/2 left-1/2 h-[42%] w-auto -translate-x-1/2 -translate-y-1/2 text-ink drop-shadow-[0_18px_30px_rgb(21_19_15/0.25)]"
              />
            )}
          </span>{' '}
          <span className={cn(GUTTER, 'text-hero-line relative z-20 text-right')}>
            <Line index={2} delay={delay}>
              <em>before your customers do.</em>
            </Line>
          </span>
        </h1>

        <After
          delay={delay + 0.55}
          className={cn(
            GUTTER,
            'relative z-20 mt-10 flex flex-col gap-7 lg:mt-12 lg:flex-row lg:items-end lg:justify-between',
          )}
        >
          <p className="max-w-md text-[1.0625rem] leading-relaxed text-pretty text-ink/75">
            Similo watches new websites, apps and trademark filings for look-alikes of your brand,
            shows exactly what changed, and lets a person decide what happens next.
          </p>
          <div className="flex shrink-0 flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              Request a demo
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
            <a href="#check" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
              Check your brand
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </div>
        </After>
      </div>

      {/* The plate's footer: case line and a scroll cue, between registration marks. */}
      <After delay={delay + 0.8} className={cn(GUTTER, 'relative z-20 pb-5')}>
        <div className="relative flex items-center justify-between gap-4 border-t border-ink/10 pt-3">
          <RegMarks className="-top-px bottom-auto h-0 [&>span:nth-child(n+3)]:hidden" />
          <MonoLabel>
            <span className="text-ink">A</span> the original{' '}
            <span aria-hidden className="mx-1.5 text-ink/30">
              /
            </span>{' '}
            <span className="text-accent-ink">B</span> the copy
          </MonoLabel>
          <MonoLabel className="hidden sm:block">
            Scroll to inspect <span aria-hidden>&darr;</span>
          </MonoLabel>
        </div>
      </After>
    </section>
  );
}

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useMinWidth, usePrefersReducedMotion } from '@/components/motion/hooks';
import { Container, Eyebrow } from '@/components/ui/layout';
import { cn } from '@/lib/cn';
import { HeroScene } from './HeroScene';

/**
 * The product, zooming in: on large screens the section pins while you scroll and
 * the app window tilts up from the floor and grows to full size (Apple-style).
 * On phones and with reduced motion it is a normal section.
 */
export function ProductZoom() {
  const ref = useRef<HTMLElement>(null);
  const desktop = useMinWidth(1024);
  const reduced = usePrefersReducedMotion();
  const pinned = desktop && !reduced;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const scale = useTransform(scrollYProgress, [0, 0.6], [0.68, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 0.6], [26, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [80, 0]);
  const glow = useTransform(scrollYProgress, [0, 0.6], [0.15, 0.55]);
  const textOpacity = useTransform(scrollYProgress, [0.05, 0.3], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.05, 0.3], [30, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="product-zoom-title"
      className={cn('relative bg-night text-cream', pinned ? 'h-[240vh]' : 'py-20 sm:py-24')}
    >
      <div
        className={cn(
          pinned && 'sticky top-0 flex h-screen flex-col justify-center overflow-hidden',
        )}
      >
        <Container>
          <motion.div
            style={pinned ? { opacity: textOpacity, y: textY } : undefined}
            className="mx-auto max-w-3xl text-center"
          >
            <Eyebrow tone="dark" className="justify-center">
              The product
            </Eyebrow>
            <h2
              id="product-zoom-title"
              className="text-headline mt-4 font-semibold text-balance text-cream"
            >
              One alert. Every reason. <em className="text-accent-soft">Your decision.</em>
            </h2>
          </motion.div>

          <div className="relative mx-auto mt-10 max-w-5xl [perspective:1600px] lg:mt-12">
            <motion.div
              aria-hidden
              style={pinned ? { opacity: glow } : { opacity: 0.4 }}
              className="pointer-events-none absolute inset-x-[10%] -bottom-10 h-1/2 rounded-full bg-accent/40 blur-[90px]"
            />
            <motion.div
              style={pinned ? { scale, rotateX, y, transformOrigin: '50% 100%' } : undefined}
              className="relative"
            >
              <HeroScene />
            </motion.div>
          </div>
        </Container>
      </div>
    </section>
  );
}

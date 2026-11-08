import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ButtonLink } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { Container, Pill } from '@/components/ui/layout';
import { EASE_OUT } from '@/lib/motion';
import { LookalikeChecker } from './LookalikeChecker';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE_OUT, delay },
});

/**
 * Home hero: a plain promise, two actions, and the interactive brand checker
 * directly underneath, so the first thing a visitor can do is try it.
 */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Calm light canvas: dot matrix, soft coral bloom, faint crimson horizon */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="bg-dots mask-radial absolute inset-x-0 top-0 h-[900px] opacity-80" />
        <div className="absolute top-[-280px] left-1/2 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-coral/30 blur-[140px]" />
        <div className="absolute top-[520px] left-1/2 h-[420px] w-[1200px] -translate-x-1/2 rounded-full bg-crimson/10 blur-[120px]" />
      </div>

      <Container className="pt-14 text-center sm:pt-20 lg:pt-24">
        <motion.div {...rise(0)}>
          <Pill>
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-crimson motion-safe:animate-ping-slow" />
              <span className="relative size-2 rounded-full bg-crimson" />
            </span>
            Websites · Apps · Trademarks
          </Pill>
        </motion.div>

        <motion.h1
          {...rise(0.08)}
          className="text-display mx-auto mt-7 max-w-5xl font-semibold text-balance"
        >
          Find the copycats <em className="text-crimson">before</em> your customers do.
        </motion.h1>

        <motion.p
          {...rise(0.16)}
          className="text-lead mx-auto mt-6 max-w-2xl text-pretty text-muted"
        >
          Similo watches new websites, mobile apps and trademark filings for anything pretending to
          be your brand — and tells you, in plain words, why each one looks risky.
        </motion.p>

        <motion.div {...rise(0.24)} className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/contact" size="lg">
            Request a demo
            <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
          <a href="#check" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
            Check your brand
            <ArrowDown aria-hidden className="size-4" />
          </a>
        </motion.div>
      </Container>

      <Container className="pt-14 pb-20 sm:pt-16 lg:pb-28">
        <motion.div
          id="check"
          className="scroll-mt-24"
          initial={{ opacity: 0, y: 48, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.3 }}
        >
          <LookalikeChecker />
        </motion.div>
      </Container>
    </section>
  );
}

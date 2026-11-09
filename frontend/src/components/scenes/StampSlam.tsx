import { motion } from 'motion/react';
import { useRef } from 'react';
import { useInView, usePrefersReducedMotion } from '@/components/motion/hooks';
import { cn } from '@/lib/cn';

/*
 * An ink stamp that slams onto the page when it scrolls into view: it drops from large and
 * tilted, lands with a little overshoot, the page shakes for a moment and a thin ring of wet ink
 * spreads out. The ink is a rubber-stamp texture (worn, uneven) in one of three palette inks.
 * The words are real text. With reduced motion the stamp is simply there, at rest.
 */

/** Worn-ink mask: an SVG turbulence tile, thresholded, so a few pinholes and thin patches show. */
const WORN_INK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='w' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -9 6.4'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23w)'/%3E%3C/svg%3E\")";

/*
 * Contrast: the verdict is large, bold text (3:1 is enough), but the small detail line needs
 * 4.5:1, so it uses the deeper `accent-ink` on cream, and white (not cream) on the orange band.
 */
const INKS = {
  /** Burnt orange on cream or white. Darkens what lies under it, like real ink. */
  orange: { stamp: 'text-accent mix-blend-multiply', detail: 'text-accent-ink' },
  /** Near-black on cream, white or the orange band. */
  night: { stamp: 'text-ink mix-blend-multiply', detail: 'text-ink' },
  /** Cream on night or on the orange band (no blending, so it stays bright). */
  cream: { stamp: 'text-cream', detail: 'text-white' },
} as const;

export function StampSlam({
  text,
  detail,
  tone = 'orange',
  className,
}: {
  /** The verdict, e.g. `LOOKALIKE · 92`. */
  text: string;
  /** A small mono line under it, e.g. `Case 0412 · acrne.com`. */
  detail?: string;
  /** The ink: `orange` (default), `night`, or `cream` for dark and orange backgrounds. */
  tone?: keyof typeof INKS;
  /** Size it with a font-size class; everything inside scales with it. */
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(ref, { once: true, rootMargin: '0px 0px -15% 0px' });
  const landed = reduced || seen;

  return (
    <span
      ref={ref}
      className={cn(
        // The box is a full-width strip, so the stamp can come in large without making the page
        // wider (`overflow-clip` keeps the scrollable area unchanged). The padding and the equal
        // negative margin give the slam some air above and below without moving anything.
        // The default size has no weight (`:where`), so any text-size class on the stamp wins.
        'pointer-events-none -my-[1.2em] block max-w-full overflow-clip py-[1.2em] [:where(&)]:text-[clamp(1.375rem,0.9rem+1.7vw,2.375rem)]',
        INKS[tone].stamp,
        className,
      )}
    >
      <motion.span
        className="relative mx-[0.2em] inline-flex max-w-[calc(100%-0.4em)] align-top"
        animate={
          landed && !reduced ? { x: [0, -4, 5, -3, 1, 0], y: [0, 3, -2, 1, 0, 0] } : { x: 0, y: 0 }
        }
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      >
        {/* ink that spreads at the moment of impact */}
        {!reduced && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-[0.1em] rounded-[0.3em] border-[0.04em] border-current"
            initial={{ opacity: 0, scale: 1 }}
            animate={landed ? { opacity: [0, 0.5, 0], scale: [1, 1, 1.22] } : { opacity: 0 }}
            transition={{ delay: 0.16, duration: 0.7, times: [0, 0.01, 1], ease: 'easeOut' }}
            style={{ rotate: -6 }}
          />
        )}
        <motion.span
          className="relative inline-flex max-w-full flex-col items-stretch rounded-[0.22em] border-[0.085em] border-current px-[0.5em] py-[0.32em] text-center"
          initial={reduced ? false : { opacity: 0, scale: 2.2, rotate: -14 }}
          animate={
            landed ? { opacity: 1, scale: 1, rotate: -6 } : { opacity: 0, scale: 2.2, rotate: -14 }
          }
          transition={
            reduced
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.12, ease: 'easeOut' },
                  type: 'spring',
                  stiffness: 640,
                  damping: 24,
                  mass: 0.85,
                }
          }
          style={{ maskImage: WORN_INK, WebkitMaskImage: WORN_INK, maskSize: '180px 180px' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[0.07em] rounded-[0.14em] border-[0.02em] border-current"
          />
          <span className="relative text-balance text-[1em] leading-[1.05] font-black tracking-[-0.01em] uppercase">
            {text}
          </span>
          {detail && (
            <span
              className={cn(
                'relative mt-[0.45em] border-t-[0.025em] border-current pt-[0.4em] font-mono text-[0.3em] leading-[1.3] font-semibold tracking-[0.14em] uppercase',
                INKS[tone].detail,
              )}
            >
              {detail}
            </span>
          )}
        </motion.span>
      </motion.span>
    </span>
  );
}

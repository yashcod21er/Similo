import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/components/motion/hooks';
import { EASE_OUT_EXPO, ENTRANCE_DURATION, ENTRANCE_STAGGER } from '@/components/motion/easing';

/**
 * Scroll-reveal animations (v6).
 *
 * Content enters the first time it scrolls into view, on the expo curve over 700-900 ms.
 * Different things enter differently:
 * - `rise` (default): a fade and a short rise, for text, cards and rows.
 * - `blur`: blur-to-sharp, for headlines and big statements.
 * - `wipe`: a clip-path wipe, for images and framed visuals (`wipeFrom` sets the direction).
 *
 * With reduced motion every variant renders its finished state at once (no fade, no movement).
 */

const VIEWPORT = { once: true, margin: '0px 0px -10% 0px' } as const;

export type RevealVariant = 'rise' | 'blur' | 'wipe';

const WIPE_START = {
  bottom: 'inset(100% 0% 0% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  top: 'inset(0% 0% 100% 0%)',
} as const;

export type WipeFrom = keyof typeof WIPE_START;

/** The end state reaches past the box, so shadows and brackets drawn outside it are not clipped. */
const WIPE_END = 'inset(-48px -48px -48px -48px)';

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  variant = 'rise',
  wipeFrom = 'bottom',
}: {
  children: ReactNode;
  className?: string | undefined;
  delay?: number;
  y?: number;
  variant?: RevealVariant;
  /** For `wipe`: the edge the wipe starts from (the image is uncovered from there). */
  wipeFrom?: WipeFrom;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  const hidden =
    variant === 'blur'
      ? { opacity: 0, y: Math.min(y, 18), filter: 'blur(14px)' }
      : variant === 'wipe'
        ? { clipPath: WIPE_START[wipeFrom] }
        : { opacity: 0, y };
  const shown =
    variant === 'blur'
      ? { opacity: 1, y: 0, filter: 'blur(0px)' }
      : variant === 'wipe'
        ? { clipPath: WIPE_END }
        : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={VIEWPORT}
      transition={{
        duration: variant === 'wipe' ? 1.1 : ENTRANCE_DURATION,
        ease: EASE_OUT_EXPO,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: ENTRANCE_STAGGER } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_EXPO } },
};

/** Children wrapped in <RevealItem> appear one after another (about 70 ms apart). */
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

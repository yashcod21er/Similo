import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE_OUT } from '@/lib/motion';

/**
 * Scroll-reveal animations.
 *
 * Content fades and rises into place the first time it enters the viewport.
 * `<MotionConfig reducedMotion="user">` in main.tsx turns the movement off for
 * visitors who ask their OS for reduced motion (opacity still fades).
 */

const VIEWPORT = { once: true, margin: '0px 0px -10% 0px' } as const;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string | undefined;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.8, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

/** Children wrapped in <RevealItem> appear one after another. */
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
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
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

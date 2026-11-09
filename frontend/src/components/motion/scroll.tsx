import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from './hooks';

/*
 * Scroll-driven motion: smooth scrolling, word-by-word statements and parallax.
 * Every piece turns itself off with `prefers-reduced-motion`.
 */

/**
 * Smooth, gliding page scrolling (Lenis) for mouse and trackpad users. Native
 * scrolling is kept on touch screens and with reduced motion. Anchor links glide too.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 });
    return () => lenis.destroy();
  }, [reduced]);
  return null;
}

/**
 * A big statement whose words light up one by one as it scrolls into view.
 * Words listed in `highlight` are painted burnt orange. The full sentence is
 * always in the DOM (screen readers and search engines read it normally).
 */
export function ScrollWords({
  text,
  highlight = [],
  className,
}: {
  text: string;
  highlight?: string[];
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.9', 'end 0.45'] });
  const words = text.split(' ');

  return (
    <p ref={ref} className={cn('text-balance', className)}>
      {words.map((word, i) => {
        const marked = highlight.includes(word.replace(/[.,!?]/g, ''));
        const final = marked ? ACCENT : INK;
        if (reduced) {
          return (
            <span key={`${word}-${i}`} style={{ color: final }}>
              {word}{' '}
            </span>
          );
        }
        const start = i / words.length;
        return (
          <WordSlot
            key={`${word}-${i}`}
            progress={scrollYProgress}
            range={[start, start + 1 / words.length]}
            final={final}
          >
            {word}
          </WordSlot>
        );
      })}
    </p>
  );
}

/*
 * Words go from a warm grey to ink (or burnt orange). The grey still has 3.8:1
 * contrast on white, above the 3:1 WCAG minimum for text this large, so the
 * statement is readable at every moment of the animation.
 */
const DIM = '#8a8174';
const INK = '#15130f';
const ACCENT = '#c2500a';

function WordSlot({
  children,
  progress,
  range,
  final,
}: {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  final: string;
}) {
  const color = useTransform(progress, range, [DIM, final]);
  return (
    <>
      <motion.span style={{ color }}>{children}</motion.span>{' '}
    </>
  );
}

/** Moves its content a little slower than the page (depth). `strength` is in px. */
export function Parallax({
  children,
  strength = 48,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [strength, -strength]);
  return (
    <div ref={ref} className={cn('relative', className)}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

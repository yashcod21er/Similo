import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useVelocity,
} from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from './hooks';

/*
 * A giant, endless line of type. It drifts at a steady pace and reacts to the page's scroll:
 * scroll down quickly and it races ahead, scroll back up and it turns around.
 *
 * - Seamless: the content is repeated just enough times to cover the width (measured), and the
 *   offset wraps by exactly one repeat, so nothing ever jumps.
 * - Costs nothing off-screen: the frame loop returns early while the band is out of view.
 * - Reduced motion: no loop, no velocity. One static copy that wraps onto several lines, so
 *   every word stays readable.
 * - Accessible: the moving copies are `aria-hidden`; `label` is read once by screen readers.
 */

export function Marquee({
  children,
  label,
  speed = 60,
  direction = 1,
  reactivity = 0.4,
  className,
}: {
  /** One repeat of the line (words and separators). Keep it a row of inline items. */
  children: ReactNode;
  /** Plain-text version for screen readers; the visual copies are hidden from them. */
  label: string;
  /** Resting speed in px per second. */
  speed?: number;
  /** 1 moves the text left, -1 moves it right. A pair of bands with opposite signs counter-flow. */
  direction?: 1 | -1;
  /** How strongly scroll velocity (px per second) adds to the speed. 0 turns it off. */
  reactivity?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const unitWidth = useRef(0);
  const offset = useRef(0);
  const [copies, setCopies] = useState(3);

  const x = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });

  // Measure one repeat and work out how many are needed to cover the band (plus one spare).
  useLayoutEffect(() => {
    const root = rootRef.current;
    const unit = unitRef.current;
    if (!root || !unit || reduced) return;
    const measure = () => {
      unitWidth.current = unit.getBoundingClientRect().width;
      if (unitWidth.current > 0) {
        setCopies(Math.max(2, Math.ceil(root.offsetWidth / unitWidth.current) + 1));
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(unit);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) visible.current = entry.isIntersecting;
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    const width = unitWidth.current;
    if (reduced || !visible.current || width <= 0) return;
    // `delta` is in ms; cap it so a long pause (tab switch) does not teleport the text.
    const seconds = Math.min(delta, 64) / 1000;
    const pace = speed + velocity.get() * reactivity;
    offset.current = (((offset.current + direction * pace * seconds) % width) + width) % width;
    x.set(-offset.current);
  });

  if (reduced) {
    return (
      <div className={cn('overflow-hidden', className)}>
        <span className="sr-only">{label}</span>
        <div aria-hidden className="flex flex-wrap items-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn('overflow-hidden', className)}>
      <span className="sr-only">{label}</span>
      <motion.div
        aria-hidden
        style={{ x }}
        className="flex w-max items-center will-change-transform"
      >
        {Array.from({ length: copies }, (_, index) => (
          <div
            key={index}
            ref={index === 0 ? unitRef : undefined}
            className="flex shrink-0 items-center"
          >
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

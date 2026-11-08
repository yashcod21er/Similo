import { useEffect, useState, type RefObject } from 'react';
import { useInView, usePageVisible, usePrefersReducedMotion } from './hooks';

/**
 * Steps through `0 … stepCount - 1` every `intervalMs`, then starts again. Used to loop
 * product scenes (an alert arrives → scores fill → reasons appear → a person decides).
 *
 * - Pauses while the tab is hidden, and while `targetRef` (optional) is off-screen.
 * - With `prefers-reduced-motion` it returns the last step (the finished scene) and never
 *   advances, so nothing moves but all the information is there.
 *
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const step = useLoop(5, 1400, ref);
 * return <div ref={ref}>{step >= 2 && <Reason />}</div>;
 * ```
 */
export function useLoop(
  stepCount: number,
  intervalMs: number,
  targetRef?: RefObject<Element | null>,
): number {
  const reduced = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const inView = useInView(targetRef, { rootMargin: '80px' });
  const [index, setIndex] = useState(0);

  const running = !reduced && pageVisible && inView && stepCount > 1;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % stepCount);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [running, stepCount, intervalMs]);

  if (stepCount <= 0) return 0;
  if (reduced) return stepCount - 1;
  return Math.min(index, stepCount - 1);
}

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useInView, useLoop, usePrefersReducedMotion } from '@/components/motion';

/*
 * Hooks and tokens for the product scenes (components in scene-kit.tsx).
 *
 * Two ways a scene moves:
 *  - Hero scenes loop with `useSceneStep`: a step counter that pauses off-screen, in a hidden
 *    tab and with reduced motion (then it shows the finished scene).
 *  - Story panels (inside a ScrollStory) play once with `usePanelShown`: they fill in when
 *    their step becomes the one being read.
 * Everything moves with opacity and transform only.
 */

/** Window surface: a touch lighter than the dark band behind it, so the window reads as a layer. */
export const WINDOW_BODY = 'bg-[#1b1916]';

/** A looping step counter for a hero scene. Put `ref` on the scene's root element. */
export function useSceneStep(stepCount: number, intervalMs: number) {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(stepCount, intervalMs, ref);
  return { ref, step };
}

/**
 * True when a panel should show its finished state: always with reduced motion, otherwise
 * once it is on screen and (inside a ScrollStory) its step is the active one. A ScrollStory
 * marks the visuals of inactive steps `aria-hidden`, which is what this watches.
 */
export function usePanelShown(ref: RefObject<Element | null>): boolean {
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { rootMargin: '0px 0px -8% 0px' });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Start above the panel itself: a decorative panel may be `aria-hidden` on its own root.
    const host = ref.current?.parentElement?.closest('[aria-hidden]');
    if (!host) return;
    const read = () => setHidden(host.getAttribute('aria-hidden') === 'true');
    read();
    const observer = new MutationObserver(read);
    observer.observe(host, { attributes: true, attributeFilter: ['aria-hidden'] });
    return () => observer.disconnect();
  }, [ref]);

  return reduced || (inView && !hidden);
}

/**
 * Counts a number from `from` down to `to` over `durationMs` once `active` is true, and goes
 * back to `from` when it is false. With reduced motion it is `to` straight away.
 */
export function useCountdown(from: number, to: number, active: boolean, durationMs = 1400) {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduced || !active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / durationMs);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setProgress(0);
    };
  }, [reduced, active, durationMs]);

  if (reduced) return to;
  const eased = 1 - Math.pow(1 - progress, 3);
  return Math.round(from + (to - from) * eased);
}

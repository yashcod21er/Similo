/*
 * The site intro (preloader) plays once per browser-tab session, never with reduced motion.
 * The decision is made once per page load, so every component that asks gets the same answer
 * (the preloader itself, and the home hero, which waits for the curtain before its entrance).
 */

const SEEN_KEY = 'similo:intro-seen';

/** Total length of the intro, curtain included. The brief caps it at 1.2 s. */
export const INTRO_MS = 1000;

/** When the curtain starts to lift, measured from the start of the intro. */
export const INTRO_LIFT_MS = 640;

let decision: boolean | null = null;
let startedAt = 0;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** True when the intro plays on this page load (first visit in this tab, motion allowed). */
export function introPlays(): boolean {
  if (decision !== null) return decision;
  let seen: boolean;
  try {
    seen = window.sessionStorage.getItem(SEEN_KEY) === '1';
    if (!seen) window.sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked (private mode, policies): skip the intro rather than replay it forever.
    seen = true;
  }
  decision = !seen && !prefersReducedMotion();
  startedAt = typeof performance !== 'undefined' ? performance.now() : 0;
  return decision;
}

/**
 * Seconds an entrance animation on the first screen should wait so it plays while the
 * curtain lifts. 0 when there is no intro (or it is already over).
 */
export function introDelay(): number {
  if (!introPlays()) return 0;
  const remaining = INTRO_LIFT_MS + 120 - (performance.now() - startedAt);
  return Math.max(0, remaining / 1000);
}

/** Test helper: forget the decision so the next call decides again. */
export function resetIntroForTests(): void {
  decision = null;
  startedAt = 0;
}

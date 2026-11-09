import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { INTRO_LIFT_MS, INTRO_MS, introPlays } from '@/components/motion/intro';
import { MARK_COPY, MARK_ORIGINAL } from '@/components/motion/mark-paths';

/** The counter reaches 100 just before the curtain lifts. */
const COUNT_MS = INTRO_LIFT_MS - 60;

/**
 * The site intro: a night screen, a counter from 00 to 100 and the ∼ mark splitting into its
 * two halves (original and copy), then the night curtain lifts on a thin burnt-orange edge. It plays on
 * the first visit in a tab session only, never with reduced motion, and lasts about one second.
 * The page is already rendered underneath; the intro is decorative (`aria-hidden`), so screen
 * readers and keyboard focus go straight to the content.
 */
export function Preloader() {
  const [playing, setPlaying] = useState(introPlays);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - start) / COUNT_MS);
      const value = Math.round((1 - (1 - p) ** 2) * 100);
      if (counterRef.current) counterRef.current.textContent = String(value).padStart(2, '0');
      if (p < 1) frame = requestAnimationFrame(tick);
    });
    const done = window.setTimeout(() => setPlaying(false), INTRO_MS + 100);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
    };
  }, [playing]);

  if (!playing) return null;

  const lift = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });
  const split = (by: string): CSSProperties =>
    ({ '--split': by, animationDelay: `${INTRO_LIFT_MS - 300}ms` }) as CSSProperties;

  return (
    <div aria-hidden className="fixed inset-0 z-[100]" data-testid="intro">
      {/* The curtain is a little taller than the screen, so its orange edges stay off-screen
          until it moves. */}
      <div className="intro-layer curtain-panel" style={lift(INTRO_LIFT_MS)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="4.5 9 23 14" className="h-9 w-auto overflow-visible sm:h-11">
            <path className="intro-half" style={split('-2.6px')} d={MARK_ORIGINAL} fill="#f6f0e6" />
            <path className="intro-half" style={split('2.6px')} d={MARK_COPY} fill="#c2500a" />
          </svg>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-6 sm:px-8 sm:pb-8">
          <span className="text-[12.5px] font-medium tracking-[0.06em] text-cream/60 uppercase">
            Similo
          </span>
          <span
            ref={counterRef}
            className="text-[clamp(3rem,2rem+5vw,6rem)] leading-none font-semibold tracking-[-0.05em] text-cream tabular-nums"
          >
            00
          </span>
        </div>
      </div>
    </div>
  );
}

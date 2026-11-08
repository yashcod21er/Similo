import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

/*
 * Similo's signature visual. The logo's ∼ is an "o" cut on its equator with the copy half
 * slid across: an original and a near-identical copy. Here that idea becomes flowing
 * ribbons: each original ribbon (cream, or ink on light) has a burnt-orange copy that
 * follows it almost exactly, drifts slightly apart, and comes back together. Where the two
 * coincide they read as one — which is exactly what a look-alike does.
 *
 * Performance rules: one canvas, requestAnimationFrame only while visible (IntersectionObserver)
 * and while the tab is shown, device-pixel ratio capped at 2, redraws on resize
 * (ResizeObserver), one still frame with prefers-reduced-motion. `data-running` on the
 * wrapper says whether the loop is active (used by visual QA).
 */

type Tone = 'dark' | 'light';
type Density = 'calm' | 'full';

interface RibbonPair {
  /** Vertical centre as a share of the height. */
  y: number;
  /** Wave height as a share of the height. */
  amp: number;
  /** Ribbon thickness as a share of the height. */
  width: number;
  /** Number of waves across the width. */
  waves: number;
  speed: number;
  phase: number;
  /** How far the copy drifts from the original (radians of phase). */
  drift: number;
}

const PAIRS: Record<Density, RibbonPair[]> = {
  full: [
    { y: 0.62, amp: 0.13, width: 0.075, waves: 1.15, speed: 0.22, phase: 0.4, drift: 0.42 },
    { y: 0.76, amp: 0.09, width: 0.05, waves: 1.6, speed: 0.17, phase: 2.1, drift: 0.32 },
    { y: 0.45, amp: 0.07, width: 0.035, waves: 0.9, speed: 0.13, phase: 4.2, drift: 0.26 },
  ],
  calm: [
    { y: 0.6, amp: 0.12, width: 0.06, waves: 1.1, speed: 0.16, phase: 0.8, drift: 0.36 },
    { y: 0.74, amp: 0.07, width: 0.04, waves: 1.5, speed: 0.12, phase: 3.0, drift: 0.26 },
  ],
};

const STRANDS: Record<Density, number> = { full: 16, calm: 11 };

const PALETTE: Record<Tone, { original: string; copyFrom: string; copyTo: string }> = {
  // cream, accent, accent-soft
  dark: { original: '246,240,230', copyFrom: '194,80,10', copyTo: '238,138,69' },
  // ink, accent-ink, accent
  light: { original: '21,19,15', copyFrom: '158,63,0', copyTo: '194,80,10' },
};

const ALPHA: Record<Tone, { original: number; copy: number }> = {
  dark: { original: 0.42, copy: 0.72 },
  light: { original: 0.2, copy: 0.5 },
};

/** A still pose where the copy sits visibly beside the original. */
const STILL_TIME = 6.5;
const STEP_PX = 9;

function mix(from: string, to: string, amount: number): string {
  const a = from.split(',').map(Number);
  const b = to.split(',').map(Number);
  return a.map((value, i) => Math.round(value + ((b[i] ?? value) - value) * amount)).join(',');
}

export function SimilarityWave({
  tone = 'dark',
  className,
  density = 'full',
}: {
  tone?: Tone;
  className?: string;
  density?: Density;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrapper || !canvas || !ctx) return;

    const pairs = PAIRS[density];
    const strands = STRANDS[density];
    const colours = PALETTE[tone];
    const alpha = ALPHA[tone];
    const reducedQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let width = 0;
    let height = 0;
    let frame = 0;
    let inView = true;
    let originalStroke: CanvasGradient[] = [];
    let copyStroke: CanvasGradient[] = [];
    const startedAt = performance.now();
    let elapsedBeforePause = 0;
    let resumedAt = startedAt;

    /** Fades every strand in and out at the left and right edges. */
    const edgeGradient = (rgb: string, a: number) => {
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(${rgb},0)`);
      gradient.addColorStop(0.18, `rgba(${rgb},${a})`);
      gradient.addColorStop(0.82, `rgba(${rgb},${a})`);
      gradient.addColorStop(1, `rgba(${rgb},0)`);
      return gradient;
    };

    const buildStrokes = () => {
      originalStroke = [];
      copyStroke = [];
      for (let i = 0; i < strands; i++) {
        const s = i / (strands - 1); // 0 … 1 across the ribbon
        const edge = 0.35 + 0.65 * Math.abs(s - 0.5) * 2; // ribbon edges read brighter
        originalStroke.push(edgeGradient(colours.original, alpha.original * edge));
        copyStroke.push(edgeGradient(mix(colours.copyFrom, colours.copyTo, s), alpha.copy * edge));
      }
    };

    const drawRibbon = (pair: RibbonPair, t: number, offset: number, strokes: CanvasGradient[]) => {
      const k = (Math.PI * 2 * pair.waves) / width;
      const cy = pair.y * height;
      const amp = pair.amp * height;
      const thick = pair.width * height;
      const base = pair.phase + t * pair.speed + offset;
      for (let i = 0; i < strands; i++) {
        const s = i / (strands - 1) - 0.5;
        const stroke = strokes[i];
        if (!stroke) continue;
        ctx.strokeStyle = stroke;
        ctx.beginPath();
        for (let x = -STEP_PX; x <= width + STEP_PX; x += STEP_PX) {
          const envelope = 0.65 + 0.35 * Math.sin((x / width) * Math.PI);
          const y =
            cy +
            offset * thick * 0.6 +
            amp * envelope * Math.sin(k * x + base + s * 1.1) +
            s * thick * Math.cos(k * 0.5 * x + base * 0.7);
          if (x < 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.globalCompositeOperation = tone === 'dark' ? 'lighter' : 'source-over';
      for (const pair of pairs) {
        // 0 → drift → 0: the copy slides away from the original and back again.
        const apart = pair.drift * (0.5 - 0.5 * Math.cos(t * pair.speed * 1.3 + pair.phase));
        drawRibbon(pair, t, 0, originalStroke);
        drawRibbon(pair, t, apart, copyStroke);
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const now = () => (elapsedBeforePause + (performance.now() - resumedAt)) / 1000;

    const shouldRun = () =>
      !reducedQuery?.matches && inView && document.visibilityState !== 'hidden';

    const loop = () => {
      draw(now() + STILL_TIME);
      frame = requestAnimationFrame(loop);
    };

    const sync = () => {
      const run = shouldRun() && width > 0;
      const running = frame !== 0;
      if (run && !running) {
        resumedAt = performance.now();
        frame = requestAnimationFrame(loop);
      } else if (!run && running) {
        cancelAnimationFrame(frame);
        frame = 0;
        elapsedBeforePause += performance.now() - resumedAt;
      }
      wrapper.dataset.running = run ? 'true' : 'false';
    };

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.max(0, Math.round(rect.width));
      height = Math.max(0, Math.round(rect.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (width === 0 || height === 0) return;
      buildStrokes();
      // Paint right away so a paused or reduced-motion canvas is never blank.
      draw((frame === 0 ? elapsedBeforePause / 1000 : now()) + STILL_TIME);
      sync();
    };

    resize();
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(wrapper);

    const intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              inView = entry?.isIntersecting ?? true;
              sync();
            },
            { rootMargin: '60px' },
          );
    intersectionObserver?.observe(wrapper);

    document.addEventListener('visibilitychange', sync);
    reducedQuery?.addEventListener('change', sync);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reducedQuery?.removeEventListener('change', sync);
    };
  }, [tone, density]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      data-signature="similarity-wave"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
    </div>
  );
}

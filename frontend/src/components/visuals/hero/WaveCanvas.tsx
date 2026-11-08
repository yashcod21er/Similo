import { useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { useCanvasAnimation, type FrameInfo } from './useCanvasAnimation';

interface Ribbon {
  rgb: string;
  lines: number;
  amplitude: number;
  frequency: number;
  speed: number;
  spread: number;
  alpha: number;
  /** Centre line of the ribbon, as a fraction of height, for x in 0…1. */
  baseline: (x: number) => number;
  /** Horizontal fade: [x, opacity] stops for the stroke gradient. */
  fade: [number, number][];
}

/** Silk-like ribbons of thin lines; brand crimson/coral plus one cool accent. */
const RIBBONS: Ribbon[] = [
  {
    rgb: '120, 150, 220',
    lines: 22,
    amplitude: 26,
    frequency: 0.0055,
    speed: 0.32,
    spread: 2.2,
    alpha: 0.22,
    baseline: (x) => 0.9 - Math.sin(x * Math.PI) * 0.12,
    fade: [
      [0, 0],
      [0.1, 1],
      [0.45, 0.8],
      [0.7, 0],
    ],
  },
  {
    rgb: '217, 47, 72',
    lines: 30,
    amplitude: 34,
    frequency: 0.004,
    speed: -0.28,
    spread: 2.6,
    alpha: 0.36,
    baseline: (x) => 0.97 - Math.pow(x, 1.5) * 0.5,
    fade: [
      [0, 0],
      [0.25, 0.5],
      [0.7, 1],
      [1, 0.9],
    ],
  },
  {
    rgb: '233, 138, 145',
    lines: 16,
    amplitude: 22,
    frequency: 0.007,
    speed: 0.4,
    spread: 2,
    alpha: 0.18,
    baseline: (x) => 0.82 - x * 0.18,
    fade: [
      [0.2, 0],
      [0.55, 1],
      [1, 0.6],
    ],
  },
];

const STEP = 8; // px between sampled points along each line

function drawWaves(ctx: CanvasRenderingContext2D, { width, height, time }: FrameInfo) {
  ctx.lineWidth = 1;
  for (const ribbon of RIBBONS) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    for (const [stop, opacity] of ribbon.fade) {
      gradient.addColorStop(stop, `rgba(${ribbon.rgb}, ${opacity})`);
    }
    ctx.strokeStyle = gradient;
    ctx.fillStyle = gradient;

    for (let line = 0; line < ribbon.lines; line++) {
      const lineFactor = 1 - line / ribbon.lines;
      const phase = time * ribbon.speed + line * 0.11;
      const amp = ribbon.amplitude * (0.65 + 0.35 * Math.sin(line * 0.35 + time * 0.2));
      ctx.globalAlpha = ribbon.alpha * (0.35 + 0.65 * lineFactor);

      ctx.beginPath();
      for (let x = 0; x <= width + STEP; x += STEP) {
        const y =
          ribbon.baseline(x / width) * height +
          amp * Math.sin(x * ribbon.frequency + phase) +
          line * ribbon.spread;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Every third line also gets particles, for a dotted, digital texture.
      if (line % 3 === 0) {
        ctx.globalAlpha = Math.min(1, ribbon.alpha * 2.2 * lineFactor);
        for (let x = (line * 7) % 24; x <= width; x += 24) {
          const y =
            ribbon.baseline(x / width) * height +
            amp * Math.sin(x * ribbon.frequency + phase) +
            line * ribbon.spread;
          ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** Flowing particle waves behind the hero. */
export function WaveCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  useCanvasAnimation(ref, drawWaves, !reduceMotion);
  return <canvas ref={ref} aria-hidden className={cn('block', className)} />;
}

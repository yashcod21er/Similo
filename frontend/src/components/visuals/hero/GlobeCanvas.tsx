import { useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { useCanvasAnimation, type FrameInfo } from './useCanvasAnimation';

/**
 * Points spread evenly over a sphere (Fibonacci lattice), filtered by a smooth
 * pseudo-random "land" function so they form continent-like clusters.
 * Computed once when the module loads.
 */
const GLOBE_POINTS: [lat: number, lon: number][] = (() => {
  const points: [number, number][] = [];
  const total = 3200;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < total; i++) {
    const y = 1 - (i / (total - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const lat = Math.asin(y);
    const lon = Math.atan2(Math.sin(theta) * ring, Math.cos(theta) * ring);
    const land =
      Math.sin(lat * 3.1 + 0.6) * Math.cos(lon * 2.3) +
      0.6 * Math.sin(lon * 4.7 + lat * 2.1) +
      0.35 * Math.cos(lat * 7.3 - lon * 1.7);
    if (land > 0.3) points.push([lat, lon]);
  }
  return points;
})();

const TILT = 0.38; // radians: tip the globe towards the viewer

function drawGlobe(ctx: CanvasRenderingContext2D, { width, height, time }: FrameInfo) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.47;
  const rotation = time * 0.1;
  const cosTilt = Math.cos(TILT);
  const sinTilt = Math.sin(TILT);

  // Soft atmospheric glow and rim.
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.15);
  glow.addColorStop(0, 'rgba(217, 47, 72, 0.16)');
  glow.addColorStop(1, 'rgba(217, 47, 72, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  for (const [lat, lon] of GLOBE_POINTS) {
    // Rotate around the vertical axis, then tilt around the horizontal axis.
    const cosLat = Math.cos(lat);
    const x = cosLat * Math.sin(lon + rotation);
    const y = Math.sin(lat);
    const z = cosLat * Math.cos(lon + rotation);
    const tiltedY = y * cosTilt - z * sinTilt;
    const depth = y * sinTilt + z * cosTilt; // -1 (back) … 1 (front)
    if (depth < -0.2) continue;

    const alpha = depth < 0 ? 0.08 : 0.22 + 0.7 * depth;
    const size = 1.1 + 1.4 * Math.max(depth, 0);
    ctx.fillStyle = `rgba(233, 138, 145, ${alpha.toFixed(3)})`;
    ctx.fillRect(cx + x * radius - size / 2, cy - tiltedY * radius - size / 2, size, size);
  }
}

/** Slowly rotating dotted globe, drawn on a canvas. */
export function GlobeCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  useCanvasAnimation(ref, drawGlobe, !reduceMotion);
  return <canvas ref={ref} aria-hidden className={cn('block', className)} />;
}

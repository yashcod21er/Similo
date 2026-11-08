import { useEffect, type RefObject } from 'react';

export interface FrameInfo {
  width: number;
  height: number;
  /** Seconds since the animation started. */
  time: number;
}

export type DrawFn = (ctx: CanvasRenderingContext2D, frame: FrameInfo) => void;

/**
 * Runs a 2D canvas animation efficiently:
 * - sharp on high-DPI screens (capped at 2× to save GPU memory),
 * - resizes with its container,
 * - pauses when scrolled off-screen or when the tab is hidden,
 * - draws one still frame instead of animating when `animate` is false
 *   (used for visitors who prefer reduced motion).
 *
 * `draw` must be stable (defined at module level or memoised).
 */
export function useCanvasAnimation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  draw: DrawFn,
  animate: boolean,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let onScreen = true;
    const startedAt = performance.now();

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      draw(ctx, { width, height, time: (now - startedAt) / 1000 });
    };

    const loop = (now: number) => {
      render(now);
      frameId = requestAnimationFrame(loop);
    };
    const start = () => {
      if (animate && onScreen && !document.hidden && frameId === 0) {
        frameId = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!animate) render(performance.now());
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) start();
      else stop();
    });
    visibilityObserver.observe(canvas);

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (animate) start();
    else render(performance.now());

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [canvasRef, draw, animate]);
}

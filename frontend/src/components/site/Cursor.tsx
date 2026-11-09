import { useEffect, useRef } from 'react';
import { useMediaQuery, usePrefersReducedMotion } from '@/components/motion/hooks';

const INTERACTIVE = 'a[href], button, [role="button"], summary, label, select, [data-cursor]';
const TEXT_FIELD =
  'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

/**
 * A small custom cursor: a burnt-orange dot, and a thin ring that follows it with easing.
 * Over links and buttons the ring grows; over anything with `data-cursor="View"` (or a large
 * link such as a whole card) it shows that short label. Text fields keep the native I-beam.
 *
 * Only for a mouse or trackpad (`pointer: fine`) and never with reduced motion. It is purely
 * visual (`aria-hidden`, no pointer events) and never touches focus outlines. The rAF loop
 * runs only while the ring is catching up, so an idle cursor costs nothing.
 */
export function Cursor() {
  const fine = useMediaQuery('(pointer: fine)');
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!enabled || !root || !dot || !ring || !label) return;

    const html = document.documentElement;
    html.classList.add('has-custom-cursor');
    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let frame = 0;

    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      frame = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      x = event.clientX;
      y = event.clientY;
      if (root.dataset.visible !== 'true') {
        rx = x;
        ry = y;
        root.dataset.visible = 'true';
      }
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!frame) frame = requestAnimationFrame(loop);
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest(TEXT_FIELD)) {
        root.dataset.state = 'text';
        return;
      }
      const interactive = target.closest(INTERACTIVE);
      let text = target.closest('[data-cursor]')?.getAttribute('data-cursor') ?? '';
      if (!text && interactive instanceof HTMLAnchorElement) {
        // A whole card that is one link reads "Open".
        const box = interactive.getBoundingClientRect();
        if (box.width >= 240 && box.height >= 160) text = 'Open';
      }
      label.textContent = text;
      root.dataset.state = text ? 'label' : interactive ? 'link' : 'default';
    };

    const onLeave = () => {
      root.dataset.visible = 'false';
    };
    const onDown = () => {
      root.dataset.pressed = 'true';
    };
    const onUp = () => {
      root.dataset.pressed = 'false';
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointerup', onUp, { passive: true });
    html.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      html.classList.remove('has-custom-cursor');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      html.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-state="default"
      data-visible="false"
      className="group/cursor pointer-events-none fixed inset-0 z-[110] opacity-0 transition-opacity duration-200 data-[visible=true]:opacity-100 data-[state=text]:invisible"
    >
      {/* The ring (eased). The inner circle scales; the label does not. */}
      <div ref={ringRef} className="absolute top-0 left-0 will-change-transform">
        <div className="absolute size-7 -translate-1/2 rounded-full border border-accent/70 transition-[scale,background-color,border-color,opacity] duration-300 ease-out group-data-[pressed=true]/cursor:scale-90 group-data-[state=label]/cursor:scale-[2.6] group-data-[state=label]/cursor:border-accent group-data-[state=label]/cursor:bg-accent group-data-[state=link]/cursor:scale-[1.6] group-data-[state=link]/cursor:bg-accent/10 group-data-[state=text]/cursor:opacity-0" />
        <span
          ref={labelRef}
          className="absolute -translate-1/2 text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap text-white uppercase opacity-0 transition-opacity duration-200 group-data-[state=label]/cursor:opacity-100"
        />
      </div>
      {/* The dot (exact). */}
      <div ref={dotRef} className="absolute top-0 left-0 will-change-transform">
        <div className="absolute size-1.5 -translate-1/2 rounded-full bg-accent transition-opacity duration-200 group-data-[state=label]/cursor:opacity-0 group-data-[state=text]/cursor:opacity-0" />
      </div>
    </div>
  );
}

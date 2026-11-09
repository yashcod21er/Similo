import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { EASE_OUT_EXPO } from '@/components/motion/easing';
import { usePrefersReducedMotion, useInView } from '@/components/motion/hooks';
import { CornerBrackets, MonoLabel } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';

/*
 * Tracing-paper compare slider: EXHIBIT A (the original) lies under EXHIBIT B (the copy) and a
 * draggable edge wipes between them. Pointer, touch and keyboard all work. The slider position
 * is the share of the original that shows, so 100 is "only the original" and 0 is "only the
 * copy". With reduced motion it sits at 50 % and never plays the invitation sweep.
 */

const STEP = 4;
const BIG_STEP = 12;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function describe(value: number): string {
  if (value >= 100) return 'Showing only the original';
  if (value <= 0) return 'Showing only the copy';
  return `${value} percent original, ${100 - value} percent copy`;
}

export function CompareSlider({
  original,
  copy,
  originalLabel = 'Exhibit A · the original',
  copyLabel = 'Exhibit B · the copy',
  notes,
  caption,
  ariaLabel = 'Compare the original page with the copy',
  aspect = '4 / 3',
  className,
}: {
  /** Exhibit A. Fill the stage (`h-full w-full`), or use `AcmeSheet`. */
  original: ReactNode;
  /** Exhibit B, the look-alike. Draw the orange outlines inside it (`AcmeSheet annotated`). */
  copy: ReactNode;
  originalLabel?: string;
  copyLabel?: string;
  /** The differences in words, numbered under the slider (so nothing depends on hovering). */
  notes?: readonly string[];
  /** A discreet mono note, e.g. "Sample pages of a fictional brand". */
  caption?: string;
  ariaLabel?: string;
  /** CSS aspect-ratio of the stage. */
  aspect?: string;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(stageRef, { once: true, rootMargin: '0px 0px -20% 0px' });

  const position = useMotionValue(50);
  const [value, setValue] = useState(50);
  const [touched, setTouched] = useState(false);
  const [dragging, setDragging] = useState(false);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const pointer = useRef<{ id: number; touch: boolean } | null>(null);

  useMotionValueEvent(position, 'change', (latest) => setValue(Math.round(latest)));

  const clip = useTransform(position, (v) => `inset(0 0 0 ${v}%)`);
  const edge = useTransform(position, (v) => `${v}%`);

  const stopMotion = useCallback(() => {
    controls.current?.stop();
    controls.current = null;
  }, []);

  /** An invitation: the edge drifts left and right once, so both exhibits are seen. */
  useEffect(() => {
    if (reduced || !seen || touched) return;
    controls.current = animate(position, [50, 30, 68, 50], {
      duration: 2.6,
      ease: EASE_OUT_EXPO,
      delay: 0.5,
    });
    return stopMotion;
  }, [reduced, seen, touched, position, stopMotion]);

  const moveTo = useCallback(
    (next: number, smooth: boolean) => {
      stopMotion();
      setTouched(true);
      const target = clamp(next);
      if (smooth && !reduced) {
        controls.current = animate(position, target, { duration: 0.45, ease: EASE_OUT_EXPO });
      } else {
        position.set(target);
      }
    },
    [position, reduced, stopMotion],
  );

  const fromClientX = useCallback((clientX: number): number => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 50;
    return clamp(((clientX - rect.left) / rect.width) * 100);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const touch = event.pointerType === 'touch';
    pointer.current = { id: event.pointerId, touch };
    setDragging(true);
    if (!touch) {
      // A mouse or pen jumps to the press; a finger waits for a sideways move so the page
      // can still scroll vertically.
      event.currentTarget.setPointerCapture?.(event.pointerId);
      moveTo(fromClientX(event.clientX), false);
    }
    sliderRef.current?.focus({ preventScroll: true });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    moveTo(fromClientX(event.clientX), false);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? BIG_STEP : STEP;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = position.get() + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = position.get() - step;
        break;
      case 'PageUp':
        next = position.get() + BIG_STEP;
        break;
      case 'PageDown':
        next = position.get() - BIG_STEP;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 100;
        break;
    }
    if (next === null) return;
    event.preventDefault();
    moveTo(Math.round(next), true);
  };

  return (
    <figure className={cn('relative', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 shrink-0 bg-ink" />
          <MonoLabel>{originalLabel}</MonoLabel>
        </p>
        <p className="ml-auto flex items-center gap-2">
          <MonoLabel>{copyLabel}</MonoLabel>
          <span aria-hidden className="size-1.5 shrink-0 bg-accent" />
        </p>
      </div>

      <div className="relative">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            'relative w-full touch-pan-y overflow-hidden rounded-xl bg-white shadow-window ring-1 ring-ink/10 select-none',
            dragging ? 'cursor-grabbing' : 'cursor-ew-resize',
          )}
          style={{ aspectRatio: aspect }}
        >
          <div className="absolute inset-0">{original}</div>
          <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
            {copy}
          </motion.div>

          <motion.div className="pointer-events-none absolute inset-y-0 w-0" style={{ left: edge }}>
            {/* the lifted edge of the tracing paper: a hairline, a soft fold shadow */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-ink/20 to-transparent"
            />
            <span
              aria-hidden
              className="absolute inset-y-0 -left-px w-0.5 bg-cream shadow-[0_0_0_1px_rgb(21_19_15/0.55)]"
            />
            {/* registration marks where the paper meets the frame */}
            <span aria-hidden className="absolute top-2 -left-2 block size-4 text-ink/70">
              <span className="absolute top-0 left-1/2 h-full w-px bg-current" />
              <span className="absolute top-1/2 left-0 h-px w-full bg-current" />
            </span>
            <span aria-hidden className="absolute -left-2 bottom-2 block size-4 text-ink/70">
              <span className="absolute top-0 left-1/2 h-full w-px bg-current" />
              <span className="absolute top-1/2 left-0 h-px w-full bg-current" />
            </span>

            <div
              ref={sliderRef}
              role="slider"
              tabIndex={0}
              aria-label={ariaLabel}
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={describe(value)}
              onKeyDown={onKeyDown}
              className="pointer-events-auto absolute top-1/2 left-0 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full bg-night text-cream shadow-[0_6px_16px_-4px_rgb(21_19_15/0.5)] ring-2 ring-cream transition-transform duration-200 hover:scale-105 active:scale-95 active:cursor-grabbing motion-reduce:transition-none"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-6" fill="none">
                <path
                  d="M9 6.5L3.5 12 9 17.5M15 6.5l5.5 5.5-5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                aria-hidden
                className={cn(
                  'absolute inset-0 rounded-full ring-1 ring-accent-soft/70 transition-opacity duration-500',
                  touched ? 'opacity-0' : 'opacity-100',
                )}
              />
            </div>
          </motion.div>
        </div>
        <CornerBrackets className="-inset-2" />
      </div>

      <figcaption className="mt-5 flex flex-col gap-4">
        {notes && notes.length > 0 && (
          <ol className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {notes.map((note, index) => (
              <li key={note} className="flex items-start gap-3 text-sm leading-snug text-ink">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-[18px] shrink-0 place-items-center bg-accent font-mono text-[10px] font-medium text-white"
                >
                  {index + 1}
                </span>
                {note}
              </li>
            ))}
          </ol>
        )}
        <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          {caption ? <MonoLabel>{caption}</MonoLabel> : <span />}
          <MonoLabel className="hidden pointer-fine:inline">Drag the edge, or use ← →</MonoLabel>
          <MonoLabel className="pointer-fine:hidden">Drag the edge to compare</MonoLabel>
        </p>
      </figcaption>
    </figure>
  );
}

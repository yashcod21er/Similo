import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { EASE_OUT_EXPO } from '@/components/motion/easing';
import { usePrefersReducedMotion, useInView, useMinWidth } from '@/components/motion/hooks';
import { useFinePointer } from '@/components/motion/useFinePointer';
import { CornerBrackets, MonoLabel } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';

/*
 * A magnifying glass over an exhibit. `children` is the page as it is; `magnified` is the same
 * page drawn with annotations (orange outlines, numbers), shown at a larger scale inside the
 * lens. It must lay out exactly like `children` (the same markup, plus the marks).
 *
 * A mouse or pen: the lens follows the pointer with a soft lag, and glides back to its resting
 * spot when the pointer leaves. Touch: the lens rests on the point of interest and you can tap or
 * drag to move it. Keyboard: focus the exhibit and use the arrow keys. Reduced motion: the lens
 * stays on the point of interest, with the annotated view showing. Nothing is hidden behind hover.
 */

const REST = { x: 0.5, y: 0.45 };

export function Loupe({
  children,
  magnified,
  focus = REST,
  zoom = 2.2,
  description,
  hint = true,
  tone = 'light',
  aspect = '4 / 3',
  className,
}: {
  /** The exhibit as it is. It fills the stage (`h-full w-full`), or use `AcmeSheet`. */
  children: ReactNode;
  /** The same exhibit, annotated. Rendered at the size of `children`, then scaled by `zoom`. */
  magnified: ReactNode;
  /** Where the lens rests, as 0-1 fractions of the width and height. */
  focus?: { x: number; y: number };
  zoom?: number;
  /** What the lens shows, in words, for screen readers (the lens itself is decoration). */
  description?: string;
  /** Show the small "move over the exhibit" hint under it. */
  hint?: boolean;
  tone?: 'light' | 'dark';
  /** CSS aspect-ratio of the stage. */
  aspect?: string;
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const reduced = usePrefersReducedMotion();
  const fine = useFinePointer();
  const wide = useMinWidth(640);
  const seen = useInView(stageRef, { once: true, rootMargin: '0px 0px -15% 0px' });
  const radius = wide ? 88 : 56;

  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const inside = useRef(false);

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const spring = { stiffness: 260, damping: 30, mass: 0.7 };
  const smoothX = useSpring(targetX, spring);
  const smoothY = useSpring(targetY, spring);
  // Reduced motion: the lens follows its target exactly, with no lag, and never travels.
  const x: MotionValue<number> = reduced ? targetX : smoothX;
  const y: MotionValue<number> = reduced ? targetY : smoothY;

  const lensX = useTransform(x, (value) => value - radius);
  const lensY = useTransform(y, (value) => value - radius);
  const inner = useTransform(
    [x, y],
    ([px = 0, py = 0]: number[]) =>
      `translate(${radius - zoom * px}px, ${radius - zoom * py}px) scale(${zoom})`,
  );

  // Measure the exhibit, and keep the lens on its resting spot until someone moves it.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const rest = useCallback(
    (jump: boolean) => {
      if (!size) return;
      const px = size.width * focus.x;
      const py = size.height * focus.y;
      targetX.set(px);
      targetY.set(py);
      if (jump) {
        smoothX.jump(px);
        smoothY.jump(py);
      }
    },
    [size, focus.x, focus.y, targetX, targetY, smoothX, smoothY],
  );

  useEffect(() => {
    if (!inside.current) rest(true);
  }, [rest]);

  const follow = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced || !size) return;
    const rect = event.currentTarget.getBoundingClientRect();
    targetX.set(Math.min(rect.width, Math.max(0, event.clientX - rect.left)));
    targetY.set(Math.min(rect.height, Math.max(0, event.clientY - rect.top)));
  };

  const onPointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    inside.current = true;
    follow(event);
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    // A finger lifting leaves the lens where it was dropped; a mouse sends it home.
    if (event.pointerType === 'touch') return;
    inside.current = false;
    rest(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!size || reduced) return;
    const step = 0.06;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (event.key === 'Home' || event.key === 'Escape') {
      event.preventDefault();
      inside.current = false;
      rest(false);
      return;
    }
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    inside.current = true;
    targetX.set(Math.min(size.width, Math.max(0, targetX.get() + delta[0] * size.width)));
    targetY.set(Math.min(size.height, Math.max(0, targetY.get() + delta[1] * size.height)));
  };

  const ring = tone === 'dark' ? 'border-cream' : 'border-night';
  const handle = tone === 'dark' ? 'bg-cream' : 'bg-night';

  return (
    <figure className={cn('relative', className)}>
      <div className="relative">
        <div
          ref={stageRef}
          role="group"
          tabIndex={reduced ? undefined : 0}
          aria-label="Exhibit with a magnifying glass"
          aria-describedby={description ? descriptionId : undefined}
          onPointerEnter={onPointerEnter}
          onPointerMove={follow}
          onPointerDown={follow}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          className={cn(
            'relative w-full touch-pan-y overflow-hidden rounded-xl bg-white shadow-window ring-1 ring-ink/10 select-none',
            reduced ? 'cursor-default' : 'cursor-crosshair',
          )}
          style={{ aspectRatio: aspect }}
        >
          <div className="absolute inset-0">{children}</div>

          {size && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 will-change-transform"
              style={{ x: lensX, y: lensY, width: radius * 2, height: radius * 2 }}
              initial={reduced ? false : { opacity: 0, scale: 0.7 }}
              animate={seen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            >
              {/* the glass: the annotated exhibit, scaled around the lens centre */}
              <span
                className="absolute inset-0 overflow-hidden rounded-full bg-cream shadow-[0_22px_44px_-14px_rgb(21_19_15/0.55)]"
                style={{ clipPath: 'circle(50%)' }}
              >
                <motion.span
                  className="absolute top-0 left-0 block origin-top-left"
                  style={{ width: size.width, height: size.height, transform: inner }}
                  inert
                >
                  {magnified}
                </motion.span>
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 24%, rgb(255 255 255 / 0.38), transparent 38%), radial-gradient(circle at 50% 50%, transparent 62%, rgb(21 19 15 / 0.16))',
                  }}
                />
                {/* a hairline crosshair marks the exact centre */}
                <span className="absolute top-1/2 left-1/2 block size-4 -translate-x-1/2 -translate-y-1/2 text-accent">
                  <span className="absolute top-0 left-1/2 h-full w-px bg-current" />
                  <span className="absolute top-1/2 left-0 h-px w-full bg-current" />
                </span>
              </span>
              <span
                className={cn('absolute inset-0 rounded-full border-[5px]', ring)}
                style={{ boxShadow: 'inset 0 0 0 1px rgb(246 240 230 / 0.35)' }}
              />
              {/* the handle */}
              <span
                className="absolute top-1/2 left-1/2 block h-0 w-0"
                style={{ transform: 'rotate(-45deg)' }}
              >
                <span
                  className={cn('absolute -left-[6px] block h-16 w-3 rounded-full', handle)}
                  style={{ top: radius - 3 }}
                >
                  <span className="absolute inset-x-0 top-1 h-1.5 rounded-full bg-accent" />
                </span>
              </span>
              <span className="absolute bottom-[10%] left-[8%] hidden rounded-full bg-night sm:block px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-[0.1em] text-cream">
                ×{zoom}
              </span>
            </motion.div>
          )}
        </div>
        <CornerBrackets className="-inset-2" />
      </div>

      {description && (
        <p id={descriptionId} className="sr-only">
          {description}
        </p>
      )}
      {hint && (
        <figcaption className="mt-5">
          <MonoLabel>
            {reduced
              ? 'Magnified view'
              : fine
                ? 'Move over the exhibit to magnify · arrow keys work too'
                : 'Tap or drag to move the magnifier'}
          </MonoLabel>
        </figcaption>
      )}
    </figure>
  );
}

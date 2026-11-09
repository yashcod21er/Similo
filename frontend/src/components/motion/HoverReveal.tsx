import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';
import { usePrefersReducedMotion } from './hooks';
import { useFinePointer } from './useFinePointer';

/*
 * Hover image reveal for a list: while the pointer is over a row, that row's picture appears
 * beside the cursor and follows it with a soft spring (a little tilt follows how fast you move).
 *
 * - Mouse and pen only (`hover: hover` and `pointer: fine`). On touch screens nothing appears;
 *   the page shows its own thumbnails instead (see `useFinePointer`).
 * - Keyboard: focusing a row with the keyboard shows its picture next to the row.
 * - The picture is decoration. The row's text carries the meaning, so the floating image is
 *   `aria-hidden` and has an empty `alt`.
 * - Reduced motion: it still follows the pointer one to one, but without spring, tilt, zoom
 *   or fades.
 */

const WIDTH = 360;
const HEIGHT = 240;

interface Preview {
  id: string;
  src: string;
}

interface RevealApi {
  fine: boolean;
  show: (preview: Preview, at: { x: number; y: number }) => void;
  hide: (id: string) => void;
}

const RevealContext = createContext<RevealApi | null>(null);

/** Where the picture sits relative to a pointer position: to its right, kept inside the window. */
function place(x: number, y: number) {
  const left = Math.min(x + 36, window.innerWidth - WIDTH - 16);
  const top = Math.min(Math.max(y - HEIGHT / 2, 80), window.innerHeight - HEIGHT - 16);
  return { x: Math.max(16, left), y: top };
}

/** Wrap a list. It renders the floating picture; rows are `HoverRevealItem`s inside it. */
export function HoverReveal({ children }: { children: ReactNode }) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const [preview, setPreview] = useState<Preview | null>(null);
  const active = useRef(false);
  const lastHidden = useRef(0);
  const currentId = useRef<string | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 240, damping: 28, mass: 0.6 };
  const springX = useSpring(x, spring);
  const springY = useSpring(y, spring);
  const tilt = useTransform(useVelocity(springX), [-1800, 1800], [-5, 5], { clamp: true });
  const tiltSpring = useSpring(tilt, { stiffness: 200, damping: 24 });

  // Follow the pointer while a row is active (mouse and pen only).
  useEffect(() => {
    if (!fine) return;
    const onMove = (event: globalThis.PointerEvent) => {
      if (!active.current || event.pointerType === 'touch') return;
      const at = place(event.clientX, event.clientY);
      x.set(at.x);
      y.set(at.y);
      if (reduced) {
        springX.jump(at.x);
        springY.jump(at.y);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [fine, reduced, x, y, springX, springY]);

  const api = useMemo<RevealApi>(
    () => ({
      fine,
      show: (next, at) => {
        const spot = place(at.x, at.y);
        x.set(spot.x);
        y.set(spot.y);
        // After a pause start at the pointer instead of flying in from where it last was. Moving
        // straight from one row to the next keeps the spring going, so the picture glides on.
        const fresh = !active.current && performance.now() - lastHidden.current > 250;
        if (fresh || reduced) {
          springX.jump(spot.x);
          springY.jump(spot.y);
        }
        active.current = true;
        currentId.current = next.id;
        setPreview(next);
      },
      hide: (id) => {
        if (currentId.current !== id) return;
        currentId.current = null;
        active.current = false;
        lastHidden.current = performance.now();
        setPreview(null);
      },
    }),
    [fine, reduced, x, y, springX, springY],
  );

  return (
    <RevealContext.Provider value={api}>
      {children}
      {fine &&
        typeof document !== 'undefined' &&
        createPortal(
          <motion.div
            aria-hidden
            style={{
              x: reduced ? x : springX,
              y: reduced ? y : springY,
              width: WIDTH,
              height: HEIGHT,
            }}
            className="pointer-events-none fixed top-0 left-0 z-40"
          >
            <motion.div
              style={reduced ? undefined : { rotate: tiltSpring }}
              className="h-full w-full"
            >
              <AnimatePresence>
                {preview && (
                  <motion.div
                    key={preview.id}
                    initial={reduced ? false : { opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      reduced
                        ? { opacity: 0, transition: { duration: 0 } }
                        : { opacity: 0, scale: 0.94 }
                    }
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    className="absolute inset-0 overflow-hidden rounded-2xl bg-cream-deep shadow-window-dark ring-1 ring-ink/10"
                  >
                    <motion.img
                      src={preview.src}
                      alt=""
                      initial={reduced ? false : { scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1, ease: EASE_OUT }}
                      className="h-full w-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>,
          document.body,
        )}
    </RevealContext.Provider>
  );
}

/**
 * One row of the list. `src` is the picture to show (a plain image URL, e.g. the 800 px WebP).
 * Renders a `li` by default; its children are the row's real content.
 */
export function HoverRevealItem({
  id,
  src,
  children,
  className,
}: {
  id: string;
  src: string;
  children: ReactNode;
  className?: string;
}) {
  const api = useContext(RevealContext);
  const fine = api?.fine ?? false;

  // Have the picture ready before the first hover, so it never pops in half loaded.
  useEffect(() => {
    if (!fine) return;
    const timer = window.setTimeout(() => {
      const image = new Image();
      image.src = src;
    }, 400);
    return () => window.clearTimeout(timer);
  }, [fine, src]);

  const onPointerEnter = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!api?.fine || event.pointerType === 'touch') return;
      api.show({ id, src }, { x: event.clientX, y: event.clientY });
    },
    [api, id, src],
  );
  const onPointerLeave = useCallback(() => api?.hide(id), [api, id]);

  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!api?.fine || !(event.target as HTMLElement).matches(':focus-visible')) return;
      const box = event.currentTarget.getBoundingClientRect();
      api.show({ id, src }, { x: box.left + box.width * 0.55, y: box.top + box.height / 2 });
    },
    [api, id, src],
  );
  const onBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      api?.hide(id);
    },
    [api, id],
  );

  return (
    <li
      className={cn(className)}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocusCapture={onFocus}
      onBlurCapture={onBlur}
    >
      {children}
    </li>
  );
}

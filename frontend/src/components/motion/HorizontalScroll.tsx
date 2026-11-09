import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { Container } from '@/components/ui/layout';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from './hooks';

/*
 * A pinned section whose panels slide sideways as the page scrolls down.
 *
 * - Large screens (and tall enough ones): the section is as tall as the sideways distance plus
 *   one screen; a sticky, clipped viewport inside it keeps the panels in place while the track
 *   inside moves left. The clip is `overflow: clip`, so nothing in it can ever be scrolled
 *   sideways by the browser (focus, find-in-page) and the page itself never overflows.
 * - Phones, tablets, short windows and reduced motion: a plain vertical stack, in the same
 *   reading order. Nothing is hidden or moves.
 * - Keyboard: focusing a link inside a panel that is off to the side scrolls the page to the
 *   point where that panel is in view.
 */

/** Min width and height for the pinned layout; below it the panels stack. */
const PIN_QUERY = '(min-width: 1024px) and (min-height: 720px)';

function useMatches(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(query).matches === true,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export interface HorizontalPanel {
  id: string;
  /** Short name shown in the progress indicator, e.g. "Domains". */
  label: string;
  children: ReactNode;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function HorizontalScroll({
  intro,
  panels,
  labelledBy,
  className,
}: {
  /** The section's heading, shown first (left of the first panel, or above the stack). */
  intro: ReactNode;
  panels: HorizontalPanel[];
  /** `id` of the heading inside `intro`, so the section is named by it. */
  labelledBy: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const roomy = useMatches(PIN_QUERY);
  const pinned = roomy && !reduced;

  if (!pinned) {
    return (
      <section aria-labelledby={labelledBy} className={cn('py-20 lg:py-32', className)}>
        <Container>
          {intro}
          <ol className="mt-12 space-y-6 lg:mt-16 lg:space-y-8">
            {panels.map((panel) => (
              <li key={panel.id}>{panel.children}</li>
            ))}
          </ol>
        </Container>
      </section>
    );
  }

  return (
    <PinnedTrack intro={intro} panels={panels} labelledBy={labelledBy} className={className} />
  );
}

function PinnedTrack({
  intro,
  panels,
  labelledBy,
  className,
}: {
  intro: ReactNode;
  panels: HorizontalPanel[];
  labelledBy: string;
  className?: string | undefined;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const range = useMotionValue(0); // how far the track travels, in px
  // On a screen too short for the tallest panel the whole track is scaled down to fit it.
  const fit = useMotionValue(1);
  const [pinHeight, setPinHeight] = useState(0);
  const [active, setActive] = useState(0);
  const centers = useRef<number[]>([]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  // Hold still for a moment at both ends so the first and last panel rest in place.
  const eased = useTransform(scrollYProgress, (p) => clamp01((p - 0.04) / 0.92));
  const x = useTransform<number, number>([eased, range], ([t, r]) => -(t ?? 0) * (r ?? 0));

  // Measure the track: how far it must travel, and where each panel's centre is.
  useLayoutEffect(() => {
    const view = viewRef.current;
    const track = trackRef.current;
    if (!view || !track) return;
    const measure = () => {
      const style = getComputedStyle(view);
      const room =
        view.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const scale = track.offsetHeight > 0 ? Math.min(1, room / track.offsetHeight) : 1;
      fit.set(scale);
      const distance = Math.max(0, track.scrollWidth * scale - view.clientWidth);
      range.set(distance);
      setPinHeight(distance + view.clientHeight);
      centers.current = Array.from(track.querySelectorAll<HTMLElement>('[data-hpanel]')).map(
        (panel) => (panel.offsetLeft + panel.offsetWidth / 2) * scale,
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(view);
    observer.observe(track);
    return () => observer.disconnect();
  }, [range, fit, panels.length]);

  // Which module is nearest the middle of the screen (for the progress labels).
  useMotionValueEvent(eased, 'change', (t) => {
    const view = viewRef.current;
    if (!view) return;
    const middle = t * range.get() + view.clientWidth / 2;
    let best = 0;
    let bestGap = Infinity;
    // The first entry is the intro; module panels follow it.
    centers.current.slice(1).forEach((centre, index) => {
      const gap = Math.abs(centre - middle);
      if (gap < bestGap) {
        bestGap = gap;
        best = index;
      }
    });
    setActive((previous) => (previous === best ? previous : best));
  });

  // Tabbing into a panel that is off to the side: scroll the page so it slides into view.
  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const section = sectionRef.current;
      const panel = (event.target as HTMLElement).closest<HTMLElement>('[data-hpanel]');
      const distance = range.get();
      if (!section || !panel || distance <= 0) return;
      const t = clamp01((panel.offsetLeft * fit.get() - 32) / distance);
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (0.04 + t * 0.92) * distance, behavior: 'instant' });
    },
    [range, fit],
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby={labelledBy}
      style={pinHeight ? { height: pinHeight } : { height: '420vh' }}
      className={cn('relative', className)}
    >
      <div
        ref={viewRef}
        onFocusCapture={onFocus}
        className="sticky top-0 box-border flex h-screen items-center overflow-clip pt-16 pb-16 [container-type:inline-size]"
      >
        <motion.div
          ref={trackRef}
          style={{ x, scale: fit, originX: 0, originY: 0.5 }}
          className="relative flex w-max shrink-0 items-stretch gap-6 pr-[max(1rem,calc((100cqw-80rem)/2+2rem))] pl-[max(1rem,calc((100cqw-80rem)/2+2rem))] will-change-transform xl:gap-10"
        >
          <div data-hpanel className="w-[min(30rem,40cqw)] shrink-0 self-center pr-4">
            {intro}
          </div>
          {panels.map((panel) => (
            <div key={panel.id} data-hpanel className="w-[min(70rem,84cqw)] shrink-0">
              {panel.children}
            </div>
          ))}
        </motion.div>

        <Progress progress={eased} panels={panels} active={active} />
      </div>
    </section>
  );
}

/** The module names with the current one lit, and a thin line that fills as you scroll. */
function Progress({
  progress,
  panels,
  active,
}: {
  progress: MotionValue<number>;
  panels: HorizontalPanel[];
  active: number;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-6 mx-auto flex w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8"
    >
      <ol className="flex shrink-0 gap-5 font-mono text-[12.5px] whitespace-nowrap">
        {panels.map((panel, index) => (
          <li
            key={panel.id}
            className={cn(
              'transition-colors duration-300 motion-reduce:transition-none',
              index === active ? 'font-medium text-ink' : 'text-muted',
            )}
          >
            {panel.label}
          </li>
        ))}
      </ol>
      <div className="h-px flex-1 bg-line-strong/70">
        <motion.div style={{ scaleX: progress }} className="h-px origin-left bg-accent" />
      </div>
    </div>
  );
}

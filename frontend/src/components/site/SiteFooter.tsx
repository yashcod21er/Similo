import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Link } from 'react-router';
import { usePrefersReducedMotion } from '@/components/motion/hooks';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { Container } from '@/components/ui/layout';
import { Logo, LogoWordmark } from '@/components/ui/Logo';
import { useSystemStatus } from '@/features/system-status/api';
import { cn } from '@/lib/cn';
import { footerColumns } from './navigation';

/** How far the footer slides under the page sheet's rounded bottom corners (px). */
const TUCK = 32;

/** Real status from the API's health endpoint — not a decorative "Operational" label. */
function LiveStatus() {
  const { data, isError } = useSystemStatus();

  const { label, dot } = isError
    ? { label: 'API unreachable', dot: 'bg-accent-soft' }
    : !data
      ? { label: 'Checking status…', dot: 'bg-cream/40' }
      : data.status === 'ok'
        ? { label: 'All systems operational', dot: 'bg-emerald-400' }
        : data.status === 'degraded'
          ? { label: 'Partially available', dot: 'bg-amber-400' }
          : { label: 'Service disruption', dot: 'bg-accent-soft' };

  return (
    <Link
      to="/status"
      className="text-micro inline-flex items-center gap-2 text-cream/75 transition-colors duration-150 hover:text-cream"
    >
      <span className="relative flex size-2">
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping-slow',
            dot,
          )}
        />
        <span className={cn('relative size-2 rounded-full', dot)} />
      </span>
      {label}
    </Link>
  );
}

/**
 * The giant "similo" at the very bottom of the page, edge to edge. As the page sheet lifts off
 * the footer it rises out of the bottom edge (a mask) and warms from a dark tone to cream
 * (both driven by the footer's `--reveal` variable, 0 to 1, set while scrolling); it is fully
 * risen at the end of the page. A little of its base stays cropped by the edge on purpose.
 * Decorative (the logo above carries the name). Static and fully risen with reduced motion.
 */
function FooterWordmark({ reduced }: { reduced: boolean }) {
  const style: CSSProperties | undefined = reduced
    ? undefined
    : {
        transform: 'translateY(calc(108% - 101% * min(var(--reveal, 0) / 0.9, 1)))',
        color: 'color-mix(in srgb, #f6f0e6 calc(min(var(--reveal, 0) / 0.9, 1) * 100%), #35302a)',
      };
  return (
    <div aria-hidden className="mx-auto max-w-[120rem] overflow-hidden">
      <div
        style={style}
        className={cn(
          'px-1 will-change-transform sm:px-2',
          reduced && 'translate-y-[7%] text-cream',
        )}
      >
        <LogoWordmark />
      </div>
    </div>
  );
}

/**
 * Footer as a sheet (v6). The page (`<main>`, with rounded bottom corners and a long soft
 * shadow) lifts off a dark footer that waits underneath. On large screens, when the footer
 * fits in the window, the footer is `sticky` to the bottom edge behind the page, so scrolling
 * to the end uncovers it from the bottom up (the wordmark rises as it is uncovered). On phones,
 * short windows and with reduced motion it is an ordinary footer that tucks under the same
 * rounded corners.
 */
export function SiteFooter({ mainRef }: { mainRef: RefObject<HTMLElement | null> }) {
  const footerRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [sheet, setSheet] = useState(false);

  // Choose sheet mode: wide screen, motion allowed, and the footer fits inside the window.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const measure = () => {
      const wide = window.matchMedia('(min-width: 1024px)').matches;
      setSheet(!reduced && wide && footer.offsetHeight <= window.innerHeight);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(footer);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [reduced]);

  // Reveal progress: how much of the footer the page sheet has uncovered (0 to 1).
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || reduced) return;
    const update = () => {
      const main = mainRef.current;
      if (!main) return;
      const room = Math.max(footer.offsetHeight - TUCK, 1);
      const uncovered = window.innerHeight - main.getBoundingClientRect().bottom;
      const value = Math.min(1, Math.max(0, uncovered / room));
      footer.style.setProperty('--reveal', value.toFixed(3));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [mainRef, reduced]);

  // A footer link that is still covered by the page must not take keyboard focus unseen.
  function revealOnFocus() {
    if (sheet) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  }

  return (
    <footer
      ref={footerRef}
      onFocusCapture={revealOnFocus}
      style={{ marginTop: -TUCK, paddingTop: TUCK }}
      className={cn(
        'relative isolate overflow-hidden bg-night-raised text-cream',
        sheet && 'sticky bottom-0 z-0',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-2/3 [mask-image:linear-gradient(to_top,black_10%,transparent)] sm:block"
      >
        <SimilarityWave tone="dark" density="calm" className="opacity-35" />
      </div>

      <Container className="grid grid-cols-1 gap-12 pt-16 pb-14 lg:grid-cols-[1fr_2fr] lg:pt-20 lg:pb-20">
        <div className="max-w-xs">
          <Link to="/" aria-label="Similo home" className="inline-block">
            <Logo tone="dark" />
          </Link>
          <p className="mt-6 text-[14.5px] leading-relaxed text-cream/70">
            Similo finds websites, apps and trademarks that copy your brand, and helps your team act
            on the evidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title} className="border-t border-cream/15 pt-4">
              <p className="text-micro text-accent-soft">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[14.5px] text-cream/75 transition-colors duration-150 hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-cream/10">
        <Container className="flex flex-col gap-3 py-5 text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-micro">
            © {new Date().getFullYear()} Similo. Product visuals use illustrative sample data.
          </p>
          <LiveStatus />
        </Container>
      </div>

      <FooterWordmark reduced={reduced} />
    </footer>
  );
}

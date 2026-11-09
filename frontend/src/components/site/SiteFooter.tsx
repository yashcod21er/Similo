import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router';
import { usePrefersReducedMotion } from '@/components/motion/hooks';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { Container } from '@/components/ui/layout';
import { Logo, LogoWordmark } from '@/components/ui/Logo';
import { useSystemStatus } from '@/features/system-status/api';
import { cn } from '@/lib/cn';
import { footerColumns } from './navigation';

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
      className="inline-flex items-center gap-2 text-[13px] text-cream/75 transition-colors hover:text-cream"
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
 * The giant "similo" at the very bottom of the page, edge to edge. As the footer scrolls into
 * view it rises out of the page's bottom edge (a mask) and warms from a dark tone to cream; it
 * is fully risen when you reach the end of the page. A little of its base stays cropped by the
 * edge on purpose. Decorative (the logo above carries the name); static with reduced motion.
 */
function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const y = useTransform(scrollYProgress, [0, 0.9], ['108%', '7%']);
  const color = useTransform(scrollYProgress, [0.1, 0.9], ['#2b2824', '#f6f0e6']);

  return (
    <div ref={ref} aria-hidden className="mx-auto max-w-[120rem] overflow-hidden">
      <motion.div
        style={reduced ? undefined : { y, color }}
        className={cn('px-1 sm:px-2', reduced && 'translate-y-[7%] text-cream')}
      >
        <LogoWordmark />
      </motion.div>
    </div>
  );
}

/**
 * Dark footer (v4): night, with the signature wave faint along the bottom edge, the logo,
 * the link columns and the real status indicator.
 */
export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-night text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-2/3 [mask-image:linear-gradient(to_top,black_10%,transparent)] sm:block"
      >
        <SimilarityWave tone="dark" density="calm" className="opacity-45" />
      </div>

      <Container className="grid grid-cols-1 gap-12 pt-16 pb-14 lg:grid-cols-[1fr_2fr] lg:pt-20 lg:pb-20">
        <div className="max-w-xs">
          <Link to="/" aria-label="Similo home" className="inline-block">
            <Logo tone="dark" />
          </Link>
          <p className="mt-5 text-[14.5px] leading-relaxed text-cream/70">
            Similo finds websites, apps and trademarks that copy your brand, and helps your team act
            on the evidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-[12.5px] font-medium tracking-[0.06em] text-accent-soft uppercase">
                {column.title}
              </p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[14.5px] text-cream/75 transition-colors hover:text-cream"
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
        <Container className="flex flex-col gap-3 py-5 text-[13px] text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Similo. Product visuals use illustrative sample data.</p>
          <LiveStatus />
        </Container>
      </div>

      <FooterWordmark />
    </footer>
  );
}

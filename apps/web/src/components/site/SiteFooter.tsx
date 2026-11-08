import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/layout';
import { Logo, LogoWordmark } from '@/components/ui/Logo';
import { useSystemStatus } from '@/features/system-status/api';
import { cn } from '@/lib/cn';
import { footerColumns } from './navigation';

/** Real status from the API's health endpoint — not a decorative "Operational" label. */
function LiveStatus() {
  const { data, isError } = useSystemStatus();

  const { label, dot } = isError
    ? { label: 'API unreachable', dot: 'bg-crimson' }
    : !data
      ? { label: 'Checking status…', dot: 'bg-line-strong' }
      : data.status === 'ok'
        ? { label: 'All systems operational', dot: 'bg-emerald-500' }
        : data.status === 'degraded'
          ? { label: 'Partially available', dot: 'bg-amber-500' }
          : { label: 'Service disruption', dot: 'bg-crimson' };

  return (
    <Link
      to="/status"
      className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-[13px] text-muted ring-1 ring-line transition-colors hover:text-ink"
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

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-white">
      <Container className="pt-16 lg:pt-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 leading-relaxed text-muted">
              Similo finds websites, apps and trademarks that copy your brand, explains why each one
              looks risky, and helps your team act on the evidence.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink to="/contact" size="sm" variant="dark">
                Request a demo
              </ButtonLink>
              <LiveStatus />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-[13px] font-semibold tracking-[-0.01em] text-ink">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1 text-[14.5px] text-muted transition-colors hover:text-ink"
                      >
                        {link.label}
                        <ArrowUpRight
                          aria-hidden
                          className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Oversized custom wordmark (never re-typed in a font) fading into the page edge. */}
      <Container>
        <LogoWordmark className="mt-16 mb-2 text-ink/[0.09] select-none mask-fade-b" />
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Similo</p>
          <p>Product visuals on this site use illustrative sample data.</p>
        </Container>
      </div>
    </footer>
  );
}

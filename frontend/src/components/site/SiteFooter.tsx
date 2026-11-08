import { Link } from 'react-router';
import { Container } from '@/components/ui/layout';
import { Logo } from '@/components/ui/Logo';
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
      className="inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-ink"
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
    <footer className="border-t border-line bg-white">
      <Container className="grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1fr_2fr] lg:py-16">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
            Similo finds websites, apps and trademarks that copy your brand, and helps your team act
            on the evidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-[13px] font-semibold text-ink">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[14.5px] text-muted transition-colors hover:text-ink"
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

      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Similo. Product visuals use illustrative sample data.</p>
          <LiveStatus />
        </Container>
      </div>
    </footer>
  );
}

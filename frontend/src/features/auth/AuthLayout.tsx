import { ArrowLeft, Check } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { Link, Outlet, ScrollRestoration } from 'react-router';
import { AppWindow } from '@/components/motion/AppWindow';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { useLoop } from '@/components/motion/useLoop';
import { ExampleTag } from '@/components/ui/layout';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

/* ------------------------------------------------- Side panel scene */

/** The three signals behind one alert. Sample values for the fictional brand "Acme". */
const SIGNALS = [
  { label: 'Text similarity', value: 82 },
  { label: 'Visual similarity', value: 74 },
  { label: 'Meaning', value: 69 },
] as const;

/**
 * A small product scene: an alert arrives, its three signals fill one by one, a reason
 * appears and a person decides. It loops while visible; with reduced motion it shows the
 * finished scene. Illustrative: the brand is the fictional "Acme".
 */
function AuthScene() {
  const ref = useRef<HTMLDivElement>(null);
  // 0 alert, 1-3 the signals fill, 4 the reason and the decision
  const step = useLoop(6, 1300, ref);
  const finished = step >= 4;

  return (
    <div ref={ref} className="w-full max-w-md">
      <AppWindow tone="dark" url="app.similo.example/alerts" title={<ExampleTag />}>
        <div className="space-y-5 p-5">
          <div>
            <p className="text-[12.5px] font-medium tracking-[0.06em] text-accent-soft uppercase">
              New look-alike website
            </p>
            <p className="mt-2 font-mono text-[1.375rem] font-medium text-cream">acme-login.com</p>
            <p className="mt-1 text-[13px] text-cream/70">Found 4 minutes ago · matches acme.com</p>
          </div>

          <ul className="space-y-3.5">
            {SIGNALS.map((signal, index) => {
              const filled = step > index;
              return (
                <li key={signal.label}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-cream/80">{signal.label}</span>
                    <span
                      className={cn(
                        'font-mono tabular-nums transition-opacity duration-500',
                        filled ? 'text-cream opacity-100' : 'opacity-0',
                      )}
                    >
                      {signal.value}%
                    </span>
                  </div>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-cream/10">
                    <span
                      className="block h-full origin-left rounded-full bg-accent-soft transition-transform duration-700 ease-out motion-reduce:transition-none"
                      style={{ transform: `scaleX(${filled ? signal.value / 100 : 0})` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            className={cn(
              'space-y-3 border-t border-cream/10 pt-4 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
              finished ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
            )}
          >
            <p className="text-[13.5px] leading-snug text-cream/80">
              Adds the extra word login to your name and was registered 2 days ago.
            </p>
            <p className="inline-flex items-center gap-2 rounded-lg bg-cream/[0.07] px-3 py-2 text-[13px] font-medium text-cream ring-1 ring-cream/10">
              <Check aria-hidden className="size-4 text-accent-soft" />
              Reviewer decision: needs review
            </p>
          </div>
        </div>
      </AppWindow>
    </div>
  );
}

/**
 * Focused layout for sign-in, sign-up and invitations: no marketing navigation.
 * On large screens a dark panel with the Similo wave and a small product scene fills the
 * right side; on phones the form has the whole screen.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-cream lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="flex min-w-0 flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>

        <header className="flex items-center justify-between px-4 py-5 sm:px-8">
          <Link to="/" aria-label="Similo home">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Back to website
          </Link>
        </header>

        <main
          id="main"
          className="flex flex-1 justify-center px-4 pt-4 pb-16 sm:items-center sm:pt-0"
        >
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>

        <footer className="px-4 pb-6 text-center text-[13px] text-muted">
          © {new Date().getFullYear()} Similo ·{' '}
          <Link to="/status" className="hover:text-ink">
            System status
          </Link>
        </footer>
      </div>

      {/* Decorative panel: the wave and an illustrative alert (hidden from assistive tech). */}
      <div aria-hidden className="relative hidden overflow-hidden bg-night text-cream lg:block">
        <SimilarityWave tone="dark" density="full" className="opacity-80" />
        <div
          className="absolute inset-0 bg-linear-to-b from-night/70 via-night/20 to-night/70"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-center gap-10 px-10 py-16 xl:px-16">
          <p className="text-statement serif-em max-w-md font-semibold text-balance text-cream">
            Every alert comes with its <em className="text-accent-soft">reasons.</em>
          </p>
          <AuthScene />
        </div>
      </div>
      <ScrollRestoration />
    </div>
  );
}

/** The white card every auth page sits in. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-line sm:p-9">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-[14px] text-muted">{footer}</div>}
    </>
  );
}

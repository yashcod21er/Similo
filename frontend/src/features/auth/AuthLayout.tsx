import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Outlet, ScrollRestoration } from 'react-router';
import { Photo } from '@/components/ui/Photo';
import { Logo } from '@/components/ui/Logo';

/**
 * Focused layout for sign-in, sign-up and invitations: no marketing navigation.
 * On large screens a calm photo fills the right side; on phones the form has
 * the whole screen.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-paper lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="flex min-w-0 flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-crimson px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
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

      {/* Decorative photo (alt is empty on purpose). */}
      <div aria-hidden className="relative hidden bg-card lg:block">
        <div className="absolute inset-0">
          <Photo
            src="/images/core/window-laptop"
            alt=""
            width={1600}
            height={2000}
            sizes="45vw"
            className="object-[60%_30%]"
          />
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
      <div className="rounded-xl bg-white p-6 ring-1 ring-line sm:p-9">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-[14px] text-muted">{footer}</div>}
    </>
  );
}

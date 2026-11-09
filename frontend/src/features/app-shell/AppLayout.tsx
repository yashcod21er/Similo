import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { useCan, useSession, useSignOut, type Permission } from '@/features/auth/api';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { EASE_OUT } from '@/lib/motion';

const NAV: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  permission?: Permission;
}[] = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/brands', label: 'Brands', icon: ShieldCheck, permission: 'brands:read' },
  { to: '/app/findings', label: 'Findings', icon: TriangleAlert, permission: 'findings:read' },
  { to: '/app/members', label: 'Members', icon: Users },
  { to: '/app/audit', label: 'Audit log', icon: ScrollText, permission: 'audit:read' },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: me } = useSession();
  const can = useCan();
  const signOut = useSignOut();
  const navigate = useNavigate();
  if (!me) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link to="/app" aria-label="Similo dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <div className="mx-3 rounded-2xl bg-cream px-4 py-3 ring-1 ring-line">
        <p className="truncate text-[14px] font-semibold">{me.organization.name}</p>
        <p className="mt-0.5 text-[12.5px] text-muted">Your role: {me.roleLabel}</p>
      </div>

      <nav aria-label="Dashboard" className="mt-5 flex-1 px-3">
        <ul className="space-y-1">
          {NAV.filter((item) => !item.permission || can(item.permission)).map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end ?? false}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-ink/[0.06] text-ink'
                      : 'text-ink/70 hover:bg-ink/[0.04] hover:text-ink',
                  )
                }
              >
                <item.icon aria-hidden className="size-[18px]" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[13px] font-semibold text-accent-ink"
          >
            {initials(me.user.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">{me.user.name}</p>
            <p className="truncate text-[12.5px] text-muted">{me.user.email}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={signOut.isPending}
          onClick={() =>
            signOut.mutate(undefined, { onSettled: () => navigate('/sign-in', { replace: true }) })
          }
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-ink/70 hover:bg-ink/[0.04] hover:text-ink disabled:opacity-60"
        >
          <LogOut aria-hidden className="size-[18px]" />
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </button>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium text-ink/70 hover:bg-ink/[0.04] hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-[18px]" />
          Back to website
        </Link>
      </div>
    </div>
  );
}

/** The signed-in workspace: sidebar on large screens, slide-in menu on phones. */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the phone menu whenever the page changes.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-cream">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <Link to="/app" aria-label="Similo dashboard">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-label="Open menu"
          className="inline-flex size-10 items-center justify-center rounded-full hover:bg-ink/[0.05]"
        >
          <Menu aria-hidden className="size-5" />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-night/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-stage"
            >
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="absolute top-4 right-3 inline-flex size-9 items-center justify-center rounded-full hover:bg-ink/[0.05]"
              >
                <X aria-hidden className="size-4" />
              </button>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main id="main" className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-12">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </div>
  );
}

/** Title row used at the top of every dashboard page. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[2rem]">
          {title}
        </h1>
        {description && <p className="mt-2 text-[15px] text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

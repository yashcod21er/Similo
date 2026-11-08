import { ArrowRight, ChevronDown, Menu, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/layout';
import { Logo } from '@/components/ui/Logo';
import { useSession } from '@/features/auth/api';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { CommandMenu } from './CommandMenu';
import { isMenu, primaryNav, type NavMenu } from './navigation';

/* ------------------------------------------------------------ Dropdown */

function DropdownPanel({ menu, onNavigate }: { menu: NavMenu; onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className={cn(
        'absolute top-full left-0 z-50 pt-2',
        menu.items.length > 2 ? 'w-[680px]' : 'w-[560px]',
      )}
    >
      <div className="grid grid-cols-[1fr_210px] gap-2 rounded-xl bg-white p-2 shadow-soft ring-1 ring-line">
        <ul className="grid content-start gap-0.5">
          {menu.items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-cream"
              >
                <item.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                <span>
                  <span className="block text-[15px] font-medium text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-[13.5px] leading-snug text-muted">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {menu.featured && (
          <Link
            to={menu.featured.to}
            onClick={onNavigate}
            className="group flex flex-col rounded-lg bg-cream p-4 transition-colors hover:bg-cream-deep/70"
          >
            <span className="text-[13px] font-medium text-accent-ink">
              {menu.featured.eyebrow}
            </span>
            <span className="mt-2 text-[15px] leading-snug font-semibold tracking-[-0.01em]">
              {menu.featured.title}
            </span>
            <span className="mt-1.5 text-[13.5px] leading-snug text-muted">
              {menu.featured.description}
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium">
              {menu.featured.cta}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function DesktopNav() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const open = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  // A short delay stops the menu flickering shut when the pointer crosses the gap.
  const scheduleClose = () => {
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  const linkClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1 rounded-md px-3 py-2 text-[14.5px] font-medium transition-colors',
      active ? 'text-ink' : 'text-ink/70 hover:text-ink',
    );

  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {primaryNav.map((entry) =>
        isMenu(entry) ? (
          <li
            key={entry.label}
            className="relative"
            onPointerEnter={() => open(entry.label)}
            onPointerLeave={scheduleClose}
          >
            <button
              type="button"
              aria-expanded={openMenu === entry.label}
              onClick={() => setOpenMenu(openMenu === entry.label ? null : entry.label)}
              className={linkClass(
                openMenu === entry.label ||
                  entry.items.some((item) => location.pathname.startsWith(item.to)),
              )}
            >
              {entry.label}
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-3.5 transition-transform duration-150',
                  openMenu === entry.label && 'rotate-180',
                )}
              />
            </button>
            <AnimatePresence>
              {openMenu === entry.label && (
                <DropdownPanel menu={entry} onNavigate={() => setOpenMenu(null)} />
              )}
            </AnimatePresence>
          </li>
        ) : (
          <li key={entry.label}>
            <NavLink to={entry.to} className={({ isActive }) => linkClass(isActive)}>
              {entry.label}
            </NavLink>
          </li>
        ),
      )}
    </ul>
  );
}

/* --------------------------------------------------------------- Mobile */

function MobileNav({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto border-t border-line bg-white lg:hidden"
    >
      <nav aria-label="Mobile" className="flex min-h-full flex-col px-4 py-4 sm:px-6">
        {primaryNav.map((entry) =>
          isMenu(entry) ? (
            <div key={entry.label} className="border-b border-line pb-3 not-first:pt-4">
              <p className="text-[13px] font-medium text-muted">{entry.label}</p>
              <ul className="mt-1">
                {entry.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg py-2.5"
                    >
                      <item.icon aria-hidden className="size-5 shrink-0 text-accent" />
                      <span>
                        <span className="block font-medium">{item.label}</span>
                        <span className="block text-[13px] text-muted">{item.description}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Link
              key={entry.label}
              to={entry.to}
              onClick={onClose}
              className="block border-b border-line py-4 text-[17px] font-medium"
            >
              {entry.label}
            </Link>
          ),
        )}
        <div className="mt-auto grid gap-3 pt-8">
          <ButtonLink to="/contact" onClick={onClose} size="lg">
            Request a demo
          </ButtonLink>
          <ButtonLink to="/#check" onClick={onClose} variant="outline" size="lg">
            Check your brand
          </ButtonLink>
          <AccountLink mobile onNavigate={onClose} />
        </div>
      </nav>
    </motion.div>
  );
}

/* -------------------------------------------------------------- Account */

/** "Sign in" for visitors; "Dashboard" once signed in (the API decides, via /auth/me). */
function AccountLink({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { data: me } = useSession();
  const to = me ? '/app' : '/sign-in';
  if (mobile) {
    return (
      <ButtonLink to={to} onClick={onNavigate} variant="outline" size="lg">
        {me ? 'Open dashboard' : 'Sign in'}
      </ButtonLink>
    );
  }
  return (
    <Link
      to={to}
      className="hidden h-9 items-center rounded-md px-3 text-[14.5px] font-medium text-ink/70 transition-colors hover:text-ink md:inline-flex"
    >
      {me ? 'Dashboard' : 'Sign in'}
    </Link>
  );
}

/* --------------------------------------------------------------- Header */

/**
 * Plain sticky header: logo, navigation, search, sign in, one call to action.
 * It looks the same on every page and only gains a hairline once scrolled.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const shortcut = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ⌘K / Ctrl K toggles search; "/" opens it unless the visitor is typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close the mobile menu whenever the page changes (e.g. browser back button).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-white/95 backdrop-blur transition-colors duration-200',
          scrolled || mobileOpen ? 'border-line' : 'border-transparent',
        )}
      >
        <Container>
          <nav aria-label="Main" className="flex h-16 items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link to="/" aria-label="Similo home" className="shrink-0">
                <Logo />
              </Link>
              <DesktopNav />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search the site"
                className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink sm:border sm:border-line sm:pr-2 sm:pl-3"
              >
                <Search aria-hidden className="size-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden rounded bg-cream px-1.5 py-0.5 font-mono text-[10.5px] ring-1 ring-line sm:inline">
                  {shortcut}
                </kbd>
              </button>
              <AccountLink />
              {/* Wrapper controls visibility; putting `hidden` on the button itself would
                  clash with the button's own `inline-flex` display class. */}
              <div className="hidden sm:block">
                <ButtonLink to="/contact" size="sm">
                  Request a demo
                </ButtonLink>
              </div>
              <button
                type="button"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex size-10 items-center justify-center rounded-md text-ink hover:bg-ink/[0.05] lg:hidden"
              >
                {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </nav>
        </Container>
      </header>
      <AnimatePresence>{mobileOpen && <MobileNav onClose={closeMobile} />}</AnimatePresence>
      <CommandMenu open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

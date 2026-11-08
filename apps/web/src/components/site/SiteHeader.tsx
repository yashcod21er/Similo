import { ArrowRight, ChevronDown, Menu, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { CommandMenu } from './CommandMenu';
import { isMenu, primaryNav, type NavMenu } from './navigation';

/* ------------------------------------------------------------ Dropdown */

function DropdownPanel({ menu, onNavigate }: { menu: NavMenu; onNavigate: () => void }) {
  const wide = menu.items.length > 2;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={cn(
        'absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3',
        wide ? 'w-[780px]' : 'w-[600px]',
      )}
    >
      <div className="grid origin-top grid-cols-[1fr_230px] gap-2 rounded-3xl bg-white p-2 shadow-stage ring-1 ring-line">
        <ul className={cn('grid content-start gap-1 p-1', wide && 'grid-cols-2')}>
          {menu.items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className="group flex gap-3.5 rounded-2xl p-3 transition-colors hover:bg-paper"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line transition-colors group-hover:bg-crimson group-hover:text-white group-hover:ring-crimson">
                  <item.icon aria-hidden className="size-[18px]" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold tracking-[-0.01em] text-ink">
                    {item.label}
                  </span>
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
            className="group relative isolate flex flex-col overflow-hidden rounded-2xl bg-midnight p-5 text-white"
          >
            <div aria-hidden className="bg-dots-dark absolute inset-0 -z-10 opacity-60" />
            <div
              aria-hidden
              className="absolute -right-10 -bottom-12 -z-10 size-40 rounded-full bg-crimson/50 blur-3xl transition-transform duration-500 group-hover:scale-125"
            />
            <span className="font-mono text-[11px] tracking-[0.08em] text-coral uppercase">
              {menu.featured.eyebrow}
            </span>
            <span className="mt-3 text-lg leading-snug font-semibold tracking-[-0.02em]">
              {menu.featured.title}
            </span>
            <span className="mt-2 text-[13.5px] leading-snug text-white/60">
              {menu.featured.description}
            </span>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium">
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
      'inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[14.5px] font-medium tracking-[-0.01em] transition-colors',
      active ? 'bg-ink/[0.05] text-ink' : 'text-ink/70 hover:text-ink',
    );

  return (
    <ul className="hidden items-center gap-0.5 lg:flex">
      {primaryNav.map((entry) =>
        isMenu(entry) ? (
          <li
            key={entry.label}
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
                  'size-3.5 transition-transform duration-200',
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
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: EASE_OUT }}
      className="fixed inset-x-3 top-[76px] bottom-3 z-40 origin-top overflow-y-auto rounded-3xl bg-white shadow-stage ring-1 ring-line lg:hidden"
    >
      <nav aria-label="Mobile" className="flex min-h-full flex-col p-5">
        {primaryNav.map((entry) =>
          isMenu(entry) ? (
            <div key={entry.label} className="border-b border-line pb-4 not-first:pt-4">
              <p className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
                {entry.label}
              </p>
              <ul className="mt-2">
                {entry.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl py-2.5"
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-paper text-crimson-dark ring-1 ring-line">
                        <item.icon aria-hidden className="size-4" />
                      </span>
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
        </div>
      </nav>
    </motion.div>
  );
}

/* --------------------------------------------------------------- Header */

/**
 * Floating "island" header. It stays the same on every page, so nothing
 * depends on what is underneath it, and gains a firmer shadow once scrolled.
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
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
        <nav
          aria-label="Main"
          className={cn(
            'relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full border pr-2 pl-4 transition-[background-color,box-shadow,border-color] duration-300 sm:pl-5',
            scrolled || mobileOpen
              ? 'border-line bg-white/85 shadow-lifted backdrop-blur-xl'
              : 'border-line/70 bg-white/60 shadow-soft backdrop-blur-md',
          )}
        >
          <Link to="/" aria-label="Similo home" className="shrink-0">
            <Logo />
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the site"
              className="inline-flex h-9 items-center gap-2 rounded-full px-2.5 text-sm text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink sm:border sm:border-line sm:bg-white sm:pr-2 sm:pl-3"
            >
              <Search aria-hidden className="size-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded-md bg-paper px-1.5 py-0.5 font-mono text-[10.5px] ring-1 ring-line sm:inline">
                {shortcut}
              </kbd>
            </button>
            {/* Wrapper controls visibility; putting `hidden` on the button itself would
                clash with the button's own `inline-flex` display class. */}
            <div className="hidden sm:block">
              <ButtonLink to="/contact" size="sm" variant="dark">
                Request a demo
              </ButtonLink>
            </div>
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-ink/[0.05] lg:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
      </header>
      <AnimatePresence>{mobileOpen && <MobileNav onClose={closeMobile} />}</AnimatePresence>
      <CommandMenu open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

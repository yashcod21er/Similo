import { ArrowRight, ChevronDown, Menu, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/layout';
import { Logo } from '@/components/ui/Logo';
import { useSession } from '@/features/auth/api';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { CommandMenu } from './CommandMenu';
import { NavPreview } from './NavPreviews';
import { isMenu, primaryNav, type NavFeature, type NavMenu } from './navigation';

/* ------------------------------------------------------- Header colour */

/**
 * The header takes the colour of whatever the page starts with: night over a dark hero,
 * cream or white over a light one, so the two read as one surface at the top of the page.
 * Once the page scrolls, the header turns into a solid cream bar. Reading the colour from
 * the page (instead of each page declaring it) keeps every page, including ones owned by
 * other people, working without changes.
 */
interface TopBackground {
  color: string;
  dark: boolean;
}

const LIGHT_TOP: TopBackground = { color: 'rgb(246 240 230)', dark: false };
const SCROLLED_BACKGROUND = 'rgb(246 240 230 / 0.96)';
const NIGHT_BACKGROUND = 'rgb(18 17 15)';

let probe: CanvasRenderingContext2D | null | undefined;

/** Converts any CSS colour (rgb, oklab, color-mix...) to 8-bit RGBA through a 1 px canvas. */
function toRgba(color: string): [number, number, number, number] | null {
  if (probe === undefined) {
    probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const data = probe.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0, data[3] ?? 0];
}

/**
 * The colour of the page's first section as one string, "rgb(r g b)|dark" or "...|light".
 * A string (not an object) so `useSyncExternalStore` can compare snapshots by value.
 */
function readTopBackgroundKey(): string {
  /** First child that is part of the page flow (skips fixed or absolute decorations). */
  const firstInFlow = (parent: Element): Element | null =>
    Array.from(parent.children).find((child) => {
      const { position } = getComputedStyle(child);
      return position !== 'fixed' && position !== 'absolute';
    }) ?? null;

  const main = document.getElementById('main');
  let element = main ? firstInFlow(main) : null;
  for (let depth = 0; element && depth < 4; depth++) {
    const rgba = toRgba(getComputedStyle(element).backgroundColor);
    if (rgba && rgba[3] > 240) {
      const [r, g, b] = rgba;
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      return `rgb(${r} ${g} ${b})|${luminance < 0.35 ? 'dark' : 'light'}`;
    }
    element = firstInFlow(element);
  }
  return `${LIGHT_TOP.color}|light`;
}

/** Re-reads the colour when the page's content is replaced (a different route). */
function subscribeToPage(onChange: () => void): () => void {
  const main = document.getElementById('main');
  if (!main || typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(main, { childList: true });
  return () => observer.disconnect();
}

function useTopBackground(): TopBackground {
  const key = useSyncExternalStore(
    subscribeToPage,
    readTopBackgroundKey,
    () => `${LIGHT_TOP.color}|light`,
  );
  const [color = LIGHT_TOP.color, tone] = key.split('|');
  return { color, dark: tone === 'dark' };
}

/* ----------------------------------------------------------- Mega menu */

/** Dark card with a tiny look-alike checker: shows the free tool without a screenshot. */
function CheckerCard({ feature, onNavigate }: { feature: NavFeature; onNavigate: () => void }) {
  return (
    <Link
      to={feature.to}
      onClick={onNavigate}
      className="group/card relative isolate flex flex-col overflow-hidden rounded-xl bg-night p-5 text-cream"
    >
      <p className="text-[12.5px] font-medium tracking-[0.06em] text-accent-soft uppercase">
        {feature.eyebrow}
      </p>
      <p className="mt-2 text-[17px] leading-snug font-semibold tracking-[-0.015em]">
        {feature.title}
      </p>
      <div
        aria-hidden
        className="mt-4 rounded-lg bg-cream/[0.07] p-3 font-mono text-[12.5px] ring-1 ring-cream/10"
      >
        <p className="text-cream/80">
          acme<span className="text-cream/45">.com</span>
        </p>
        <ul className="mt-2.5 space-y-1.5 border-t border-cream/10 pt-2.5">
          <li className="flex items-center gap-2 text-cream">
            <span className="size-1.5 rounded-full bg-accent-soft" />
            <span>
              acme<span className="text-accent-soft">-login</span>.com
            </span>
          </li>
          <li className="flex items-center gap-2 text-cream/85">
            <span className="size-1.5 rounded-full bg-accent-soft/70" />
            <span>
              ac<span className="text-accent-soft">rn</span>e.com
            </span>
          </li>
          <li className="flex items-center gap-2 text-cream/75">
            <span className="size-1.5 rounded-full bg-accent-soft/55" />
            <span>
              acme.<span className="text-accent-soft">net</span>
            </span>
          </li>
          <li className="flex items-center gap-2 text-cream/70">
            <span className="size-1.5 rounded-full bg-accent-soft/40" />
            <span>
              acme<span className="text-accent-soft">-support</span>.com
            </span>
          </li>
        </ul>
      </div>
      <p className="mt-4 text-[13.5px] leading-snug text-cream/70">{feature.description}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium">
        {feature.cta}
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover/card:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function GuideCard({ feature, onNavigate }: { feature: NavFeature; onNavigate: () => void }) {
  return (
    <Link
      to={feature.to}
      onClick={onNavigate}
      className="group/card flex flex-col rounded-xl bg-cream p-5 ring-1 ring-line transition-colors hover:bg-cream-deep/60"
    >
      <span className="text-[12.5px] font-medium tracking-[0.06em] text-accent-ink uppercase">
        {feature.eyebrow}
      </span>
      <span className="mt-2 text-[17px] leading-snug font-semibold tracking-[-0.015em]">
        {feature.title}
      </span>
      <span className="mt-2 text-[13.5px] leading-snug text-muted">{feature.description}</span>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium">
        {feature.cta}
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover/card:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function MegaPanel({
  menu,
  id,
  onNavigate,
}: {
  menu: NavMenu;
  id: string;
  onNavigate: () => void;
}) {
  const wide = Boolean(menu.wide);
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={cn(
        'absolute top-full z-50 pt-2',
        wide ? 'inset-x-0 mx-auto w-[min(62rem,calc(100%-3rem))]' : 'left-0 w-[34rem]',
      )}
    >
      <div
        className={cn(
          'grid gap-3 rounded-2xl bg-white p-3 shadow-window ring-1 ring-ink/[0.07]',
          wide ? 'grid-cols-[minmax(0,1fr)_16.5rem]' : 'grid-cols-[minmax(0,1fr)_14rem]',
        )}
      >
        <ul className={cn('grid content-start gap-1', wide && 'grid-cols-2')}>
          {menu.items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  'group/row flex h-full rounded-xl p-3 transition-colors hover:bg-cream',
                  wide ? 'flex-col gap-3.5' : 'items-start gap-4',
                )}
              >
                <NavPreview kind={item.preview} layout={wide ? 'card' : 'row'} />
                <span className="min-w-0 pt-0.5">
                  <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
                    <item.icon aria-hidden className="size-4 shrink-0 text-accent" />
                    {item.label}
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-snug text-muted">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {menu.featured &&
          (menu.featured.visual === 'checker' ? (
            <CheckerCard feature={menu.featured} onNavigate={onNavigate} />
          ) : (
            <GuideCard feature={menu.featured} onNavigate={onNavigate} />
          ))}
      </div>
    </motion.div>
  );
}

function DesktopNav({ dark }: { dark: boolean }) {
  const location = useLocation();
  const baseId = useId();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const triggers = useRef(new Map<string, HTMLButtonElement>());

  const open = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };
  // A short delay stops the menu flickering shut when the pointer crosses the gap.
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  // Escape closes a menu that was opened by hovering, wherever focus is.
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
      dark
        ? active
          ? 'text-cream'
          : 'text-cream/75 hover:text-cream'
        : active
          ? 'text-ink'
          : 'text-ink/70 hover:text-ink',
    );

  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {primaryNav.map((entry) =>
        isMenu(entry) ? (
          <li
            key={entry.label}
            className={cn(!entry.wide && 'relative')}
            onPointerEnter={(event) => {
              if (event.pointerType === 'mouse') open(entry.label);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') scheduleClose();
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setOpenMenu((current) => (current === entry.label ? null : current));
              }
            }}
            onKeyDown={(event) => {
              // Escape inside the menu closes it and puts focus back on its button.
              if (event.key === 'Escape' && openMenu === entry.label) {
                setOpenMenu(null);
                triggers.current.get(entry.label)?.focus();
              }
            }}
          >
            <button
              type="button"
              ref={(node) => {
                if (node) triggers.current.set(entry.label, node);
                else triggers.current.delete(entry.label);
              }}
              aria-expanded={openMenu === entry.label}
              aria-controls={`${baseId}-${entry.label}`}
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
                <MegaPanel
                  menu={entry}
                  id={`${baseId}-${entry.label}`}
                  onNavigate={() => setOpenMenu(null)}
                />
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
      id="mobile-menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain bg-night text-cream lg:hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-1/3 [mask-image:linear-gradient(to_top,black_20%,transparent)]"
      >
        <SimilarityWave tone="dark" density="calm" className="opacity-40" />
      </div>
      <nav
        aria-label="Mobile"
        className="relative flex min-h-full flex-col px-4 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6"
      >
        {primaryNav.map((entry, index) => (
          <motion.div
            key={entry.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.04 * index }}
            className="border-b border-cream/10 py-4"
          >
            {isMenu(entry) ? (
              <>
                <p className="text-[12.5px] font-medium tracking-[0.06em] text-accent-soft uppercase">
                  {entry.label}
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {entry.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className="flex h-full flex-col gap-3 rounded-xl bg-cream/[0.06] p-3.5 ring-1 ring-cream/10 transition-colors hover:bg-cream/10"
                      >
                        <item.icon aria-hidden className="size-5 text-accent-soft" />
                        <span className="block text-[15px] leading-snug font-medium">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Link
                to={entry.to}
                onClick={onClose}
                className="flex items-center justify-between py-1 text-[22px] font-semibold tracking-[-0.02em]"
              >
                {entry.label}
                <ArrowRight aria-hidden className="size-5 text-cream/60" />
              </Link>
            )}
          </motion.div>
        ))}
        <div className="mt-auto grid gap-3 pt-8">
          <ButtonLink to="/contact" onClick={onClose} size="lg">
            Request a demo
          </ButtonLink>
          <ButtonLink to="/#check" onClick={onClose} variant="outline-dark" size="lg">
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
  dark = false,
  onNavigate,
}: {
  mobile?: boolean;
  dark?: boolean;
  onNavigate?: () => void;
}) {
  const { data: me } = useSession();
  const to = me ? '/app' : '/sign-in';
  if (mobile) {
    return (
      <ButtonLink to={to} onClick={onNavigate} variant="outline-dark" size="lg">
        {me ? 'Open dashboard' : 'Sign in'}
      </ButtonLink>
    );
  }
  return (
    <Link
      to={to}
      className={cn(
        'hidden h-9 items-center rounded-md px-3 text-[14.5px] font-medium transition-colors md:inline-flex',
        dark ? 'text-cream/75 hover:text-cream' : 'text-ink/70 hover:text-ink',
      )}
    >
      {me ? 'Dashboard' : 'Sign in'}
    </Link>
  );
}

/* --------------------------------------------------------------- Header */

/**
 * Sticky header: logo, navigation with a Solutions mega menu, search, sign in and one call
 * to action. At the top of a page it blends into the first section (night over a dark
 * hero); once scrolled it becomes a solid cream bar with a hairline. The mobile menu is a
 * full-height night sheet.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const top = useTopBackground();
  const location = useLocation();
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const menuButton = useRef<HTMLButtonElement>(null);
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

  // Escape closes the mobile menu; hand focus back to its button so keyboard users keep their place.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') menuButton.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const dark = mobileOpen || (!scrolled && top.dark);
  const style: CSSProperties = {
    backgroundColor: mobileOpen ? NIGHT_BACKGROUND : scrolled ? SCROLLED_BACKGROUND : top.color,
  };

  return (
    <>
      <header
        style={style}
        className={cn(
          'sticky top-0 z-50 border-b transition-[background-color,border-color] duration-200',
          scrolled && !mobileOpen && 'backdrop-blur-md',
          mobileOpen
            ? 'border-cream/10'
            : scrolled
              ? 'border-line'
              : dark
                ? 'border-cream/[0.06]'
                : 'border-transparent',
        )}
      >
        <Container>
          <nav aria-label="Main" className="flex h-16 items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link to="/" aria-label="Similo home" className="shrink-0">
                <Logo tone={dark ? 'dark' : 'light'} />
              </Link>
              <DesktopNav dark={dark} />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search the site"
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm transition-colors sm:border sm:pr-2 sm:pl-3',
                  dark
                    ? 'text-cream/75 hover:bg-cream/10 hover:text-cream sm:border-cream/20'
                    : 'text-muted hover:bg-ink/[0.05] hover:text-ink sm:border-line',
                )}
              >
                <Search aria-hidden className="size-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd
                  className={cn(
                    'hidden rounded px-1.5 py-0.5 font-mono text-[10.5px] ring-1 sm:inline',
                    dark
                      ? 'bg-cream/10 text-cream/75 ring-cream/15'
                      : 'bg-cream text-muted ring-line',
                  )}
                >
                  {shortcut}
                </kbd>
              </button>
              <AccountLink dark={dark} />
              {/* Wrapper controls visibility; putting `hidden` on the button itself would
                  clash with the button's own `inline-flex` display class. */}
              <div className="hidden sm:block">
                <ButtonLink to="/contact" size="sm">
                  Request a demo
                </ButtonLink>
              </div>
              <button
                ref={menuButton}
                type="button"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                onClick={() => setMobileOpen((value) => !value)}
                className={cn(
                  'inline-flex size-10 items-center justify-center rounded-md lg:hidden',
                  dark ? 'text-cream hover:bg-cream/10' : 'text-ink hover:bg-ink/[0.05]',
                )}
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

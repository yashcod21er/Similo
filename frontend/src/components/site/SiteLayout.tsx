import { Outlet, ScrollRestoration } from 'react-router';
import { SmoothScroll } from '@/components/motion/scroll';
import { Cursor } from './Cursor';
import { PageTransition } from './PageTransition';
import { Preloader } from './Preloader';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

/**
 * The public website's frame. v5 adds the site-wide motion layer (docs/DESIGN-SYSTEM.md):
 * the intro (first visit per session), page transitions, a custom cursor on mouse/trackpad,
 * and a barely visible film grain. All of it is decorative, ignores the pointer, and turns
 * itself off with reduced motion. The signed-in workspace (/app) has none of it.
 */
export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      {/* Scroll to the top on navigation, restore position on back/forward. */}
      <ScrollRestoration />
      <PageTransition />
      <Preloader />
      <div aria-hidden className="film-grain" />
      <Cursor />
    </div>
  );
}

import { useRef } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { PhotoFilters } from '@/components/marketing/PhotoFilters';
import { SmoothScroll } from '@/components/motion/scroll';
import { PageTransition } from './PageTransition';
import { Preloader } from './Preloader';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

/**
 * The public website's frame. Site-wide layer (docs/DESIGN-SYSTEM.md): the intro (first visit
 * per session), page transitions, smooth scrolling, a barely visible film grain, and the
 * footer as a sheet: the page (`<main>`) has rounded bottom corners and a long soft shadow
 * and lifts off the dark footer. All of it is decorative, ignores the pointer, and turns
 * itself off with reduced motion. The signed-in workspace (/app) has none of it.
 *
 * `main` clips its overflow (`overflow-clip`, which unlike `hidden` keeps sticky and pinned
 * sections working) so the last band follows the rounded corners.
 */
export function SiteLayout() {
  const mainRef = useRef<HTMLElement>(null);
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
      <main
        id="main"
        ref={mainRef}
        className="relative z-10 flex-1 overflow-clip rounded-b-[1.5rem] bg-cream shadow-[0_24px_48px_-12px_rgb(0_0_0/0.4),0_64px_140px_-24px_rgb(0_0_0/0.55)] lg:rounded-b-[2.5rem]"
      >
        <Outlet />
      </main>
      <SiteFooter mainRef={mainRef} />
      {/* Scroll to the top on navigation, restore position on back/forward. */}
      <ScrollRestoration />
      <PageTransition />
      <Preloader />
      <div aria-hidden className="film-grain" />
      <PhotoFilters />
    </div>
  );
}

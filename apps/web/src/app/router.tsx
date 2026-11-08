import { createBrowserRouter } from 'react-router';
import { SiteLayout } from '@/components/site/SiteLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Public website routes.
 *
 * The home page is bundled with the app so it appears instantly. Every other
 * page is code-split with `lazy`: its JavaScript is downloaded only when a
 * visitor first navigates to it, which keeps the initial download small.
 * The authenticated app (/app/*) is added in a later phase.
 */
export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    hydrateFallbackElement: <div className="min-h-dvh bg-paper" />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'platform',
        lazy: () => import('@/pages/PlatformPage').then((m) => ({ Component: m.PlatformPage })),
      },
      {
        path: 'technology',
        lazy: () => import('@/pages/TechnologyPage').then((m) => ({ Component: m.TechnologyPage })),
      },
      {
        path: 'solutions/domain-intelligence',
        lazy: () =>
          import('@/pages/solutions/DomainIntelligencePage').then((m) => ({
            Component: m.DomainIntelligencePage,
          })),
      },
      {
        path: 'solutions/app-intelligence',
        lazy: () =>
          import('@/pages/solutions/AppIntelligencePage').then((m) => ({
            Component: m.AppIntelligencePage,
          })),
      },
      {
        path: 'solutions/trademark-intelligence',
        lazy: () =>
          import('@/pages/solutions/TrademarkIntelligencePage').then((m) => ({
            Component: m.TrademarkIntelligencePage,
          })),
      },
      {
        path: 'solutions/investigation-evidence',
        lazy: () =>
          import('@/pages/solutions/InvestigationEvidencePage').then((m) => ({
            Component: m.InvestigationEvidencePage,
          })),
      },
      {
        path: 'resources',
        lazy: () =>
          import('@/pages/resources/ResourcesPage').then((m) => ({ Component: m.ResourcesPage })),
      },
      {
        path: 'resources/:slug',
        lazy: () =>
          import('@/pages/resources/ResourceArticlePage').then((m) => ({
            Component: m.ResourceArticlePage,
          })),
      },
      {
        path: 'about',
        lazy: () => import('@/pages/AboutPage').then((m) => ({ Component: m.AboutPage })),
      },
      {
        path: 'contact',
        lazy: () => import('@/pages/ContactPage').then((m) => ({ Component: m.ContactPage })),
      },
      {
        path: 'status',
        lazy: () =>
          import('@/features/system-status/SystemStatusPage').then((m) => ({
            Component: m.SystemStatusPage,
          })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

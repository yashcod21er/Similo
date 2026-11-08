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
 * Sign-in pages and the signed-in workspace (/app) are code-split the same way.
 */
export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    hydrateFallbackElement: <div className="min-h-dvh bg-cream" />,
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

  /* Sign in, sign up and invitations: a focused layout without site navigation. */
  {
    lazy: () => import('@/features/auth/AuthLayout').then((m) => ({ Component: m.AuthLayout })),
    hydrateFallbackElement: <div className="min-h-dvh bg-cream" />,
    children: [
      {
        path: 'sign-in',
        lazy: () => import('@/features/auth/SignInPage').then((m) => ({ Component: m.SignInPage })),
      },
      {
        path: 'sign-up',
        lazy: () => import('@/features/auth/SignUpPage').then((m) => ({ Component: m.SignUpPage })),
      },
      {
        path: 'invite/:token',
        lazy: () =>
          import('@/features/auth/AcceptInvitePage').then((m) => ({
            Component: m.AcceptInvitePage,
          })),
      },
    ],
  },

  /* The signed-in workspace. RequireAuth redirects visitors without a session. */
  {
    path: 'app',
    lazy: () =>
      import('@/features/app-shell/ProtectedApp').then((m) => ({ Component: m.ProtectedApp })),
    hydrateFallbackElement: <div className="min-h-dvh bg-cream" />,
    children: [
      {
        index: true,
        lazy: () =>
          import('@/features/app-shell/OverviewPage').then((m) => ({ Component: m.OverviewPage })),
      },
      {
        path: 'brands',
        lazy: () =>
          import('@/features/brands/BrandsPage').then((m) => ({ Component: m.BrandsPage })),
      },
      {
        path: 'brands/:brandId',
        lazy: () =>
          import('@/features/brands/BrandDetailPage').then((m) => ({
            Component: m.BrandDetailPage,
          })),
      },
      {
        path: 'members',
        lazy: () =>
          import('@/features/organization/MembersPage').then((m) => ({ Component: m.MembersPage })),
      },
      {
        path: 'audit',
        lazy: () =>
          import('@/features/organization/AuditLogPage').then((m) => ({
            Component: m.AuditLogPage,
          })),
      },
      {
        path: 'settings',
        lazy: () =>
          import('@/features/organization/SettingsPage').then((m) => ({
            Component: m.SettingsPage,
          })),
      },
    ],
  },
]);

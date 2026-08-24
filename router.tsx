
/**
 * Application Router Configuration
 *
 * Defines all routes for the application using React Router v7.
 * All page components are lazy-loaded to reduce initial bundle size.
 * The MainLayout provides the shared shell (Navbar, Footer, modals)
 * for all public pages.
 */

import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { PageErrorBoundary } from './components/ui/PageErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SetupGate } from './components/SetupGate';

// ── Lazy-loaded page components ─────────────────────────────────────────────
const HomePageWrapper = React.lazy(() => import('./pages/Home').then(m => ({ default: m.HomePageWrapper })));
const AboutPageWrapper = React.lazy(() => import('./pages/About').then(m => ({ default: m.AboutPageWrapper })));
const HistoryPage = React.lazy(() => import('./pages/History').then(m => ({ default: m.HistoryPage })));
const TeamPage = React.lazy(() => import('./pages/Team').then(m => ({ default: m.TeamPage })));
const EventsPage = React.lazy(() => import('./pages/Events').then(m => ({ default: m.EventsPage })));
const BlogPageWrapper = React.lazy(() => import('./pages/Blog').then(m => ({ default: m.BlogPageWrapper })));
const PostDetailsPageWrapper = React.lazy(() => import('./pages/PostDetails').then(m => ({ default: m.PostDetailsPageWrapper })));
const GalleryPageWrapper = React.lazy(() => import('./pages/Gallery').then(m => ({ default: m.GalleryPageWrapper })));
const MemberAreaWrapper = React.lazy(() => import('./pages/MemberArea').then(m => ({ default: m.MemberAreaWrapper })));
const NotFoundPage = React.lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFoundPage })));
const AdminPageWrapper = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminPageWrapper })));
const SetupPage = React.lazy(() => import('./pages/Setup').then(m => ({ default: m.SetupPage })));

// ── Suspense fallback for route transitions ─────────────────────────────────
const RouteFallback = (
  <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm">A carregar...</p>
    </div>
  </div>
);

/** Wraps a lazy component in Suspense with the shared loading fallback. */
function suspended(element: React.ReactNode) {
  return <React.Suspense fallback={RouteFallback}>{element}</React.Suspense>;
}

export const router = createBrowserRouter([
  {
    // Top-level gate: redirects to /setup until the first admin is bootstrapped,
    // and from /setup back to home once setup is done.
    element: <SetupGate />,
    children: [
      {
        path: '/setup',
        element: (
          <PageErrorBoundary>
            {suspended(<SetupPage />)}
          </PageErrorBoundary>
        ),
      },
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <PageErrorBoundary>{suspended(<HomePageWrapper />)}</PageErrorBoundary> },
          { path: 'about', element: <PageErrorBoundary>{suspended(<AboutPageWrapper />)}</PageErrorBoundary> },
          { path: 'history', element: <PageErrorBoundary>{suspended(<HistoryPage />)}</PageErrorBoundary> },
          { path: 'team', element: <PageErrorBoundary>{suspended(<TeamPage />)}</PageErrorBoundary> },
          { path: 'events', element: <PageErrorBoundary>{suspended(<EventsPage />)}</PageErrorBoundary> },
          { path: 'blog', element: <PageErrorBoundary>{suspended(<BlogPageWrapper />)}</PageErrorBoundary> },
          { path: 'blog/:slug', element: <PageErrorBoundary>{suspended(<PostDetailsPageWrapper />)}</PageErrorBoundary> },
          { path: 'gallery', element: <PageErrorBoundary>{suspended(<GalleryPageWrapper />)}</PageErrorBoundary> },
          { path: 'member', element: <PageErrorBoundary><ProtectedRoute>{suspended(<MemberAreaWrapper />)}</ProtectedRoute></PageErrorBoundary> },
          { path: '*', element: <PageErrorBoundary>{suspended(<NotFoundPage />)}</PageErrorBoundary> },
        ],
      },
      {
        // Admin page renders without the MainLayout shell (it has its own layout)
        path: '/admin',
        element: (
            <React.Suspense fallback={RouteFallback}>
                <PageErrorBoundary>
                    <ProtectedRoute role="admin">
                        <AdminPageWrapper />
                    </ProtectedRoute>
                </PageErrorBoundary>
            </React.Suspense>
        ),
      },
    ],
  },
]);

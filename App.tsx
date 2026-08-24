
/**
 * Main Application Component
 *
 * This file serves as the application shell. It wraps the router with
 * global providers (DataProvider, ErrorBoundary) and renders all routes
 * via React Router's RouterProvider.
 *
 * The routing logic, page-switching, and layout concerns have been
 * migrated to router.tsx and layouts/MainLayout.tsx.
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './router';

const App: React.FC = () => (
  <ErrorBoundary>
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  </ErrorBoundary>
);

export default App;

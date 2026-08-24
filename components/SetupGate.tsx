/**
 * Setup Gate
 *
 * Wraps every route. When the database has no admin user yet, every visitor
 * is redirected to /setup so the first-run wizard can be completed. Once an
 * admin exists, /setup itself redirects back to the homepage.
 *
 * Implementing the gate at the router level (rather than inside individual
 * pages) ensures even direct hits to /admin or deep-linked routes are caught
 * before any page-specific code runs.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { api } from '../convex/_generated/api';

export const SetupGate: React.FC = () => {
    const setupComplete = useQuery(api.setup.isSetupComplete);
    const location = useLocation();
    const isOnSetup = location.pathname === '/setup';

    // Pending Convex query — wait for the answer rather than flashing wrong UI
    if (setupComplete === undefined) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">A iniciar o portal…</p>
                </div>
            </div>
        );
    }

    if (!setupComplete && !isOnSetup) return <Navigate to="/setup" replace />;
    if (setupComplete && isOnSetup) return <Navigate to="/" replace />;

    return <Outlet />;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from 'convex/react';
import { Loader2 } from 'lucide-react';
import { api } from '../convex/_generated/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  // Only subscribe to the role query when this route actually requires it
  const me = useQuery(api.users.me, role === 'admin' && isAuthenticated ? {} : 'skip');

  if (isLoading || (role === 'admin' && isAuthenticated && me === undefined)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">A verificar autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Defense-in-depth: backend mutations already enforce requireAdmin, this
  // stops non-admins from loading the admin shell in the first place
  if (role === 'admin' && me?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

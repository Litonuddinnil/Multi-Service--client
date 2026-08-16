import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

/**
 * Generic auth-required guard.
 *
 * - If auth is still resolving, render a small inline placeholder
 *   so we don't bounce users away while their session hydrates.
 * - If the user is unauthenticated, redirect to `/login` and stash
 *   the originally-requested location so we can return them after
 *   they sign in.
 */
const PrivateRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] items-center justify-center text-slate-400"
      >
        <span className="text-sm tracking-wide">Checking your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoutes;
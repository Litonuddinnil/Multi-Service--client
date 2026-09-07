import React from 'react';
import { ShieldOff } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

/**
 * Customer-role guard.
 *
 * Any signed-in user (CUSTOMER, EXPERT, ADMIN …) can access the
 * customer portal — that's deliberate, since experts are also
 * buyers. We only block *unauthenticated* access here; finer role
 * gating belongs in `AdminRoutes` / `ExpertRoutes`.
 */
const CustomerRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] items-center justify-center text-gray-600"
      >
        <span className="text-sm tracking-wide">Checking your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff className="h-12 w-12 text-rose-400" aria-hidden />
        <h1 className="text-xl font-semibold text-gray-900">
          Sign in to view your portal
        </h1>
        <p className="text-sm leading-relaxed text-gray-600">
          Your customer workspace keeps track of bookings, milestone
          projects, retainer subscriptions, and payment history.
        </p>
        <a
          href="/login"
          className="mt-2 rounded-md bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 ring-1 ring-cyan-200 transition hover:bg-cyan-100"
        >
          Sign in
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default CustomerRoutes;
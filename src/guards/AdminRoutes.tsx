import React from 'react';
import { ShieldOff } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

/**
 * Admin-role guard.
 *
 * Wraps the `<Outlet />` (or any children) and only renders them
 * when the signed-in user has the `ADMIN` or `SUPER_ADMIN` role.
 *
 * Unlike `PrivateRoutes`, an unauthorized admin area should NOT
 * silently redirect — admins are explicitly told they lack the
 * role and offered a way back to the customer portal.
 */
const AdminRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const isAdmin = !!user && user.roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN');

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff className="h-12 w-12 text-rose-400" aria-hidden />
        <h1 className="text-xl font-semibold text-slate-100">
          Admin access required
        </h1>
        <p className="text-sm leading-relaxed text-slate-400">
          This area is restricted to platform administrators. If you believe
          you should have access, contact your workspace owner.
        </p>
        <a
          href="/portal/customer"
          className="mt-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/20"
        >
          Back to my portal
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoutes;
import React from 'react';
import { ShieldOff } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

/**
 * Expert-role guard.
 *
 * Renders children only when the signed-in user holds the `EXPERT`
 * role. Used to wrap the `/portal/expert` workspace.
 */
const ExpertRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const isExpert = !!user && user.roles.includes('EXPERT');

  if (!isExpert) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff className="h-12 w-12 text-rose-400" aria-hidden />
        <h1 className="text-xl font-semibold text-slate-100">
          Expert workspace
        </h1>
        <p className="text-sm leading-relaxed text-slate-400">
          This area is only available to verified experts. If you're an
          expert, complete your verification to unlock the workspace.
        </p>
        <a
          href="/become-expert"
          className="mt-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-500/30 transition hover:bg-cyan-500/20"
        >
          Start expert verification
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default ExpertRoutes;
import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Generic Suspense fallback used by `withSuspense`.
 * Centered spinner with a subtle label so route transitions
 * never flash an empty viewport.
 */
const Loading: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 text-slate-300"
  >
    <Loader2 className="h-10 w-10 animate-spin text-cyan-400" aria-hidden />
    <span className="text-sm font-medium tracking-wide text-slate-400">
      {label}
    </span>
  </div>
);

export default Loading;
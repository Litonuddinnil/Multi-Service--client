import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Shared toast primitive — F0 Shared Primitives.
 *
 * Replaces ad-hoc `useState + setTimeout` notifications that each page used
 * to roll on its own. Pages should call `const { showToast } = useToast();`
 * then `showToast('Saved!')` rather than tracking a local `notification` state.
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  /** Override default duration (ms). Pass 0 for a sticky toast. */
  durationMs?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, variant?: ToastVariant, durationMs?: number) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 3500;
const MAX_VISIBLE = 4;

const VARIANT_STYLES: Record<
  ToastVariant,
  { wrap: string; icon: React.ComponentType<{ className?: string }>; ring: string }
> = {
  success: {
    wrap: 'bg-emerald-600 text-white',
    icon: CheckCircle2,
    ring: 'ring-emerald-700/20',
  },
  error: {
    wrap: 'bg-red-600 text-white',
    icon: AlertCircle,
    ring: 'ring-red-700/20',
  },
  info: {
    wrap: 'bg-[#111827] text-white',
    icon: Info,
    ring: 'ring-black/20',
  },
  warning: {
    wrap: 'bg-amber-500 text-white',
    icon: AlertTriangle,
    ring: 'ring-amber-600/20',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>(
    (message, variant = 'success', durationMs = DEFAULT_DURATION_MS) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts(prev => {
        const next = [...prev, { id, message, variant, durationMs }];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      if (durationMs > 0) {
        const timer = setTimeout(() => dismissToast(id), durationMs);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismissToast],
  );

  // Clear timers on unmount to avoid state updates on a dead component.
  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const ctx = useMemo<ToastContextValue>(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

const ToastViewport: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-20 right-6 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(t => {
        const style = VARIANT_STYLES[t.variant];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto p-3 pr-9 ${style.wrap} font-semibold text-xs rounded-2xl shadow-xl flex items-start gap-2 ring-4 ${style.ring} animate-slideInRight relative`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return ctx;
};

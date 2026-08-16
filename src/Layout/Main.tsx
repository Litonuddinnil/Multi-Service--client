import React, { useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import type { PaymentPayload, ViewName, ViewParams } from '../router/types';

 
const Main: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // --- URL → view-key adapter (mirrors resolveViewFromUrl in router.tsx) ---
  const { currentView, viewParams } = React.useMemo(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '') {
      return { currentView: 'home' as ViewName, viewParams: {} as ViewParams };
    }
    if (path === '/catalog') {
      return {
        currentView: 'catalog' as ViewName,
        viewParams: {
          categoryId: searchParams.get('category') ?? undefined,
          query: searchParams.get('q') ?? undefined,
        } as ViewParams,
      };
    }
    if (path === '/commerce') {
      return { currentView: 'commerce' as ViewName, viewParams: {} as ViewParams };
    }
    if (/^\/services\/[^/]+$/.test(path)) {
      const id = path.split('/')[2];
      return {
        currentView: 'service-detail' as ViewName,
        viewParams: { serviceId: id } as ViewParams,
      };
    }
    if (/^\/experts\/[^/]+$/.test(path)) {
      const id = path.split('/')[2];
      return {
        currentView: 'expert-detail' as ViewName,
        viewParams: { expertId: id } as ViewParams,
      };
    }
    if (path === '/become-expert') {
      return { currentView: 'become-expert' as ViewName, viewParams: {} as ViewParams };
    }
    return { currentView: 'home' as ViewName, viewParams: {} as ViewParams };
  }, [location.pathname, searchParams]);

  // --- view-key → URL adapter ---
  const handleNavigate = useCallback(
    (view: string, params?: Record<string, unknown>) => {
      const v = view as ViewName;
      switch (v) {
        case 'home':
          navigate('/');
          break;
        case 'catalog': {
          const qs = new URLSearchParams();
          if (params?.categoryId) qs.set('category', String(params.categoryId));
          if (params?.query) qs.set('q', String(params.query));
          navigate(`/catalog${qs.toString() ? `?${qs}` : ''}`);
          break;
        }
        case 'commerce':
          navigate('/commerce');
          break;
        case 'checkout':
          navigate('/checkout');
          break;
        case 'service-detail':
          navigate(`/services/${params?.serviceId ?? ''}`);
          break;
        case 'expert-detail':
          navigate(`/experts/${params?.expertId ?? ''}`);
          break;
        case 'customer':
          navigate('/portal/customer');
          break;
        case 'expert':
          navigate('/portal/expert');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'become-expert':
          navigate('/become-expert');
          break;
        case 'auth':
        case 'login':
          navigate(`/login${params?.mode === 'register' ? '?mode=register' : ''}`);
          break;
        case 'register':
          navigate('/register');
          break;
        default:
          navigate('/');
      }
    },
    [navigate],
  );

  const handleOpenAuth = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Pay-escrow is exposed on CommerceView via the global window event bus
  // that the existing shell wires up; keep that contract intact.
  const handlePayEscrow = useCallback((payload: PaymentPayload | unknown, ...rest: unknown[]) => {
    if (typeof window === 'undefined') return;
    // Backwards-compatible signature: either (payload) or
    // (entityType, id, amount, title).
    if (
      payload &&
      typeof payload === 'object' &&
      'entityType' in (payload as Record<string, unknown>)
    ) {
      window.dispatchEvent(
        new CustomEvent('withu:open-payment', { detail: payload }),
      );
      return;
    }
    const [entityType, id, amount, title] = rest as [
      PaymentPayload['entityType'],
      string,
      number,
      string,
    ];
    window.dispatchEvent(
      new CustomEvent('withu:open-payment', {
        detail: {
          entityType,
          entityId: id,
          amountBDT: amount,
          title,
        } satisfies PaymentPayload,
      }),
    );
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1220] text-slate-100">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />
      <main className="flex-1">
        <Outlet
          context={{
            currentView,
            viewParams,
            navigate: handleNavigate,
            onOpenAuth: handleOpenAuth,
            onPayEscrow: handlePayEscrow,
          }}
        />
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default Main;
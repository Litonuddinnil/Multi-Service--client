/**
 * Shared route-level types for the dispatcher (App.tsx) and the
 * per-portal route modules (ClientRoutes / ExpertRoutes / AdminRoutes).
 *
 * Each route module receives a `RouteContext` so it can:
 *   - know which `currentView` to render
 *   - read `viewParams` for detail-page ids etc.
 *   - call `navigate(view, params?)` to switch views
 *   - trigger the side-effect callbacks owned by the AppShell
 *     (booking flow, escrow payment, consultation overlay, prescription)
 */

import type { ServiceItem, PilgrimagePackage } from '../types';

export type ViewName =
  | 'home'
  | 'catalog'
  | 'service-detail'
  | 'expert-detail'
  | 'commerce'
  | 'checkout'
  | 'auth'
  | 'login'
  | 'register'
  | 'customer'
  | 'expert'
  | 'admin'
  | 'become-expert';

export interface ViewParams {
  categoryId?: string;
  query?: string;
  serviceId?: string;
  expertId?: string;
  mode?: 'login' | 'register';
}

export interface RouteContext {
  currentView: ViewName;
  viewParams: ViewParams;
  navigate: (view: ViewName, params?: ViewParams) => void;

  // Side-effect callbacks owned by the AppShell
  onBookService?: (service: ServiceItem) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onPayEscrow?: (payload: PaymentPayload) => void;
  onJoinConsultation?: (consultationId: string) => void;
  onViewPrescription?: (bookingId: string) => void;
}

export interface PaymentPayload {
  entityType: 'SESSION' | 'PROJECT' | 'PACKAGE' | 'COMMERCE';
  entityId: string;
  subEntityId?: string;
  amountBDT: number;
  title: string;
  service?: ServiceItem;
  pkg?: PilgrimagePackage;
}

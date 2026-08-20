import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Download,
  ShieldCheck,
  Calendar,
  Briefcase,
  Plane,
  Clock,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { ApiService } from '../../services/api';
import {
  AppointmentBooking,
  ProjectContract,
  PilgrimageBooking,
  RetainerSubscription,
  CommerceOrder,
  ConsultationSession,
  ChatThread,
} from '../../types';
import { PdfService } from '../../services/pdfService';
import { DoctorConsultationRoom } from '../../components/consultation/DoctorConsultationRoom';
import { RoleSidebar, SidebarItem } from '../../components/layout/RoleSidebar';
import type { CustomerOutletContext } from './CustomerOutletContext';

/**
 * Shell-level legacy dispatcher context (the *router's* `AuthOutletContext`).
 * Mirrors the shape from CustomerPortalView so navigation and escrow fallbacks
 * behave identically to before the refactor.
 */
interface RouterAuthOutletContext {
  currentView?: string;
  viewParams?: Record<string, any>;
  navigate?: (view: string, params?: Record<string, any>) => void;
  onOpenAuth?: () => void;
  onPayEscrow?: (
    entityType: 'SESSION' | 'PROJECT' | 'PILGRIMAGE' | 'COMMERCE',
    entityId: string,
    amountBDT: number,
    title: string,
  ) => void;
}

const PORTAL_ROUTES_CUST: Record<string, string> = {
  home: '/',
  catalog: '/catalog',
  commerce: '/commerce',
  'become-expert': '/become-expert',
  expert: '/portal/expert',
  admin: '/admin',
  customer: '/portal/customer',
};

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const reactNavigate = useNavigate();
  const ctx = useOutletContext<RouterAuthOutletContext>();

  /**
   * Fallback chain: legacy prop → outlet context → react-router direct.
   * Mirrors the dispatcher in the previous monolithic CustomerPortalView.
   */
  const handleNavigate = useCallback(
    (view: string, params?: Record<string, any>) => {
      if (ctx?.navigate) {
        ctx.navigate(view, params);
        return;
      }
      if (view === 'catalog' && params?.categoryId) {
        reactNavigate(`/catalog?category=${encodeURIComponent(params.categoryId)}`);
        return;
      }
      const route = PORTAL_ROUTES_CUST[view] ?? '/';
      reactNavigate(route);
    },
    [ctx, reactNavigate],
  );

  const handlePayEscrow = useCallback(
    (
      entityType: 'SESSION' | 'PROJECT' | 'PILGRIMAGE' | 'COMMERCE',
      entityId: string,
      amountBDT: number,
      title: string,
    ) => {
      if (ctx?.onPayEscrow) {
        ctx.onPayEscrow(entityType, entityId, amountBDT, title);
        return;
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('withu:open-payment', {
            detail: { entityType, entityId, amountBDT, title },
          }),
        );
      }
    },
    [ctx],
  );

  const handleViewPrescription = useCallback(
    (consultation: ConsultationSession) => {
      reactNavigate(`/print/prescription/${consultation.consultationId}`);
    },
    [reactNavigate],
  );

  /**
   * Data is fetched once at the shell level so individual tab files don't
   * re-hit the API on every navigation. The same `loadData` is invoked
   * after milestone releases / payments settle.
   */
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [projects, setProjects] = useState<ProjectContract[]>([]);
  const [pilgrimages, setPilgrimages] = useState<PilgrimageBooking[]>([]);
  const [retainers, setRetainers] = useState<RetainerSubscription[]>([]);
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [threadsCount, setThreadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeVideoRoomId, setActiveVideoRoomId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [appts, projs, pilgs, rets, ords, customerThreads] = await Promise.all([
      ApiService.getCustomerAppointments(),
      ApiService.getCustomerProjects(),
      ApiService.getCustomerPilgrimages(),
      ApiService.getCustomerRetainers(),
      ApiService.getCustomerOrders(),
      ApiService.fetchThreads({
        customerId: user?.id && user.id !== 'guest' ? user.id : 'user-cust-1',
      }),
    ]);
    setAppointments(appts);
    setProjects(projs);
    setPilgrimages(pilgs);
    setRetainers(rets);
    setOrders(ords);
    setThreadsCount(customerThreads.length);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openVideoRoom = useCallback((consultationId: string) => {
    setActiveVideoRoomId(consultationId);
  }, []);

  const releaseMilestone = useCallback(
    async (projectId: string, milestoneId: string) => {
      const success = await ApiService.releaseMilestoneEscrow(projectId, milestoneId);
      if (success) {
        await loadData();
      }
    },
    [loadData],
  );

  /**
   * Context passed to each tab via `<Outlet context={ctx} />`. Memoised so
   * tab files don't re-render when unrelated state shifts in the shell.
   */
  const outletCtx = useMemo<CustomerOutletContext>(
    () => ({
      appointments,
      projects,
      pilgrimages,
      retainers,
      orders,
      loading,
      reload: loadData,
      handleNavigate,
      handlePayEscrow,
      handleViewPrescription,
      openVideoRoom,
    }),
    [
      appointments,
      projects,
      pilgrimages,
      retainers,
      orders,
      loading,
      loadData,
      handleNavigate,
      handlePayEscrow,
      handleViewPrescription,
      openVideoRoom,
    ],
  );

  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      { label: 'Consultations & Appointments', to: '/portal/customer/appointments', icon: Calendar, badge: appointments.length, accent: 'emerald' },
      { label: 'Milestone Contracts', to: '/portal/customer/projects', icon: Briefcase, badge: projects.length, accent: 'emerald' },
      { label: 'Hajj & Umrah Trips', to: '/portal/customer/pilgrimage', icon: Plane, badge: pilgrimages.length, accent: 'emerald' },
      { label: 'Retainer Subscriptions', to: '/portal/customer/retainers', icon: Clock, badge: retainers.length, accent: 'emerald' },
      { label: 'Messages', to: '/portal/customer/threads', icon: MessageCircle, badge: threadsCount, accent: 'emerald' },
      { label: 'Payment Ledger & Invoices', to: '/portal/customer/orders', icon: CreditCard, badge: orders.length, accent: 'emerald' },
    ],
    [appointments.length, projects.length, pilgrimages.length, retainers.length, orders.length, threadsCount],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner — bespoke (avatar + escrow widget + export PDF).
          Kept inline because the layout is dense and role-specific. */}
      <div className="bg-gradient-to-r from-[#111827] to-[#1F2937] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
            }
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-[#34C759]/30"
          />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#34C759]">
              Client Account
            </span>
            <h1 className="text-2xl font-black text-white">{user?.name || 'Customer'}</h1>
            <p className="text-xs text-gray-300">{user?.email} • Member since Jan 2026</p>
          </div>
        </div>

        <div className="bg-white/10 border border-white/15 p-4 rounded-2xl text-xs space-y-2 w-full md:w-auto flex flex-col items-start md:items-end">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#34C759]" />
            Active Escrow Protection
          </div>
          <p className="text-gray-300 text-[11px]">All consultation & project funds secured</p>
          <button
            onClick={() => {
              PdfService.generateExpertStatementPdf(
                user?.name || 'Customer',
                appointments,
                projects,
                0,
                appointments.reduce((sum, a) => sum + a.priceBDT, 0),
              );
            }}
            className="mt-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
          >
            <Download className="w-3.5 h-3.5 text-[#34C759]" />
            <span>Export Account Statement PDF</span>
          </button>
        </div>
      </div>

      {/* Sidebar + Outlet */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RoleSidebar role="customer" title="Client Portal" items={sidebarItems} />
        </aside>

        <main className="space-y-6 min-w-0">
          <Outlet
            context={{
              ...outletCtx,
              // expose releaseMilestone so Projects tab doesn't need its own copy
              releaseMilestone,
            }}
          />
        </main>
      </div>

      {/* Live Video Room overlay — opened by the Appointments tab via
          `openVideoRoom`. Renders its own fixed inset-0 layer. */}
      {activeVideoRoomId && (
        <DoctorConsultationRoom
          consultationId={activeVideoRoomId}
          onExit={() => setActiveVideoRoomId(null)}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
export { CustomerDashboard as CustomerDashboardComponent };
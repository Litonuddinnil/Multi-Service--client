import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileSignature,
  LayoutGrid,
  MessageCircle,
  Star,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import type {
  AppointmentBooking,
  ExpertProfile,
  ExpertStatus,
  PayoutMethod,
  PayoutRequest,
  ProjectContract,
  ProviderLedgerRow,
  ServiceItem,
} from '../../types';
import { PdfService } from '../../services/pdfService';
import { FormField } from '../../components/common/FormField';
import { MoneyValue } from '../../components/common/MoneyValue';
import { useToast } from '../../components/common/Toast';
import { RoleSidebar, SidebarItem } from '../../components/layout/RoleSidebar';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard shell.
 *
 * Owns: header banner, sidebar, all data fetching, the derived financial
 * figures, the payout modal and the deliverable modal. Tabs receive everything
 * via `<Outlet context={...} />`.
 *
 * The shell keeps the modals so they overlay both sidebar and main content
 * rather than being trapped inside a tab card.
 */

/** Demo profile used when the signed-in user has not onboarded yet. */
const DEMO_EXPERT_ID = 'exp-doc-1';

/** Platform commission applied when neither the profile nor a booking says otherwise. */
const DEFAULT_COMMISSION_RATE = 0.12;

const STATUS_STYLES: Record<ExpertStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-gray-500/20 text-gray-300 border-gray-400/30' },
  SUBMITTED: {
    label: 'Pending Verification',
    className: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
  APPROVED: {
    label: 'Verified Expert',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  },
  REJECTED: { label: 'Rejected', className: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
  SUSPENDED: { label: 'Suspended', className: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
};

export const ExpertDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const reactNavigate = useNavigate();

  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [projects, setProjects] = useState<ProjectContract[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [ledger, setLedger] = useState<ProviderLedgerRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [threadsCount, setThreadsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Payout modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethodId, setPayoutMethodId] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Deliverable modal
  const [selectedMilestone, setSelectedMilestone] = useState<
    { projectId: string; milestoneId: string } | null
  >(null);
  const [deliverableUrl, setDeliverableUrl] = useState(
    'https://storage.withu.com/blueprints/BNBC-Structural-Plan-v2.pdf',
  );

  const loadExpertData = useCallback(async () => {
    setLoading(true);
    try {
      // Resolve the signed-in user's own profile first — every downstream
      // query is scoped by its id, so the dashboard shows this expert's work
      // rather than the seeded demo expert's.
      const ownProfile = user?.id ? await ApiService.getExpertByUserId(user.id) : null;
      const scopedId = ownProfile?.id || DEMO_EXPERT_ID;

      const [appts, projs, srvs, rows, pays, methods, revs, expertThreads] = await Promise.all([
        ApiService.getExpertAppointments(scopedId),
        ApiService.getExpertProjects(scopedId),
        ApiService.getServices({ expertId: scopedId }),
        ApiService.getProviderLedger().catch(() => []),
        ApiService.getExpertPayoutRequests(scopedId).catch(() => []),
        ApiService.getExpertPayoutMethods().catch(() => []),
        ApiService.fetchReviews({ expertId: scopedId }).catch(() => []),
        ApiService.fetchThreads({ expertId: scopedId }).catch(() => []),
      ]);

      setProfile(ownProfile);
      setAppointments(appts);
      setProjects(projs);
      setServices(srvs);
      setLedger(rows);
      setPayouts(pays);
      setPayoutMethods(methods);
      setReviewsCount(revs.length);
      setThreadsCount(expertThreads.length);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadExpertData();
  }, [loadExpertData]);

  const expertId = profile?.id || DEMO_EXPERT_ID;
  const agreement = profile?.agreement ?? null;
  const expertName = profile?.displayName || user?.name || 'Dr. Rahim Ahmed';

  const commissionRate =
    profile?.customCommissionRate ?? appointments[0]?.commissionRate ?? DEFAULT_COMMISSION_RATE;

  /** Provider net still locked in escrow against engagements that have not finished. */
  const totalHeldEscrow = useMemo(() => {
    const fromBookings = appointments
      .filter(a => a.status === 'CONFIRMED')
      .reduce((acc, a) => acc + (a.providerNetBDT || a.priceBDT * (1 - commissionRate)), 0);

    // A milestone is funded into escrow and only released on client approval.
    const fromMilestones = projects.reduce(
      (acc, p) =>
        acc +
        p.milestones
          .filter(m => m.status === 'FUNDED' || m.status === 'DELIVERED')
          .reduce((sum, m) => sum + m.amountBDT * (1 - (p.commissionRate ?? commissionRate)), 0),
      0,
    );

    return fromBookings + fromMilestones;
  }, [appointments, projects, commissionRate]);

  const { lifetimeEarnings, lifetimeCommission, clearedBalance } = useMemo(() => {
    const released = ledger.filter(r => r.type === 'EARNING_RELEASED');
    const earnings = released.reduce((acc, r) => acc + r.netBDT, 0);
    const commission = released.reduce((acc, r) => acc + r.commissionBDT, 0);

    // `getProviderLedger` returns newest-first, so row 0 carries the running
    // balance after the most recent movement.
    const cleared = ledger.length ? ledger[0].balanceAfterBDT : 0;

    return { lifetimeEarnings: earnings, lifetimeCommission: commission, clearedBalance: cleared };
  }, [ledger]);

  /** Withdrawals raised but not settled — already spoken for, so not available. */
  const pendingPayoutTotal = useMemo(
    () =>
      payouts
        .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
        .reduce((acc, p) => acc + p.amountBDT, 0),
    [payouts],
  );

  const availableBalance = Math.max(0, clearedBalance - pendingPayoutTotal);

  const completedEngagements = useMemo(
    () =>
      appointments.filter(a => a.status === 'COMPLETED').length +
      projects.filter(p => p.status === 'COMPLETED').length,
    [appointments, projects],
  );

  const handleJoinConsultation = useCallback((consultationId: string) => {
    if (typeof window !== 'undefined') {
      window.location.hash = `#consultation=${encodeURIComponent(consultationId)}`;
    }
  }, []);

  const openPayoutModal = useCallback(() => {
    setPayoutSuccess(false);
    setPayoutAmount(availableBalance > 0 ? String(Math.floor(availableBalance)) : '');
    setPayoutMethodId(prev => prev || payoutMethods.find(m => m.isDefault)?.id || payoutMethods[0]?.id || '');
    setIsPayoutModalOpen(true);
  }, [availableBalance, payoutMethods]);

  const payoutAmountNumber = Number(payoutAmount);
  const payoutError =
    !payoutMethodId
      ? 'Add a verified payout destination first.'
      : !payoutAmount.trim() || Number.isNaN(payoutAmountNumber) || payoutAmountNumber <= 0
        ? 'Enter an amount greater than zero.'
        : payoutAmountNumber > availableBalance
          ? 'Amount exceeds your available balance.'
          : undefined;

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = payoutMethods.find(m => m.id === payoutMethodId);
    if (payoutError || !method || payoutSubmitting) return;

    setPayoutSubmitting(true);
    try {
      const result = await ApiService.requestExpertPayout({
        expertId,
        expertName,
        amountBDT: payoutAmountNumber,
        payoutMethod: method,
      });
      if (!result?.success) throw new Error('Payout request was not accepted.');

      setPayoutSuccess(true);
      await loadExpertData();
      showToast(`Payout ${result.payout.payoutNumber} queued for disbursement.`, 'success');
      setTimeout(() => {
        setPayoutSuccess(false);
        setIsPayoutModalOpen(false);
      }, 2000);
    } catch (error) {
      showToast(
        error instanceof Error && error.message
          ? error.message
          : 'Could not raise the payout request. Please try again.',
        'error',
      );
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleUploadDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;
    await ApiService.submitMilestoneDeliverable(
      selectedMilestone.projectId,
      selectedMilestone.milestoneId,
      deliverableUrl,
    );
    setSelectedMilestone(null);
    loadExpertData();
  };

  const outletCtx = useMemo<ExpertOutletContext>(
    () => ({
      appointments,
      projects,
      services,
      ledger,
      payouts,
      payoutMethods,
      loading,
      expertId,
      profile,
      agreement,
      reload: loadExpertData,
      availableBalance,
      totalHeldEscrow,
      pendingPayoutTotal,
      lifetimeEarnings,
      lifetimeCommission,
      completedEngagements,
      commissionRate,
      handleJoinConsultation,
      openPayoutModal,
      openDeliverableModal: (projectId: string, milestoneId: string) =>
        setSelectedMilestone({ projectId, milestoneId }),
    }),
    [
      appointments,
      projects,
      services,
      ledger,
      payouts,
      payoutMethods,
      loading,
      expertId,
      profile,
      agreement,
      loadExpertData,
      availableBalance,
      totalHeldEscrow,
      pendingPayoutTotal,
      lifetimeEarnings,
      lifetimeCommission,
      completedEngagements,
      commissionRate,
      handleJoinConsultation,
      openPayoutModal,
    ],
  );

  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      { label: 'Overview', to: '/portal/expert/overview', icon: LayoutGrid, accent: 'blue' },
      {
        label: 'Consultations',
        to: '/portal/expert/consultations',
        icon: Calendar,
        badge: appointments.length,
        accent: 'blue',
      },
      {
        label: 'Milestone Projects',
        to: '/portal/expert/projects',
        icon: Building2,
        badge: projects.length,
        accent: 'blue',
      },
      {
        label: 'My Services',
        to: '/portal/expert/services',
        icon: LayoutGrid,
        badge: services.length,
        accent: 'blue',
      },
      { label: 'Earnings', to: '/portal/expert/earnings', icon: Wallet, accent: 'blue' },
      {
        label: 'Reviews',
        to: '/portal/expert/reviews',
        icon: Star,
        badge: reviewsCount,
        accent: 'blue',
      },
      {
        label: 'Messages',
        to: '/portal/expert/threads',
        icon: MessageCircle,
        badge: threadsCount,
        accent: 'blue',
      },
      { label: 'Agreement', to: '/portal/expert/agreement', icon: FileSignature, accent: 'blue' },
    ],
    [appointments.length, projects.length, services.length, reviewsCount, threadsCount],
  );

  const status = profile?.status ?? 'APPROVED';
  const statusStyle = STATUS_STYLES[status];

  // Credential line: real agreement data when present, profile fields otherwise.
  const credentialLine = agreement
    ? [`${agreement.associationName} Reg: ${agreement.associationMemberNo}`, agreement.fieldOfExpertise]
        .filter(Boolean)
        .join(' • ')
    : profile
      ? [
          profile.verificationBody && profile.officialLicenseNumber
            ? `${profile.verificationBody} Reg: ${profile.officialLicenseNumber}`
            : profile.verificationBody,
          profile.specialization || profile.profession,
        ]
          .filter(Boolean)
          .join(' • ')
      : 'BMDC Reg: A-89421 • Cardiology & Telemedicine Specialist';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#111827] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={
              profile?.avatarUrl ||
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80'
            }
            alt={expertName}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/30"
          />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Verified Provider Portal
            </span>
            <h1 className="text-2xl font-black text-white">{expertName}</h1>
            <p className="text-xs text-gray-400">{credentialLine}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${statusStyle.className}`}
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() =>
              PdfService.generateExpertStatementPdf(
                expertName,
                appointments,
                projects,
                availableBalance,
                totalHeldEscrow,
              )
            }
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all border border-white/20"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Monthly Statement PDF</span>
          </button>

          <button
            onClick={openPayoutModal}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Balance Payout</span>
          </button>
        </div>
      </div>

      {/* Onboarding nudge — only when this user has never submitted an agreement. */}
      {!loading && !profile && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-amber-900">
              You have not submitted your verification agreement yet
            </h2>
            <p className="text-xs text-amber-800 mt-0.5">
              The figures below are sample data. Complete the Expert Verification &amp; Initial
              Agreement to activate your own profile and start receiving bookings.
            </p>
          </div>
          <button
            onClick={() => reactNavigate('/become-expert')}
            className="shrink-0 px-5 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Complete Verification
          </button>
        </div>
      )}

      {/* Sidebar + Outlet */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <RoleSidebar role="expert" title="Provider Portal" items={sidebarItems} />

        <main className="space-y-6 min-w-0">
          <Outlet context={outletCtx} />
        </main>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold ">Request Earnings Withdrawal</h2>
            <p className="text-xs text-gray-500">
              Withdraw directly to your verified bKash Merchant Wallet or Commercial Bank Account
              in Bangladesh.
            </p>

            <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl">
              <span className="text-xs font-semibold text-gray-500">Available balance</span>
              <MoneyValue amount={availableBalance} className="text-sm font-bold " />
            </div>

            {payoutSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-emerald-900">
                <CheckCircle2 className="w-8 h-8 text-[#34C759] mx-auto" />
                <p className="font-bold text-sm">Payout Requested!</p>
                <p className="text-xs text-emerald-700">
                  Finance settles verified requests via BEFTN/MFS within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <FormField label="Withdrawal Destination" required>
                  {payoutMethods.length === 0 ? (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      No verified payout destination on file yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {payoutMethods.map(method => (
                        <button
                          type="button"
                          key={method.id}
                          onClick={() => setPayoutMethodId(method.id)}
                          className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                            payoutMethodId === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-xs font-bold  truncate">
                              {method.bankName || method.type}
                            </span>
                            <span className="block text-[11px] text-gray-500 font-mono">
                              {method.accountNumberMasked}
                            </span>
                          </span>
                          <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0">
                            {method.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </FormField>

                <FormField
                  label="Amount (BDT)"
                  required
                  error={payoutAmount.trim() ? payoutError : undefined}
                >
                  <input
                    type="number"
                    min={1}
                    max={Math.floor(availableBalance)}
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full p-2 text-xs font-mono bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                  />
                </FormField>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!payoutError || payoutSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {payoutSubmitting ? 'Submitting…' : 'Confirm Payout'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Deliverable Upload Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold ">Upload Milestone Deliverable</h2>
            <form onSubmit={handleUploadDeliverable} className="space-y-4">
              <FormField
                label="Document / Blueprint Download URL"
                required
                helpText="URL to high-res drawings, calculation sheet, or source archive"
              >
                <input
                  type="url"
                  required
                  value={deliverableUrl}
                  onChange={e => setDeliverableUrl(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-gray-300 rounded-xl outline-none"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md cursor-pointer"
                >
                  Submit for Client Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { AppointmentBooking, ProjectContract, ServiceItem } from '../../types';
import { PdfService } from '../../services/pdfService';
import { FormField } from '../../components/common/FormField';
import { RoleSidebar, SidebarItem } from '../../components/layout/RoleSidebar';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard shell.
 *
 * Owns: header banner, KPI tiles, sidebar, all data fetching, payout modal,
 * deliverable modal. Tabs receive everything via `<Outlet context={...} />`.
 *
 * The shell keeps the modals so they overlay both sidebar and main content
 * rather than being trapped inside a tab card.
 */
export const ExpertDashboard: React.FC = () => {
  const { user } = useAuth();
  const reactNavigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [projects, setProjects] = useState<ProjectContract[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout modal
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('5000');
  const [payoutMethod, setPayoutMethod] = useState<'BKASH' | 'BANK'>('BKASH');
  const [payoutTarget, setPayoutTarget] = useState('01712345678');
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
    const [appts, projs, srvs] = await Promise.all([
      ApiService.getExpertAppointments(),
      ApiService.getExpertProjects(),
      ApiService.getServices({ expertId: 'exp-doc-1' }),
    ]);
    setAppointments(appts);
    setProjects(projs);
    setServices(srvs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadExpertData();
  }, [loadExpertData]);

  const totalHeldEscrow = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS')
        .reduce((acc, a) => acc + a.priceBDT * 0.88, 0),
    [appointments],
  );

  // Simulated cleared net earnings (kept in sync with the previous monolith).
  const availableBalance = 24500;

  const handleJoinConsultation = useCallback(
    (consultationId: string) => {
      if (typeof window !== 'undefined') {
        window.location.hash = `#consultation=${encodeURIComponent(consultationId)}`;
      }
    },
    [],
  );

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setIsPayoutModalOpen(false);
    }, 2000);
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
      loading,
      reload: loadExpertData,
      totalHeldEscrow,
      availableBalance,
      handleJoinConsultation,
      openPayoutModal: () => setIsPayoutModalOpen(true),
      openDeliverableModal: (projectId: string, milestoneId: string) =>
        setSelectedMilestone({ projectId, milestoneId }),
    }),
    [
      appointments,
      projects,
      services,
      loading,
      loadExpertData,
      totalHeldEscrow,
      handleJoinConsultation,
    ],
  );

  const sidebarItems = useMemo<SidebarItem[]>(
    () => [
      { label: 'Overview', to: '/portal/expert', icon: Building2, accent: 'blue', end: true },
      { label: 'Consultations', to: '/portal/expert/consultations', icon: Calendar, badge: appointments.length, accent: 'blue' },
      { label: 'Milestone Projects', to: '/portal/expert/projects', icon: Building2, badge: projects.length, accent: 'blue' },
    ],
    [appointments.length, projects.length],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#111827] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={
              user?.avatarUrl ||
              'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80'
            }
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/30"
          />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Verified Provider Portal
            </span>
            <h1 className="text-2xl font-black text-white">{user?.name || 'Dr. Rahim Ahmed'}</h1>
            <p className="text-xs text-gray-400">
              BMDC Reg: A-89421 • Cardiology & Telemedicine Specialist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              PdfService.generateExpertStatementPdf(
                user?.name || 'Dr. Rahim Ahmed',
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
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Balance Payout</span>
          </button>
        </div>
      </div>

      {/* Sidebar + Outlet */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RoleSidebar role="expert" title="Provider Portal" items={sidebarItems} />
        </aside>

        <main className="space-y-6 min-w-0">
          <Outlet context={outletCtx} />
        </main>
      </div>

      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Request Earnings Withdrawal</h3>
            <p className="text-xs text-gray-500">
              Withdraw directly to your verified bKash Merchant Wallet or Commercial Bank Account
              in Bangladesh.
            </p>

            {payoutSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 text-emerald-900">
                <CheckCircle2 className="w-8 h-8 text-[#34C759] mx-auto" />
                <p className="font-bold text-sm">Payout Dispatched!</p>
                <p className="text-xs text-emerald-700">
                  Funds transferred via BEFTN/MFS instant settlement.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <FormField label="Withdrawal Method">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('BKASH')}
                      className={`p-2 rounded-xl text-xs font-bold border ${
                        payoutMethod === 'BKASH'
                          ? 'border-[#E2136E] bg-[#E2136E]/10 text-[#E2136E]'
                          : 'border-gray-200'
                      }`}
                    >
                      bKash (MFS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('BANK')}
                      className={`p-2 rounded-xl text-xs font-bold border ${
                        payoutMethod === 'BANK'
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200'
                      }`}
                    >
                      Bank Transfer (BEFTN)
                    </button>
                  </div>
                </FormField>

                <FormField label="Account / Mobile Number" required>
                  <input
                    type="text"
                    required
                    value={payoutTarget}
                    onChange={(e) => setPayoutTarget(e.target.value)}
                    className="w-full p-2 text-xs font-mono bg-white border border-gray-300 rounded-xl outline-none"
                  />
                </FormField>

                <FormField label="Amount (BDT)" required>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={availableBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full p-2 text-xs font-mono bg-white border border-gray-300 rounded-xl outline-none"
                  />
                </FormField>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md cursor-pointer"
                  >
                    Confirm Payout
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
            <h3 className="text-lg font-bold text-gray-900">Upload Milestone Deliverable</h3>
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
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-gray-300 rounded-xl outline-none"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
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
export { ExpertDashboard as ExpertDashboardComponent };
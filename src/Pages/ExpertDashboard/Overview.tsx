import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Calendar } from 'lucide-react';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Overview tab (default).
 *
 * Renders the four KPI tiles + the 2-column grid that the legacy monolith
 * showed: scheduled consultations on the left, milestone projects on the right.
 * Each row in those lists keeps its inline action button.
 */
export const OverviewTab: React.FC = () => {
  const {
    appointments,
    projects,
    loading,
    availableBalance,
    totalHeldEscrow,
    handleJoinConsultation,
    openDeliverableModal,
  } = useOutletContext<ExpertOutletContext>();

  return (
    <div className="space-y-8">
      {/* Financial Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Available for Payout
          </span>
          <MoneyValue amount={availableBalance} className="text-2xl font-bold text-gray-900" />
          <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
            Cleared Net Funds (12% Fee Deducted)
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Held in Escrow Trust
          </span>
          <MoneyValue amount={totalHeldEscrow} className="text-2xl font-bold text-amber-600" />
          <span className="text-[11px] text-gray-500 mt-1 block">
            Releases upon consultation finish
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Completed Consultations
          </span>
          <h3 className="text-2xl font-bold text-gray-900">48</h3>
          <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
            100% On-Time Completion
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Platform Commission Rate
          </span>
          <h3 className="text-2xl font-bold text-gray-900">12%</h3>
          <span className="text-[11px] text-gray-500 mt-1 block">Tier 1 Verified Specialist</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-busy="true" aria-live="polite">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Patient Appointments */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Scheduled Consultations ({appointments.length})
              </h3>
            </div>

            <div className="space-y-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{appt.customerName}</span>
                    <StatusPill status={appt.status} />
                  </div>

                  <p className="text-xs text-gray-600 font-medium">{appt.serviceTitle}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60 flex-wrap gap-2">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <DateTimeValue isoDate={appt.slotStartTimeUtc} />
                    </span>

                    <button
                      onClick={() =>
                        handleJoinConsultation(appt.consultationId || `room-${appt.id}`)
                      }
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Doctor Room & Rx Pad</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Milestone Contracts */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Milestone Engineering Projects
              </h3>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{proj.serviceTitle}</h4>
                      <p className="text-xs text-gray-500">Client: {proj.customerName}</p>
                    </div>
                    <StatusPill status={proj.status} />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200/60">
                    {proj.milestones.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-gray-100"
                      >
                        <div>
                          <span className="font-semibold text-gray-800">
                            #{idx + 1} {m.title}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            <MoneyValue amount={m.amountBDT} />
                          </span>
                        </div>

                        {m.status === 'PENDING' ? (
                          <button
                            onClick={() => openDeliverableModal(proj.id, m.id)}
                            className="px-3 py-1 bg-[#111827] text-white font-bold text-[11px] rounded-lg hover:bg-gray-800 cursor-pointer flex items-center gap-1"
                          >
                            Submit Deliverable
                          </button>
                        ) : (
                          <StatusPill status={m.status} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
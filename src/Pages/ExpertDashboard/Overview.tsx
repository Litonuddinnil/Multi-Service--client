import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowUpRight, Building2, Calendar, Wallet } from 'lucide-react';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import { EmptyState } from '../../components/common/EmptyState';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Overview tab (default).
 *
 * Four KPI tiles over a 2-column grid: upcoming consultations on the left,
 * milestone projects on the right. Every figure is derived in the shell from
 * the ledger and the booking/project lists — nothing here is hardcoded.
 */
export const OverviewTab: React.FC = () => {
  const {
    appointments,
    projects,
    loading,
    availableBalance,
    totalHeldEscrow,
    pendingPayoutTotal,
    lifetimeEarnings,
    completedEngagements,
    commissionRate,
    handleJoinConsultation,
    openDeliverableModal,
    openPayoutModal,
  } = useOutletContext<ExpertOutletContext>();

  // Soonest first, and only sessions that have not already happened.
  const upcoming = [...appointments]
    .filter(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED')
    .sort(
      (a, b) =>
        new Date(a.slotStartTimeUtc).getTime() - new Date(b.slotStartTimeUtc).getTime(),
    )
    .slice(0, 5);

  const activeProjects = projects.filter(p => p.status !== 'COMPLETED').slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Financial Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Available for Payout
          </span>
          <MoneyValue amount={availableBalance} className="text-2xl font-bold " />
          <button
            onClick={openPayoutModal}
            className="text-[11px] text-blue-600 font-semibold mt-1 inline-flex items-center gap-0.5 cursor-pointer hover:text-blue-700"
          >
            Withdraw now <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Held in Escrow Trust
          </span>
          <MoneyValue amount={totalHeldEscrow} className="text-2xl font-bold text-amber-600" />
          <span className="text-[11px] text-gray-500 mt-1 block">
            {pendingPayoutTotal > 0 ? (
              <>
                <MoneyValue amount={pendingPayoutTotal} /> payout in transit
              </>
            ) : (
              'Releases when the engagement completes'
            )}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Completed Engagements
          </span>
          <h3 className="text-2xl font-bold ">{completedEngagements}</h3>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Lifetime net <MoneyValue amount={lifetimeEarnings} />
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Platform Commission Rate
          </span>
          <h3 className="text-2xl font-bold ">
            {(commissionRate * 100).toFixed(0)}%
          </h3>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Deducted before escrow release
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-busy="true" aria-live="polite">
          {[0, 1].map(i => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Upcoming consultations */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
            <h3 className="text-lg font-bold  flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Consultations ({upcoming.length})
            </h3>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nothing scheduled"
                description="Confirmed client bookings will show up here with a join link."
                className="my-0"
              />
            ) : (
              <div className="space-y-4">
                {upcoming.map(appt => (
                  <div
                    key={appt.id}
                    className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold ">{appt.customerName}</span>
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
                        <span>Open Doctor Room &amp; Rx Pad</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Milestone contracts */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
            <h3 className="text-lg font-bold  flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Active Milestone Projects ({activeProjects.length})
            </h3>

            {activeProjects.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No active contracts"
                description="Accepted engineering or software milestone contracts appear here."
                className="my-0"
              />
            ) : (
              <div className="space-y-4">
                {activeProjects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold  truncate">
                          {proj.serviceTitle}
                        </h4>
                        <p className="text-xs text-gray-500">Client: {proj.customerName}</p>
                      </div>
                      <StatusPill status={proj.status} />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200/60">
                      {proj.milestones.map((m, idx) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 text-xs p-2 bg-white rounded-lg border border-gray-100"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-800">
                              #{idx + 1} {m.title}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              <MoneyValue amount={m.amountBDT} />
                            </span>
                          </div>

                          {m.status === 'FUNDED' ? (
                            <button
                              onClick={() => openDeliverableModal(proj.id, m.id)}
                              className="px-3 py-1 bg-[#111827] text-white font-bold text-[11px] rounded-lg hover:bg-gray-800 cursor-pointer shrink-0"
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;

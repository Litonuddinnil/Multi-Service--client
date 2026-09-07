import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, Download, Upload } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { PdfService } from '../../services/pdfService';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Milestone Projects tab.
 *
 * Full-list view of every milestone engineering contract assigned to this
 * expert. Each milestone row exposes Submit Deliverable (opens shell-level
 * modal via `openDeliverableModal`) and each project has a contract PDF
 * download.
 */
export const ExpertProjectsTab: React.FC = () => {
  const { projects, loading, openDeliverableModal } = useOutletContext<ExpertOutletContext>();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No Active Milestone Contracts"
        description="Engineering / software milestone contracts accepted from clients will appear here."
      />
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold  flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          Milestone Contracts ({projects.length})
        </h3>
      </div>

      <div className="space-y-4">
        {projects.map((proj) => (
          <div key={proj.id} className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold ">{proj.serviceTitle}</h4>
                <p className="text-xs text-gray-500">Client: {proj.customerName}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={proj.status} />
                <button
                  onClick={() => PdfService.generateProjectContractPdf(proj)}
                  className="p-1.5 text-gray-500 hover: bg-white border border-gray-200 rounded-lg cursor-pointer transition-colors"
                  title="Download Contract & Escrow Deed PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
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

                  {m.status === 'FUNDED' ? (
                    <button
                      onClick={() => openDeliverableModal(proj.id, m.id)}
                      className="px-3 py-1 bg-[#111827] text-white font-bold text-[11px] rounded-lg hover:bg-gray-800 cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
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
  );
};

export default ExpertProjectsTab;
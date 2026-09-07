import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, Download } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { PdfService } from '../../services/pdfService';
import type { CustomerOutletContext } from './CustomerOutletContext';

 
export const ProjectsTab: React.FC = () => {
  const { projects, loading, handleNavigate, handlePayEscrow, releaseMilestone } =
    useOutletContext<CustomerOutletContext & { releaseMilestone: (projectId: string, milestoneId: string) => Promise<void> }>();

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No Milestone Projects"
        description="Initiate architectural, structural engineering, or software milestone contracts with Escrow."
        actionLabel="Request Quote"
        onAction={() => handleNavigate('catalog')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((proj) => (
        <div key={proj.id} className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <StatusPill status={proj.status} />
                <span className="text-xs text-gray-500 font-mono">ID: {proj.id}</span>
              </div>
              <h3 className="text-lg font-bold  mt-1">{proj.serviceTitle}</h3>
              <p className="text-xs text-gray-500">Lead Consultant: {proj.expertName}</p>
            </div>

            <div className="text-right flex flex-col items-end gap-1.5">
              <span className="text-xs text-gray-500 block">Total Contract Value</span>
              <MoneyValue amount={proj.totalAmountBDT} className="text-xl font-bold " />
              <button
                onClick={() => PdfService.generateProjectContractPdf(proj)}
                className="mt-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#34C759]" />
                <span>Contract & Deed PDF</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Escrow Milestones ({proj.milestones.length})
            </h4>

            <div className="space-y-3">
              {proj.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold ">
                        #{idx + 1} {m.description}
                      </span>
                      <StatusPill status={m.status} />
                    </div>
                    <p className="text-xs text-gray-600">{m.description}</p>
                    {m.deliverableFiles && m.deliverableFiles.length > 0 && (
                      <a
                        href={m.deliverableFiles[0].url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold pt-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Inspect Deliverable Blueprint / Code Pack
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <MoneyValue amount={m.amountBDT} className="text-sm font-bold " />

                    {m.status === 'DELIVERED' ? (
                      <button
                        onClick={() => releaseMilestone(proj.id, m.id)}
                        className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Approve & Release Escrow
                      </button>
                    ) : m.status === 'PENDING' ? (
                      <button
                        onClick={() => handlePayEscrow('PROJECT', proj.id, m.amountBDT, m.description)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Fund Escrow
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                        Released
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectsTab;
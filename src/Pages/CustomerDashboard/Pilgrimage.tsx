import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { MaskedFieldDisplay } from '../../components/common/MaskedFieldDisplay';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { PdfService } from '../../services/pdfService';
import type { CustomerOutletContext } from './CustomerOutletContext';

/**
 * Customer Dashboard → Hajj & Umrah Trips tab.
 *
 * Lists each pilgrimage booking with the package title, agency, total
 * escrow paid, voucher download, and the registered pilgrim manifest
 * (passport numbers masked).
 */
export const PilgrimageTab: React.FC = () => {
  const { pilgrimages, loading, handleNavigate } = useOutletContext<CustomerOutletContext>();

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-40" />
        ))}
      </div>
    );
  }

  if (pilgrimages.length === 0) {
    return (
      <EmptyState
        title="No Pilgrimage Bookings"
        description="Explore Ministry-verified Hajj & Umrah departures with seat lock guarantees."
        actionLabel="View Pilgrimage Packages"
        onAction={() => handleNavigate('catalog', { categoryId: 'cat-hajj' })}
      />
    );
  }

  return (
    <div className="space-y-4">
      {pilgrimages.map((pkg) => (
        <div key={pkg.id} className="bg-white border border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <StatusPill status={pkg.status} />
                <span className="text-xs font-mono text-gray-500">PNR: {pkg.id}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-1">{pkg.packageTitle}</h3>
              <p className="text-xs text-emerald-800 font-semibold">{pkg.agencyName}</p>
            </div>

            <div className="text-right flex flex-col items-end gap-1.5">
              <span className="text-xs text-gray-500 block">Total Escrow Paid</span>
              <MoneyValue amount={pkg.totalAmountBDT} className="text-xl font-bold text-gray-900" />
              <button
                onClick={() => PdfService.generatePilgrimageVoucherPdf(pkg)}
                className="mt-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-emerald-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#34C759]" />
                <span>Travel Voucher & Manifest PDF</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Registered Pilgrim Manifest ({pkg.travelers.length} Travelers)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pkg.travelers.map((tr, i) => (
                <div key={i} className="p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-gray-900">
                    {tr.fullName} ({tr.gender})
                  </p>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>Passport:</span>
                    <MaskedFieldDisplay value={tr.passportNumber} maskLength={4} />
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

export default PilgrimageTab;
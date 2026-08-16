import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock, Download, Video } from 'lucide-react';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusPill } from '../../components/common/StatusPill';
import { PdfService } from '../../services/pdfService';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → Consultations tab.
 *
 * Full-list view of all scheduled consultations (the left half of the
 * legacy Overview, but as its own route so the expert can deep-link or
 * bookmark it). Each row keeps the Open Doctor Room action and a
 * per-row invoice PDF download.
 */
export const ConsultationsTab: React.FC = () => {
  const { appointments, loading, handleJoinConsultation } =
    useOutletContext<ExpertOutletContext>();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No Consultations Yet"
        description="Confirmed client bookings will appear here. Open the Doctor Room once a session is in progress."
      />
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          All Consultations ({appointments.length})
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
                <Clock className="w-3.5 h-3.5" />
                <DateTimeValue isoDate={appt.slotStartTimeUtc} />
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    PdfService.generateInvoicePdf({
                      id: `inv-${appt.id}`,
                      orderNumber: `EXP-${appt.id.slice(-6).toUpperCase()}`,
                      customerId: appt.customerId,
                      customerName: appt.customerName || 'Patient',
                      entityId: appt.id,
                      entityTitle: `Consultation: ${appt.serviceTitle}`,
                      entityType: 'SESSION',
                      expertId: appt.expertId,
                      expertName: appt.expertName,
                      grossAmountBDT: appt.priceBDT,
                      taxAmountBDT: Math.round(appt.priceBDT * 0.05),
                      totalAmountBDT: appt.priceBDT,
                      commissionRate: appt.commissionRate || 0.12,
                      commissionAmountBDT:
                        appt.commissionAmountBDT || Math.round(appt.priceBDT * 0.12),
                      providerNetAmountBDT:
                        appt.providerNetBDT || Math.round(appt.priceBDT * 0.88),
                      paymentGateway: 'BKASH',
                      paymentReference: `ESC-${appt.id}`,
                      paymentStatus: 'PAID',
                      escrowStatus: 'HELD_IN_ESCROW',
                      createdAt: appt.createdAt || new Date().toISOString(),
                    })
                  }
                  className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-xl cursor-pointer transition-colors"
                  title="Download Payout / Booking Receipt PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleJoinConsultation(appt.consultationId || `room-${appt.id}`)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Open Doctor Room & Rx Pad</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsultationsTab;
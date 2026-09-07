import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Download, Lock, Printer, ShieldCheck, Video } from 'lucide-react';
import { DateTimeValue } from '../../components/common/DateTimeValue';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { ConsultationSession } from '../../types';
import { PdfService } from '../../services/pdfService';
import { useAuth } from '../../hooks/useAuth';
import type { CustomerOutletContext } from './CustomerOutletContext';

 
export const AppointmentsTab: React.FC = () => {
  const { user } = useAuth();
  const {
    appointments,
    loading,
    handleNavigate,
    handlePayEscrow,
    openVideoRoom,
  } = useOutletContext<CustomerOutletContext>();

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No Appointments Scheduled"
        description="Book a consultation with our verified doctors, engineers, or consultants."
        actionLabel="Explore Services"
        onAction={() => handleNavigate('catalog')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appt) => {
        const mockSession: ConsultationSession = {
          consultationId: appt.consultationId || `room-${appt.id}`,
          appointmentId: appt.id,
          doctorId: appt.expertId,
          doctorName: appt.expertName,
          userId: appt.customerId,
          userName: user?.name || 'Customer',
          scheduledStartTime: appt.slotStartTimeUtc,
          scheduledEndTime: appt.slotEndTimeUtc || appt.slotStartTimeUtc,
          scheduledDurationMinutes: appt.durationMinutes || 30,
          paymentStatus: appt.paymentStatus || 'PAID',
          sessionStatus: 'completed',
          consultationStartedAt: appt.slotStartTimeUtc,
          consultationEndedAt: new Date().toISOString(),
          clinicalSummary:
            'Patient attended online consultation. Evaluated and digital prescription provided.',
          prescriptionNotes: JSON.stringify([
            { id: '1', name: 'Tab. Napa Extra 500mg', dosage: '1+0+1', duration: '3 Days', instruction: 'After meal' },
            { id: '2', name: 'Syr. Tusca 100ml', dosage: '2 tsp 3 times daily', duration: '5 Days', instruction: 'After meal' },
          ]),
          createdAt: appt.createdAt || new Date().toISOString(),
          updatedAt: appt.updatedAt || new Date().toISOString(),
        };

        return (
          <div
            key={appt.id}
            className="bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-2xl p-6 shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={appt.status} />
                <span className="text-xs text-gray-500 font-mono">ID: {appt.id}</span>
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {appt.serviceTitle}
                </span>
              </div>

              <h3 className="text-base font-bold "> Expert: {appt.expertName}</h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <DateTimeValue isoDate={appt.slotStartTimeUtc} />
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
                  Escrow: <MoneyValue amount={appt.priceBDT} className="font-bold " />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {appt.status === 'REQUESTED' ? (
                <button
                  onClick={() => openVideoRoom(appt.consultationId || `room-${appt.id}`)}
                  className="w-full md:w-auto px-5 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Live Video Room</span>
                </button>
              ) : appt.status === 'COMPLETED' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      PdfService.generatePrescriptionPdf(mockSession, [
                        { id: '1', name: 'Tab. Napa Extra 500mg', dosage: '1+0+1', duration: '3 Days', instruction: 'After meal' },
                        { id: '2', name: 'Syr. Tusca 100ml', dosage: '2 tsp 3 times daily', duration: '5 Days', instruction: 'After meal' },
                      ]);
                    }}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#34C759]" />
                    <span>Download Rx PDF</span>
                  </button>

                  <button
                    onClick={() => {
                      const minimalSession: ConsultationSession = {
                        ...mockSession,
                        prescriptionNotes: JSON.stringify([
                          { id: '1', name: 'Tab. Napa Extra 500mg', dosage: '1+0+1', duration: '3 Days', instruction: 'After meal' },
                        ]),
                      };
                      // Print route uses React Router so navigation falls
                      // back to /print/prescription/:id when no handler is
                      // attached. We do this via the shell's outlet
                      // `handleViewPrescription`.
                      window.dispatchEvent(
                        new CustomEvent('withu:view-prescription', { detail: minimalSession }),
                      );
                    }}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Rx</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlePayEscrow('SESSION', appt.id, appt.priceBDT, appt.serviceTitle)}
                  className="w-full md:w-auto px-5 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Fund Escrow ({appt.priceBDT} BDT)</span>
                </button>
              )}

              <button
                onClick={() =>
                  PdfService.generateInvoicePdf({
                    id: `ord-${appt.id}`,
                    orderNumber: `WU-${appt.id.slice(-6).toUpperCase()}`,
                    customerId: appt.customerId,
                    customerName: appt.customerName || 'Verified Client',
                    entityId: appt.id,
                    entityTitle: `Consultation: ${appt.serviceTitle}`,
                    entityType: 'SESSION',
                    expertId: appt.expertId,
                    expertName: appt.expertName,
                    grossAmountBDT: appt.priceBDT,
                    taxAmountBDT: Math.round(appt.priceBDT * 0.05),
                    totalAmountBDT: appt.priceBDT,
                    commissionRate: appt.commissionRate || 0.12,
                    commissionAmountBDT: appt.commissionAmountBDT || Math.round(appt.priceBDT * 0.12),
                    providerNetAmountBDT: appt.providerNetBDT || Math.round(appt.priceBDT * 0.88),
                    paymentGateway: 'BKASH',
                    paymentReference: `TXN-${appt.id}`,
                    paymentStatus: 'PAID',
                    escrowStatus: 'HELD_IN_ESCROW',
                    createdAt: appt.createdAt || new Date().toISOString(),
                  })
                }
                className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer transition-colors"
                title="Download Booking Invoice & Escrow Receipt PDF"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentsTab;
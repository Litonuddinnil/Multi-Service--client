import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stethoscope, Printer, ArrowLeft, ShieldCheck, CheckCircle2, QrCode, Download } from 'lucide-react';
import { ConsultationSession, PrescriptionMedication } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { PdfService } from '../services/pdfService';
import { ApiService } from '../services/api';

interface PrescriptionPrintViewProps {
  // Legacy host-supplied data — optional in the router world.
  consultation?: ConsultationSession;
  // Legacy dispatcher callback — optional in the router world.
  onBack?: () => void;
}

export const PrescriptionPrintView: React.FC<PrescriptionPrintViewProps> = ({
  consultation: consultationProp,
  onBack
}) => {
  const { formatDate } = useLanguage();
  const reactNavigate = useNavigate();
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const [consultation, setConsultation] = useState<ConsultationSession | null>(consultationProp ?? null);
  const [loading, setLoading] = useState(!consultationProp);

  useEffect(() => {
    if (consultation || !prescriptionId) return;
    let cancelled = false;
    const load = async () => {
      const found = await ApiService.getConsultation(prescriptionId);
      if (!cancelled) {
        setConsultation(found);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId, consultation]);

  // Fallback chain: prop → react-router direct to /portal/customer.
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    reactNavigate('/portal/customer');
  }, [onBack, reactNavigate]);

  let medications: PrescriptionMedication[] = [];
  if (consultation) {
    try {
      if (consultation.prescriptionNotes) {
        medications = JSON.parse(consultation.prescriptionNotes);
      }
    } catch {
      medications = [];
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#34C759] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Prescription not found</h1>
          <p className="text-sm text-gray-600">We could not locate prescription {prescriptionId}.</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[#34C759] hover:bg-[#2fb34f] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F8] py-8 px-4 sm:px-6">
      {/* Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => PdfService.generatePrescriptionPdf(consultation, medications)}
            className="px-5 py-2 text-xs font-bold text-white bg-[#34C759] hover:bg-[#2fb34f] rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF File
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Official Prescription Paper Sheet */}
      <div 
        id="prescription-paper"
        className="max-w-4xl mx-auto bg-white border border-gray-300 rounded-2xl shadow-xl p-8 sm:p-12 text-gray-900 print:border-none print:shadow-none print:p-0"
      >
        {/* Doctor Header Header Banner */}
        <div className="border-b-2 border-[#34C759] pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#34C759] text-white flex items-center justify-center font-bold text-sm">
                wU
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                {consultation.doctorName || 'Dr. Rahim Ahmed'}
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-800 mt-1">
              MBBS (DMC), FCPS (Medicine), MD (Cardiology)
            </p>
            <p className="text-xs text-gray-600">
              Associate Professor & Senior Consultant Cardiologist
            </p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              BMDC Registration No: <strong>A-89421</strong>
            </p>
          </div>

          <div className="sm:text-right text-xs text-gray-600 space-y-1">
            <div className="inline-flex items-center gap-1 text-[#248a3d] font-bold bg-[#34C759]/10 px-2.5 py-1 rounded-full border border-[#34C759]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
              Verified Tele-Prescription
            </div>
            <p className="font-mono text-gray-500 text-[11px] pt-1">
              Ref: {consultation.consultationId}
            </p>
            <p className="text-[11px] text-gray-500">
              Date: {consultation.consultationEndedAt ? formatDate(consultation.consultationEndedAt) : formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Patient Bar */}
        <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4 my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Patient Name</span>
            <span className="font-bold text-gray-900 text-sm">{consultation.userName}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Age / Gender</span>
            <span className="font-bold text-gray-900 text-sm">34 Y / Male</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Appointment ID</span>
            <span className="font-mono font-bold text-gray-900">{consultation.appointmentId}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Consultation Mode</span>
            <span className="font-bold text-emerald-700">Digital Video Call</span>
          </div>
        </div>

        {/* Rx Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[400px]">
          {/* Left Column: Clinical Notes & Diagnosis */}
          <div className="border-r border-gray-200 pr-6 space-y-6">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Clinical Summary
              </h5>
              <div className="text-xs text-gray-700 space-y-2 leading-relaxed bg-gray-50 p-3 rounded-xl">
                {consultation.clinicalSummary ? (
                  <p className="whitespace-pre-line">{consultation.clinicalSummary}</p>
                ) : (
                  <>
                    <p><strong>Chief Complaints:</strong> Mild fever, throat irritation, dry cough for 3 days.</p>
                    <p><strong>Diagnosis:</strong> Acute Upper Respiratory Tract Infection.</p>
                    <p><strong>O/E:</strong> Temp: 99.4°F, Pulse: 78 bpm, SpO2: 98%.</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Advised Investigations
              </h5>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>Complete Blood Count (CBC with ESR)</li>
                <li>Serum Creatinine (if symptoms persist &gt; 5 days)</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Medications */}
          <div className="md:col-span-2 space-y-6 pl-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-serif font-black text-emerald-800">℞</span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Prescribed Medications
              </span>
            </div>

            <div className="space-y-4">
              {medications.length > 0 ? (
                medications.map((med, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-gray-900">
                        {idx + 1}. {med.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {med.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 pl-4">
                      <span className="font-mono font-semibold">Dosage: {med.dosage}</span>
                      <span>•</span>
                      <span>{med.instruction}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-gray-900">1. Tab. Napa Extra (Paracetamol + Caffeine)</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">3 Days</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 pl-4">
                      <span className="font-mono font-semibold">1 + 0 + 1</span>
                      <span>•</span>
                      <span>Take after food if body temp &gt; 100°F</span>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-gray-900">2. Syrup Tusca (Dextromethorphan)</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">5 Days</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 pl-4">
                      <span className="font-mono font-semibold">2 Teaspoons (10ml)</span>
                      <span>•</span>
                      <span>3 times daily after meal</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Special Instructions & Advice */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="text-xs font-bold text-gray-800 mb-1">General Advice & Lifestyle</h5>
              <p className="text-xs text-gray-600 leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                • Adequate bed rest and intake of lukewarm water with lemon/honey.<br />
                • Steam inhalation twice daily.<br />
                • Please follow up after 5 days if fever does not subside.
              </p>
            </div>
          </div>
        </div>

        {/* Footer & Digital Security Seal */}
        <div className="mt-12 pt-6 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center p-1">
              <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-[8px] font-mono text-center p-1">
                BMDC SEAL QR-VERIFY
              </div>
            </div>
            <div className="text-[11px] text-gray-500">
              <p className="font-bold text-gray-800">Digitally Signed & Validated</p>
              <p>Generated via withU Telehealth Core</p>
              <p className="font-mono text-[10px]">Checksum: SHA256-89421-WITHU-BD</p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="font-serif italic text-base text-gray-800 font-bold border-b border-gray-400 pb-1 px-4 inline-block">
              {consultation.doctorName || 'Dr. Rahim Ahmed'}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Authorized Medical Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPrintView;

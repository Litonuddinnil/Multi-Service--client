import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  ShieldCheck,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

import { ServiceItem, ServicePackage } from '../types';
import { ApiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { MoneyValue } from '../components/common/MoneyValue';
import { FormField } from '../components/common/FormField';

/** Outlet context shape provided by `router/Layout/Main.tsx`. */
interface BookingOutletContext {
  currentView: string;
  viewParams: Record<string, any>;
  navigate: (view: string, params?: Record<string, any>) => void;
  onOpenAuth: () => void;
  onPayEscrow: (payload: unknown, ...rest: unknown[]) => void;
}

const TIME_SLOTS = [
  '10:00', '11:00', '12:00',
  '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
];

export const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const reactNavigate = useNavigate();
  const ctx = useOutletContext<BookingOutletContext>();
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();

  // Data state
  const [service, setService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const preselectedPackageId = searchParams.get('packageId') || undefined;
  const [activePackage, setActivePackage] = useState<ServicePackage | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('18:00');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Next 5 calendar days
  const availableDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i + 1);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  // Load service by id
  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const s = await ApiService.getServiceById(serviceId);
        if (cancelled) return;
        if (!s) {
          setLoadError('Service not found.');
        } else {
          setService(s);
          const initialPkg =
            s.packages.find(p => p.id === preselectedPackageId) ??
            s.packages[0] ??
            null;
          setActivePackage(initialPkg);
        }
      } catch {
        if (!cancelled) setLoadError('Unable to load service. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, preselectedPackageId]);

  // Default the date picker to the first available day
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  const handleBack = useCallback(() => {
    if (serviceId) {
      reactNavigate(`/services/${serviceId}`);
    } else if (ctx?.navigate) {
      ctx.navigate('catalog');
    } else {
      reactNavigate('/catalog');
    }
  }, [serviceId, ctx, reactNavigate]);

  const handleConfirm = useCallback(async () => {
    if (!service || !activePackage || !selectedDate) return;
    if (!isAuthenticated) {
      if (ctx?.onOpenAuth) ctx.onOpenAuth();
      else reactNavigate('/login?redirect=' + encodeURIComponent(location.pathname + location.search));
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);
    try {
      const res = await ApiService.createBooking({
        serviceId: service.id,
        packageId: activePackage.id,
        slotStartTimeUtc: slotDate.toISOString(),
        customerNote: customerNote.trim() || undefined,
      });
      if (res.success && res.booking) {
        // Open the global escrow-payment modal via the event bus
        // (same contract as ServiceDetailView used before).
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('withu:open-payment', {
              detail: {
                entityType: 'SESSION',
                entityId: res.booking.id,
                amountBDT: res.booking.priceBDT,
                title: `${service.title} (${activePackage.title})`,
              },
            }),
          );
        }
        // Bounce to the customer portal so the booking is visible
        if (ctx?.navigate) ctx.navigate('customer');
        else reactNavigate('/portal/customer');
      } else {
        setSubmitError(res.error || 'Unable to schedule booking. Please try again.');
      }
    } catch {
      setSubmitError('An unexpected booking error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }, [service, activePackage, selectedDate, selectedTimeSlot, customerNote, isAuthenticated, ctx, reactNavigate]);

  // --- Render: loading state ---
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#34C759] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading booking details...</p>
      </div>
    );
  }

  // --- Render: error state ---
  if (loadError || !service || !activePackage) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold ">{loadError || 'Booking unavailable'}</h2>
        <p className="text-sm text-gray-600">
          The service you're trying to book may have been removed or is no longer available.
        </p>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#34C759] hover:bg-[#2fb34f] text-white text-sm font-bold rounded-xl shadow-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to service
        </button>
      </div>
    );
  }

  const isOnline = service.consultationMode !== 'IN_PERSON';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back link */}
      <button
        onClick={handleBack}
        className="text-xs font-bold text-gray-600 hover: flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to service
      </button>

      {/* Header card */}
      <header className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs flex items-start gap-4">
        <img
          src={service.expertAvatar}
          alt={service.expertName}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-[#34C759]/30 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full inline-block">
            {service.categoryName}
          </span>
          <h1 className="text-xl sm:text-2xl font-black  mt-2 leading-tight">
            {service.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            with <span className="font-semibold text-gray-700">{service.expertName}</span>
            {' '}•{' '}
            <span className="inline-flex items-center gap-1">
              {isOnline ? (
                <>
                  <Video className="w-3.5 h-3.5 text-blue-600" /> Live Video Room
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-amber-600" /> In-Person Consultation
                </>
              )}
            </span>
          </p>
        </div>
      </header>

      {/* Error banner */}
      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form sections */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-6">
        {/* 1. Package */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
            1. {t('packagesTab')}
          </label>
          <div className="space-y-2">
            {service.packages.map((pkg) => {
              const isSelected = activePackage.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setActivePackage(pkg)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#34C759] bg-[#34C759]/5 ring-2 ring-[#34C759]/20'
                      : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold ">{pkg.title}</span>
                      {pkg.durationMinutes && (
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {pkg.durationMinutes}m
                        </span>
                      )}
                    </div>
                    {pkg.features.length > 0 && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                        {pkg.features.slice(0, 2).map((f, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#34C759]" /> {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <MoneyValue amount={pkg.priceBDT} className="text-base  font-bold" />
                    <span className="text-[10px] block text-gray-400">Total BDT</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Date */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
            2. {t('selectDate')}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {availableDates.map((d, idx) => {
              const isSelected =
                !!selectedDate && d.toDateString() === selectedDate.toDateString();
              const dayName = d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                weekday: 'short',
              });
              const dayNum = d.getDate();
              const month = d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
                month: 'short',
              });
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`py-2.5 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-[#34C759] text-white border-[#34C759] shadow-sm'
                      : 'bg-white  border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold opacity-80">
                    {dayName}
                  </span>
                  <span className="text-sm font-bold">{dayNum}</span>
                  <span className="text-[10px] opacity-80">{month}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Time slot */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              3. {t('selectTimeSlot')}
            </label>
            <span className="text-[11px] text-gray-500 font-medium">
              Asia/Dhaka (GMT+6)
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedTimeSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111827] text-white border-[#111827]'
                      : 'bg-white text-gray-700 border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode hint */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-blue-900">
          {isOnline ? (
            <Video className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">
              {isOnline ? 'Live Video Consultation Room' : 'In-Person Consultation'}
            </p>
            <p className="text-blue-700/80 mt-0.5">
              {isOnline
                ? 'You will receive direct browser video room access upon checkout.'
                : 'Clinic location and gate pass will be provided in receipt.'}
            </p>
          </div>
        </div>

        {/* 4. Note */}
        <FormField label={t('healthConcernLabel')} helpText="Briefly describe your symptoms or query (optional)">
          <textarea
            rows={3}
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            placeholder="e.g., Follow up on lab tests or architectural floor plan review..."
            className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759] outline-none"
          />
        </FormField>

        {/* Escrow guarantee */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
          <span>
            Funds held safely in <strong>withU Escrow</strong> until session concludes.
          </span>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4 sticky bottom-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Total to Pay</span>
          <MoneyValue amount={activePackage.priceBDT} className="text-xl  font-bold" />
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || !selectedDate}
          className="w-full py-3.5 px-4 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Scheduling...</span>
          ) : (
            <>
              <span>
                {isAuthenticated ? 'Proceed to Escrow Payment' : 'Log In & Book'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
          100% Escrow Protected by withU.
        </p>
      </section>
    </div>
  );
};

export default BookingPage;
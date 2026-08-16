import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  ShieldCheck, 
  Check, 
  Info,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { ServiceItem, ServicePackage } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { MoneyValue } from '../common/MoneyValue';
import { FormField } from '../common/FormField';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem;
  selectedPackage?: ServicePackage;
  onBookingSuccess: (bookingId: string, amountBDT: number, title: string) => void;
  onOpenAuth: () => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  isOpen,
  onClose,
  service,
  selectedPackage: initialPackage,
  onBookingSuccess,
  onOpenAuth
}) => {
  const { t, locale, formatBDT } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  const [activePackage, setActivePackage] = useState<ServicePackage>(
    initialPackage || service.packages[0] || {
      id: 'pkg-default',
      title: 'Consultation',
      priceBDT: service.startingPriceBDT,
      durationMinutes: 30,
      isBookable: true,
      features: ['One-on-one session', 'Digital notes']
    }
  );

  // Generate selectable dates (next 5 days)
  const today = new Date();
  const availableDates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i + 1);
    return d;
  });

  const [selectedDate, setSelectedDate] = useState<Date>(availableDates[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('18:00'); // 6:00 PM Dhaka
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const timeSlots = [
    '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Calculate full UTC ISO string for selected Dhaka slot
    const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    // Adjust to local/Dhaka representation
    slotDate.setHours(hours, minutes, 0, 0);

    try {
      const res = await ApiService.createBooking({
        serviceId: service.id,
        packageId: activePackage.id,
        slotStartTimeUtc: slotDate.toISOString(),
        customerNote: customerNote.trim() || undefined
      });

      if (res.success && res.booking) {
        onBookingSuccess(res.booking.id, res.booking.priceBDT, `${service.title} (${activePackage.title})`);
        onClose();
      } else {
        setError(res.error || 'Unable to schedule booking. Please try again.');
      }
    } catch {
      setError('An unexpected booking error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="booking-drawer-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div 
        id="booking-drawer"
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slideLeft"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E5E7EB] bg-[#F6F7F8] sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={service.expertAvatar}
                alt={service.expertName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#34C759]/30"
              />
              <div>
                <h3 className="text-base font-bold text-[#111827] line-clamp-1">{service.title}</h3>
                <p className="text-xs text-[#6B7280]">{service.expertName} • {service.categoryName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Package Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
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
                        <span className="text-sm font-bold text-[#111827]">{pkg.title}</span>
                        {pkg.durationMinutes && (
                          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {pkg.durationMinutes}m
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {pkg.features.slice(0, 2).map((f, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#34C759]" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <MoneyValue amount={pkg.priceBDT} className="text-base text-[#111827]" />
                      <span className="text-[10px] block text-gray-400">Total BDT</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Picker (Horizontal Cards) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
              2. {t('selectDate')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {availableDates.map((d, idx) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                const dayName = d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' });
                const dayNum = d.getDate();
                const month = d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' });

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`py-2.5 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#34C759] text-white border-[#34C759] shadow-sm'
                        : 'bg-white text-[#111827] border-[#E5E7EB] hover:bg-[#F6F7F8]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold opacity-80">{dayName}</span>
                    <span className="text-sm font-bold">{dayNum}</span>
                    <span className="text-[10px] opacity-80">{month}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots (Dhaka GMT+6) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                3. {t('selectTimeSlot')}
              </label>
              <span className="text-[11px] text-gray-500 font-medium">
                Asia/Dhaka (GMT+6)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-white text-gray-700 border-[#E5E7EB] hover:bg-[#F6F7F8]'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Info */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            {service.consultationMode === 'IN_PERSON' ? (
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <Video className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {service.consultationMode === 'IN_PERSON' ? 'In-Person Consultation' : 'Live Video Consultation Room'}
              </p>
              <p className="text-blue-700/80 mt-0.5">
                {service.consultationMode === 'IN_PERSON'
                  ? 'Clinic location and gate pass will be provided in receipt.'
                  : 'You will receive direct browser video room access upon checkout.'}
              </p>
            </div>
          </div>

          {/* Symptoms / Project requirements note */}
          <FormField label={t('healthConcernLabel')} helpText="Briefly describe your symptoms or query (optional)">
            <textarea
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g., Follow up on lab tests or architectural floor plan review..."
              className="w-full p-2.5 text-xs bg-white border border-[#E5E7EB] rounded-xl focus:ring-2 focus:ring-[#34C759]/30 focus:border-[#34C759] outline-none"
            />
          </FormField>

          {/* Escrow Guarantee Pill */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-[#34C759] shrink-0" />
            <span>Funds held safely in <strong>withU Escrow</strong> until session concludes.</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-[#E5E7EB] bg-[#F6F7F8] space-y-3 sticky bottom-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Total to Pay</span>
            <MoneyValue amount={activePackage.priceBDT} className="text-xl text-[#111827] font-bold" />
          </div>

          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#34C759] hover:bg-[#2fb34f] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Scheduling...</span>
            ) : (
              <>
                <span>{isAuthenticated ? 'Proceed to Escrow Payment' : 'Log In & Book'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Plane, Users, ShieldCheck, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { PilgrimagePackage } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { ApiService } from '../../services/api';
import { MoneyValue } from '../common/MoneyValue';
import { FormField } from '../common/FormField';

interface PilgrimageBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: PilgrimagePackage;
  onSuccess: (bookingId: string, amountBDT: number, title: string) => void;
  onOpenAuth: () => void;
}

interface TravelerForm {
  fullName: string;
  passportNumber: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
}

export const PilgrimageBookingModal: React.FC<PilgrimageBookingModalProps> = ({
  isOpen,
  onClose,
  pkg,
  onSuccess,
  onOpenAuth
}) => {
  const { isAuthenticated, user } = useAuth();
  const { t, formatBDT, formatDate } = useLanguage();

  const [selectedDepartureId, setSelectedDepartureId] = useState<string>(
    pkg.departures[0]?.id || ''
  );

  const [travelers, setTravelers] = useState<TravelerForm[]>([
    {
      fullName: user ? user.name : '',
      passportNumber: '',
      dateOfBirth: '1985-05-15',
      gender: 'MALE'
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDeparture = pkg.departures.find(d => d.id === selectedDepartureId) || pkg.departures[0];
  const maxSeats = currentDeparture ? currentDeparture.availableSeats : 1;

  const handleAddTraveler = () => {
    if (travelers.length >= maxSeats) {
      setError(`Only ${maxSeats} seats available on this flight.`);
      return;
    }
    setTravelers(prev => [
      ...prev,
      { fullName: '', passportNumber: '', dateOfBirth: '1990-01-01', gender: 'MALE' }
    ]);
  };

  const handleRemoveTraveler = (index: number) => {
    if (travelers.length === 1) return;
    setTravelers(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTraveler = (index: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const totalAmountBDT = pkg.pricePerTravelerBDT * travelers.length;

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    // Validate traveler names and passports
    for (let i = 0; i < travelers.length; i++) {
      if (!travelers[i].fullName.trim()) {
        setError(`Please enter full name for Pilgrim #${i + 1}`);
        return;
      }
      if (!travelers[i].passportNumber.trim()) {
        setError(`Please enter passport number for Pilgrim #${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await ApiService.bookPilgrimagePackage({
        packageId: pkg.id,
        departureId: selectedDepartureId,
        travelers
      });

      if (res.success && res.booking) {
        onSuccess(res.booking.id, totalAmountBDT, `${pkg.title} (${travelers.length} Travelers)`);
        onClose();
      } else {
        setError(res.error || 'Failed to reserve pilgrimage seats.');
      }
    } catch {
      setError('An error occurred during reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="pilgrimage-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064E3B] to-[#047857] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Plane className="w-5 h-5 text-emerald-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Authorized Hajj & Umrah Ministry Agency
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">{pkg.title}</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            {pkg.agencyName} • {pkg.durationDays} Days Package
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleReserve} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Departure Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
              1. Select Scheduled Flight & Departure
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pkg.departures.map(dep => {
                const isSelected = dep.id === selectedDepartureId;
                return (
                  <div
                    key={dep.id}
                    onClick={() => setSelectedDepartureId(dep.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#34C759] bg-[#34C759]/5 ring-2 ring-[#34C759]/20'
                        : 'border-[#E5E7EB] hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold  flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#34C759]" />
                        {formatDate(dep.departureDate)}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        dep.availableSeats < 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dep.availableSeats} seats left
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Return: {formatDate(dep.returnDate)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Passenger Manifest Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                2. Pilgrim Manifest Details ({travelers.length} Person{travelers.length > 1 ? 's' : ''})
              </label>
              <button
                type="button"
                onClick={handleAddTraveler}
                disabled={travelers.length >= maxSeats}
                className="text-xs text-[#34C759] font-bold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Traveler
              </button>
            </div>

            <div className="space-y-4">
              {travelers.map((traveler, idx) => (
                <div key={idx} className="p-4 bg-[#F6F7F8] border border-[#E5E7EB] rounded-xl space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      Pilgrim #{idx + 1}
                    </span>
                    {travelers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTraveler(idx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Full Name (as in Passport)" required>
                      <input
                        type="text"
                        required
                        value={traveler.fullName}
                        onChange={(e) => handleUpdateTraveler(idx, 'fullName', e.target.value)}
                        placeholder="e.g. MOHAMMED RAHMAN"
                        className="w-full p-2 text-xs uppercase bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759]"
                      />
                    </FormField>

                    <FormField label="Passport Number" required helpText="Stored securely and masked in receipts">
                      <input
                        type="text"
                        required
                        value={traveler.passportNumber}
                        onChange={(e) => handleUpdateTraveler(idx, 'passportNumber', e.target.value)}
                        placeholder="e.g. A01234567"
                        className="w-full p-2 text-xs uppercase font-mono bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759]"
                      />
                    </FormField>

                    <FormField label="Date of Birth" required>
                      <input
                        type="date"
                        required
                        value={traveler.dateOfBirth}
                        onChange={(e) => handleUpdateTraveler(idx, 'dateOfBirth', e.target.value)}
                        className="w-full p-2 text-xs bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759]"
                      />
                    </FormField>

                    <FormField label="Gender" required>
                      <select
                        value={traveler.gender}
                        onChange={(e) => handleUpdateTraveler(idx, 'gender', e.target.value as any)}
                        className="w-full p-2 text-xs bg-white border border-[#E5E7EB] rounded-lg outline-none focus:border-[#34C759]"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Escrow Notice */}
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-900">
              <span>Price per Pilgrim</span>
              <MoneyValue amount={pkg.pricePerTravelerBDT} />
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold border-t border-emerald-200/60 pt-2">
              <span>Total Package Cost ({travelers.length} Pilgrim{travelers.length > 1 ? 's' : ''})</span>
              <MoneyValue amount={totalAmountBDT} className="text-base text-emerald-950" />
            </div>
            <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
              Includes 30-minute provisional seat lock and Escrow Visa Guarantee.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-[#E5E7EB] bg-[#F6F7F8] flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs text-gray-500 block">Total Amount</span>
            <MoneyValue amount={totalAmountBDT} className="text-lg font-bold " />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReserve}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#34C759] hover:bg-[#2fb34f] rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Reserving...' : 'Reserve Seats & Pay Escrow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Award, Save, Sliders } from 'lucide-react';
import type { AdminOutletContext } from './AdminOutletContext';

 
export const ContentTab: React.FC = () => {
  const { commissions, loading, handleUpdateCommission } =
    useOutletContext<AdminOutletContext>();

  const [pendingValue, setPendingValue] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, number>>({});

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-64" aria-busy="true" />
    );
  }

  const handleSliderChange = (categoryId: string, value: number) => {
    setPendingValue((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = async (categoryId: string) => {
    const value = pendingValue[categoryId];
    if (value === undefined) return;

    setSaving((prev) => ({ ...prev, [categoryId]: true }));
    try {
      await handleUpdateCommission(categoryId, value);
      setLastSaved((prev) => ({ ...prev, [categoryId]: value }));
      setPendingValue((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    } finally {
      setSaving((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-3xl p-7 text-white shadow-xl flex items-start gap-5">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Award className="w-6 h-6 text-amber-300" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase font-bold tracking-widest text-amber-200 mb-1">
            Revenue Levers
          </p>
          <h3 className="text-2xl font-extrabold mb-2">Services &amp; Commission Engine</h3>
          <p className="text-amber-100 text-sm max-w-3xl">
            Adjust the platform's commission rate for every service category. These rates
            determine how much of each booking flows into multi-signature escrow before being
            released to experts. A higher rate increases platform revenue but may reduce expert
            sign-ups — balance carefully.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Category Commission Sliders</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {commissions.map((commission) => {
            const currentValue =
              pendingValue[commission.categoryId] !== undefined
                ? pendingValue[commission.categoryId]
                : commission.platformFeePercent;

            const isDirty = pendingValue[commission.categoryId] !== undefined;
            const lastValue = lastSaved[commission.categoryId];
            const isSaving = saving[commission.categoryId];

            return (
              <div
                key={commission.categoryId}
                className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
              >
                <div className="lg:col-span-4">
                  <p className="font-bold text-gray-900">{commission.categoryName}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {commission.categoryId}
                  </p>
                  {commission.tier && (
                    <p className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-bold text-indigo-700">
                      Tiered: {commission.tier.belowRatePercent}% under ৳
                      {commission.tier.thresholdBDT.toLocaleString()}, {commission.tier.atOrAboveRatePercent}% at
                      or above
                    </p>
                  )}
                </div>

                <div className="lg:col-span-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={25}
                      step={1}
                      value={currentValue}
                      onChange={(e) =>
                        handleSliderChange(commission.categoryId, Number(e.target.value))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-orange-600"
                      style={{
                        background: `linear-gradient(to right, #EA580C 0%, #EA580C ${((currentValue - 5) / 20) * 100}%, #E5E7EB ${((currentValue - 5) / 20) * 100}%, #E5E7EB 100%)`,
                      }}
                    />
                    <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 font-extrabold min-w-[70px] text-center text-sm">
                      {currentValue}%
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">
                    <span>5% (Minimum)</span>
                    <span>25% (Maximum)</span>
                  </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-1.5">
                  <button
                    onClick={() => handleSave(commission.categoryId)}
                    disabled={!isDirty || isSaving}
                    className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all ${
                      isDirty
                        ? 'bg-gradient-to-r from-orange-600 to-amber-700 hover:opacity-90 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving...' : isDirty ? 'Save Rate' : 'Saved'}
                  </button>

                  {lastValue !== undefined && !isDirty && (
                    <p className="text-[10px] text-emerald-600 font-bold text-center">
                      ✓ Locked at {lastValue}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900">
        <p className="font-bold mb-1">How Platform Commission Works</p>
        <p className="text-blue-700">
          When a customer pays ৳1,000 for a consultation in a category with a 15% commission rate,
          ৳850 is held in escrow for the expert and ৳150 is retained by the platform. The escrow
          portion is released to the expert once the admin manually approves the order.
        </p>
      </div>
    </div>
  );
};

export default ContentTab;
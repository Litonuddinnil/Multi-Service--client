import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import { useLanguage } from '../../hooks/useLanguage';
import type { CustomerOutletContext } from './CustomerOutletContext';

/**
 * Customer Dashboard → Retainer Subscriptions tab.
 *
 * Compact list of monthly advisory subscriptions with the next renewal
 * date and recurring price.
 */
export const RetainersTab: React.FC = () => {
  const { retainers, loading, handleNavigate } = useOutletContext<CustomerOutletContext>();
  const { formatDate } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (retainers.length === 0) {
    return (
      <EmptyState
        title="No Active Retainers"
        description="Subscribe to monthly dedicated advisory plans with guaranteed SLAs."
        actionLabel="Explore Retainer Plans"
        onAction={() => handleNavigate('home')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {retainers.map((ret) => (
        <div
          key={ret.id}
          className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <StatusPill status={ret.status} />
              <span className="text-xs font-mono text-gray-500">ID: {ret.id}</span>
            </div>
            <h4 className="text-base font-bold  mt-1">{ret.planTitle}</h4>
            <p className="text-xs text-gray-500">Next renewal: {formatDate(ret.nextRenewalDate)}</p>
          </div>
          <MoneyValue amount={ret.monthlyPriceBDT} className="text-lg font-bold " />
        </div>
      ))}
    </div>
  );
};

export default RetainersTab;
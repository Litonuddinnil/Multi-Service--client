import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ExternalLink, LayoutGrid, Star, Users } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { MoneyValue } from '../../components/common/MoneyValue';
import { StatusPill } from '../../components/common/StatusPill';
import type { ExpertOutletContext } from './ExpertOutletContext';

/**
 * Expert Dashboard → My Services tab.
 *
 * The catalogue listings this expert sells: one card per service, each with
 * its packages, prices and bookability. The shell already fetches these
 * scoped to the signed-in expert.
 */
export const ExpertServicesTab: React.FC = () => {
  const { services, loading, commissionRate } = useOutletContext<ExpertOutletContext>();

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map(i => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-3xl p-8 animate-pulse h-48"
          />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="No published services"
        description="Once your profile is verified, the service listings you publish will appear here with their packages and pricing."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl p-6">
        <h2 className="text-lg font-bold  flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-500" />
          My Services ({services.length})
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Prices shown are what the client pays. Your net is the price less the{' '}
          {(commissionRate * 100).toFixed(0)}% platform commission, released from escrow once the
          engagement completes.
        </p>
      </header>

      {services.map(service => (
        <article
          key={service.id}
          className="bg-white border border-[#E5E7EB] shadow-xs rounded-3xl overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row">
            {service.coverImage && (
              <img
                src={service.coverImage}
                alt=""
                className="w-full sm:w-44 h-32 sm:h-auto object-cover shrink-0"
              />
            )}

            <div className="p-6 space-y-4 min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base font-bold ">{service.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {service.categoryName} · {service.consultationMode}
                    {service.location ? ` · ${service.location}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={service.status} />
                  <Link
                    to={`/services/${service.id}`}
                    className="p-2 text-gray-500 hover: bg-white border border-gray-200 rounded-xl cursor-pointer transition-colors"
                    title="View public listing"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold text-gray-800">{service.rating.toFixed(1)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {service.reviewCount} reviews
                </span>
                <span>
                  From <MoneyValue amount={service.startingPriceBDT} className="font-bold text-gray-800" />
                </span>
              </div>

              {/* Packages */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                {service.packages.map(pkg => {
                  const net = pkg.priceBDT * (1 - (service.customCommissionRate ?? commissionRate));
                  return (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between gap-3 p-3 bg-[#F8FAFC] border border-gray-200 rounded-xl"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold  truncate">{pkg.title}</p>
                        <p className="text-[11px] text-gray-500">
                          {pkg.pricingType === 'SESSION'
                            ? `${pkg.durationMinutes} min session`
                            : pkg.pricingType === 'HOURLY'
                              ? 'Hourly'
                              : 'Fixed scope'}
                          {pkg.isBookable ? '' : ' · not bookable'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <MoneyValue
                          amount={pkg.priceBDT}
                          className="text-xs font-bold  block"
                        />
                        <span className="text-[10px] text-gray-400">
                          you net <MoneyValue amount={net} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ExpertServicesTab;

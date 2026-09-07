import React from 'react';
import { Star, UserRound } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { MoneyValue } from './MoneyValue';
import { VerifiedBadge } from './VerifiedBadge';
import type { ExpertSummary } from '../../types';

interface ExpertSummaryCardProps {
  expert: ExpertSummary;
  onClick?: (expertId: string) => void;
  className?: string;
}

/** Short-display expert card, limited to the nine fields the profile spec allows in a list. */
export const ExpertSummaryCard: React.FC<ExpertSummaryCardProps> = ({
  expert,
  onClick,
  className = '',
}) => {
  const { locale } = useLanguage();
  const bn = locale === 'bn';

  const interactive = typeof onClick === 'function';

  return (
    <article
      className={`group relative flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[#34C759]/60 hover:shadow-lg ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={interactive ? () => onClick!(expert.expertId) : undefined}
      onKeyDown={
        interactive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick!(expert.expertId);
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <header className="flex items-start gap-3">
        {expert.photoUrl ? (
          <img
            src={expert.photoUrl}
            alt={expert.displayName}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-100 ring-1 ring-gray-200">
            <UserRound className="h-7 w-7 text-gray-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-bold ">{expert.displayName}</h3>
            {expert.isVerified && <VerifiedBadge vendorType={expert.vendorType} size="sm" />}
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">{expert.profession}</p>
          <p className="truncate text-xs text-gray-500">{expert.specialization}</p>
        </div>
      </header>

      {expert.shortBio && (
        <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{expert.shortBio}</p>
      )}

      <footer className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-[#FF9500] text-[#FF9500]" />
          <span className="text-xs font-bold tabular-nums ">
            {/* "New" rather than 0.0, which would read as a bad score instead of an absent one. */}
            {typeof expert.rating === 'number' && expert.reviewCount > 0
              ? expert.rating.toFixed(1)
              : bn
                ? 'নতুন'
                : 'New'}
          </span>
          <span className="text-xs text-gray-500">
            ({expert.reviewCount} {bn ? 'রিভিউ' : expert.reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        <div className="text-right">
          {expert.consultationFeeBDT != null ? (
            <>
              <MoneyValue amount={expert.consultationFeeBDT} className="text-sm " />
              <p className="text-[11px] text-gray-500">{bn ? 'প্রতি সেশন' : 'per session'}</p>
            </>
          ) : (
            <p className="text-xs font-semibold text-gray-500">
              {bn ? 'ফি জানতে যোগাযোগ' : 'Fee on request'}
            </p>
          )}
        </div>
      </footer>
    </article>
  );
};

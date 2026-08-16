import React from 'react';
import { BookingStatus, ExpertStatus, PaymentStatus } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';

export type AnyStatus = BookingStatus | ExpertStatus | PaymentStatus | string;

interface StatusPillProps {
  status: AnyStatus;
  labelOverride?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ 
  status, 
  labelOverride, 
  size = 'md',
  className = '' 
}) => {
  const { t } = useLanguage();

  const getStyleAndLabel = () => {
    switch (status) {
      // Gray: draft, pending
      case 'DRAFT':
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'PENDING_QUOTE':
      case 'PENDING_ADMIN_REVIEW':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: labelOverride || (
            status === 'PENDING_ADMIN_REVIEW'
              ? 'Pending Admin Review'
              : status === 'DRAFT'
                ? t('status_draft')
                : t('status_pending')
          )
        };

      // Blue: in progress, submitted, quote received, waiting expert
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'IN_PROGRESS':
      case 'QUOTE_RECEIVED':
      case 'REQUESTED_PAID':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: labelOverride || (status === 'UNDER_REVIEW' || status === 'SUBMITTED' ? t('status_submitted') : t('status_in_progress'))
        };

      // Green: confirmed, approved, active, completed, paid, released
      case 'CONFIRMED':
      case 'APPROVED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'PAID':
      case 'PUBLISHED':
      case 'RELEASED_TO_PROVIDER':
        return {
          bg: 'bg-[#34C759]/10 text-[#248a3d] border-[#34C759]/30',
          dot: 'bg-[#34C759]',
          label: labelOverride || (status === 'COMPLETED' ? t('status_completed') : status === 'APPROVED' ? t('status_approved') : t('status_confirmed'))
        };

      // Amber: awaiting other party or reserved-unpaid, funded, held in escrow
      case 'REQUESTED':
      case 'REQUESTED_UNPAID':
      case 'RESERVED':
      case 'FUNDED':
      case 'HELD_IN_ESCROW':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: labelOverride || (status === 'RESERVED' ? 'Reserved (Unpaid)' : status === 'FUNDED' ? 'Funded (In Escrow)' : t('status_requested_unpaid'))
        };

      // Red: declined, cancelled, expired, suspended, rejected, no-show
      case 'DECLINED':
      case 'CANCELLED':
      case 'EXPIRED':
      case 'REJECTED':
      case 'SUSPENDED':
      case 'NO_SHOW':
      case 'REFUNDED':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          label: labelOverride || (status === 'CANCELLED' ? t('status_cancelled') : status === 'EXPIRED' ? t('status_expired') : status === 'DECLINED' ? t('status_declined') : 'Suspended / Rejected')
        };

      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          label: labelOverride || String(status)
        };
    }
  };

  const { bg, dot, label } = getStyleAndLabel();
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span 
      id={`status-pill-${status.toLowerCase()}`} 
      className={`inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap ${bg} ${padding} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{label}</span>
    </span>
  );
};

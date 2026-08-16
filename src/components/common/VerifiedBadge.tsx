import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { VendorType } from '../../types';

interface VerifiedBadgeProps {
  vendorType?: VendorType;
  customText?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  vendorType = 'INDIVIDUAL',
  customText,
  size = 'md',
  className = ''
}) => {
  const { t } = useLanguage();

  const label = customText || (vendorType === 'ORGANIZATION' ? t('verifiedAgency') : t('verifiedBadge'));
  const isSmall = size === 'sm';

  return (
    <span 
      id="trust-verified-badge"
      className={`inline-flex items-center gap-1 font-semibold text-[#248a3d] bg-[#34C759]/10 border border-[#34C759]/30 rounded-full select-none ${
        isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs'
      } ${className}`}
      title="Verified by withU Compliance & Registration Authority"
    >
      {vendorType === 'ORGANIZATION' ? (
        <ShieldCheck className={isSmall ? 'w-3 h-3 text-[#34C759]' : 'w-3.5 h-3.5 text-[#34C759]'} />
      ) : (
        <CheckCircle2 className={isSmall ? 'w-3 h-3 text-[#34C759]' : 'w-3.5 h-3.5 text-[#34C759]'} />
      )}
      <span>{label}</span>
    </span>
  );
};

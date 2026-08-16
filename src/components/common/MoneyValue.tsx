import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface MoneyValueProps {
  amount: number;
  currency?: string;
  className?: string;
  prefix?: string;
}

export const MoneyValue: React.FC<MoneyValueProps> = ({ 
  amount, 
  currency = 'BDT', 
  className = '',
  prefix = ''
}) => {
  const { formatBDT, locale } = useLanguage();

  if (currency === 'BDT') {
    return (
      <span className={`tabular-nums font-semibold ${className}`}>
        {prefix ? `${prefix} ` : ''}{formatBDT(amount)}
      </span>
    );
  }

  const isInt = Number.isInteger(amount);
  const formatted = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);

  return (
    <span className={`tabular-nums font-semibold ${className}`}>
      {prefix ? `${prefix} ` : ''}{currency} {formatted}
    </span>
  );
};

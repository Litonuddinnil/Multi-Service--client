import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface DateTimeValueProps {
  isoUtcString: string;
  showTime?: boolean;
  showZoneNotice?: boolean;
  className?: string;
}

export const DateTimeValue: React.FC<DateTimeValueProps> = ({ 
  isoUtcString, 
  showTime = true,
  showZoneNotice = true,
  className = '' 
}) => {
  const { formatDate, formatDateTime, locale } = useLanguage();

  if (!isoUtcString) return <span className="text-gray-400">—</span>;

  const display = showTime ? formatDateTime(isoUtcString) : formatDate(isoUtcString);

  return (
    <span className={`tabular-nums ${className}`}>
      {display}
      {showTime && showZoneNotice && (
        <span className="ml-1 text-[11px] text-gray-500 font-normal">
          {locale === 'bn' ? '(ঢাকা)' : '(Dhaka)'}
        </span>
      )}
    </span>
  );
};

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface CountdownTimerProps {
  targetIsoDate?: string;
  durationSeconds?: number;
  onExpire?: () => void;
  showIcon?: boolean;
  prefixText?: string;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetIsoDate,
  durationSeconds,
  onExpire,
  showIcon = true,
  prefixText,
  className = ''
}) => {
  const { locale } = useLanguage();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (durationSeconds !== undefined) return durationSeconds;
    if (targetIsoDate) {
      const diff = Math.floor((new Date(targetIsoDate).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    return 0;
  });

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 300; // < 5 mins

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return (
    <span 
      id="countdown-timer-display"
      className={`inline-flex items-center gap-1.5 font-mono text-sm tabular-nums font-semibold px-2 py-1 rounded border ${
        isUrgent 
          ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse' 
          : 'bg-[#F6F7F8] text-[#111827] border-[#E5E7EB]'
      } ${className}`}
    >
      {showIcon && <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600' : 'text-gray-500'}`} />}
      {prefixText && <span className="font-sans font-normal text-xs text-[#6B7280]">{prefixText}</span>}
      <span>{mm}:{ss}</span>
      {locale === 'bn' && <span className="font-sans text-[11px] text-gray-500 font-normal">বাকি</span>}
    </span>
  );
};

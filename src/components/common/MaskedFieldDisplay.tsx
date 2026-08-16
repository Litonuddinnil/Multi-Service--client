import React from 'react';
import { EyeOff } from 'lucide-react';

interface MaskedFieldDisplayProps {
  label?: string;
  value: string; // e.g. "017*****123" or "***1234"
  className?: string;
}

export const MaskedFieldDisplay: React.FC<MaskedFieldDisplayProps> = ({
  label,
  value,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-xs font-medium text-[#6B7280]">{label}</span>}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F6F7F8] border border-[#E5E7EB] rounded-lg text-sm text-[#111827] font-mono select-none">
        <EyeOff className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
        <span className="tracking-wider">{value || '***'}</span>
        <span className="ml-auto text-[10px] uppercase font-semibold text-gray-400">Masked</span>
      </div>
    </div>
  );
};

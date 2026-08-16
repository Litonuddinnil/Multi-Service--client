import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div 
      id="empty-state-view" 
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-[#E5E7EB] rounded-xl my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#F6F7F8] flex items-center justify-center text-[#6B7280] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#111827] mb-1">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-[#34C759] hover:bg-[#2fb34f] active:bg-[#289e45] rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  onConfirm,
  onCancel
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div 
      id="confirmation-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        id="confirmation-dialog-box"
        className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-6 transition-transform scale-100"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-full shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 id="dialog-title" className="text-base font-semibold text-[#111827] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] bg-[#F6F7F8] hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            {cancelLabel || t('cancelAction')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#34C759] hover:bg-[#2fb34f]'
            }`}
          >
            {confirmLabel || t('confirmAction')}
          </button>
        </div>
      </div>
    </div>
  );
};

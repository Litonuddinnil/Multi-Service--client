import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

type ConfirmationVariant = 'danger' | 'warning' | 'success';

interface ConfirmationDialogProps {
  /** Legacy: `isOpen`. F0: `open`. Either is accepted. */
  isOpen?: boolean;
  open?: boolean;

  title: string;
  /** Legacy: `description`. F0: `message`. Either is accepted. */
  description?: string;
  message?: string;

  confirmLabel?: string;
  cancelLabel?: string;

  /** Legacy: `isDestructive` boolean. F0: `confirmVariant` of 'danger' | 'warning' | 'success'. */
  isDestructive?: boolean;
  confirmVariant?: ConfirmationVariant;

  onConfirm: () => void;
  onCancel: () => void;

  /** F0: optional body (typically a textarea) rendered inside the dialog. */
  children?: React.ReactNode;
}

/**
 * F0 confirmation dialog. Replaces `window.confirm` / `window.prompt` with a
 * styled, accessible modal that supports either a plain yes/no decision or a
 * text-input body via `children`.
 *
 * Accepts BOTH the legacy prop names (`isOpen`, `description`, `isDestructive`)
 * and the F0 prop names (`open`, `message`, `confirmVariant`, `children`) so
 * callers can be migrated one at a time without breaking compile.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  open,
  title,
  description,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive,
  confirmVariant,
  onConfirm,
  onCancel,
  children,
}) => {
  const { t } = useLanguage();

  const visible = open ?? isOpen ?? false;
  if (!visible) return null;

  const bodyText = message ?? description ?? '';
  const variant: ConfirmationVariant = confirmVariant
    ? confirmVariant
    : isDestructive
      ? 'danger'
      : 'warning';

  const toneRing =
    variant === 'danger'
      ? 'bg-red-50 text-red-600'
      : variant === 'success'
        ? 'bg-emerald-50 text-emerald-600'
        : 'bg-amber-50 text-amber-600';

  const confirmButton =
    variant === 'success'
      ? 'bg-[#34C759] hover:bg-[#2fb34f]'
      : variant === 'warning'
        ? 'bg-amber-500 hover:bg-amber-600'
        : 'bg-red-600 hover:bg-red-700';

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
          <div className={`p-2.5 rounded-full shrink-0 ${toneRing}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="dialog-title" className="text-base font-semibold text-[#111827] mb-1">
              {title}
            </h3>
            {bodyText && (
              <p className="text-sm text-[#6B7280] leading-relaxed">{bodyText}</p>
            )}
            {children && <div className="mt-3">{children}</div>}
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
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${confirmButton}`}
          >
            {confirmLabel || t('confirmAction')}
          </button>
        </div>
      </div>
    </div>
  );
};

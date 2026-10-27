import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const btnStyles = {
    danger: 'bg-error hover:bg-red-700 text-on-error',
    primary: 'bg-primary hover:bg-primary-container text-on-primary',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  };

  const iconName = {
    danger: 'warning',
    primary: 'verified_user',
    success: 'check_circle',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-100 text-error'
                : 'bg-surface-container text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              {iconName[variant]}
            </span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">
              {title}
            </h3>
            <p className="font-body-md text-sm text-on-surface-variant mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-container mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${btnStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

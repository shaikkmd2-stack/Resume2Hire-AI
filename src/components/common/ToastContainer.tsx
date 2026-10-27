import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const bgColors = {
          success: 'bg-emerald-900/90 text-white border-emerald-700',
          info: 'bg-[#131b2e]/95 text-white border-primary/30',
          warning: 'bg-amber-900/90 text-white border-amber-700',
          error: 'bg-rose-900/90 text-white border-rose-700',
        };

        const icons = {
          success: 'check_circle',
          info: 'info',
          warning: 'warning',
          error: 'error',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md border text-sm font-medium animate-in slide-in-from-bottom-2 duration-200 ${bgColors[toast.type]}`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {icons[toast.type]}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/70 hover:text-white p-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

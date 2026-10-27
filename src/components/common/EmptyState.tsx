import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-surface-container-high shadow-xs ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-4 shadow-inner">
        <span className="material-symbols-outlined text-[36px]">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-lg font-bold text-on-surface">
        {title}
      </h3>
      <p className="font-body-md text-sm text-on-surface-variant max-w-md mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-medium text-sm transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

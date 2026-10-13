import React from 'react';
import { PackageOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-white border border-slate-200 rounded-xl my-3 ${className}`}>
      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5 border border-slate-200/80">
        {icon || <PackageOpen className="w-4 h-4 text-slate-500" />}
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="crm-btn-primary !h-8 !px-3.5 !text-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

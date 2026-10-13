import React from 'react';
import { AlertTriangle, Info, Trash2, CheckCircle2, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isVisible) return null;

  const iconMap = {
    danger: <Trash2 className="w-6 h-6 text-rose-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-blue-600" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  };

  const iconBgMap = {
    danger: 'bg-rose-50 border border-rose-100',
    warning: 'bg-amber-50 border border-amber-100',
    info: 'bg-blue-50 border border-blue-100',
    success: 'bg-emerald-50 border border-emerald-100',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`p-3.5 rounded-full mb-3.5 ${iconBgMap[variant]}`}>
            {iconMap[variant]}
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1.5">{title}</h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">{description}</p>

          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="crm-btn-secondary flex-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={variant === 'danger' ? 'crm-btn-danger flex-1' : 'crm-btn-primary flex-1'}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

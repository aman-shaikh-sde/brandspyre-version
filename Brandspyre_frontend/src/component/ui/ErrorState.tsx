import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to load data",
  message = "A temporary error occurred while processing your request. Please check your connection and try again.",
  onRetry,
}) => {
  return (
    <div className="crm-empty-state my-6 border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="crm-btn-secondary gap-2">
          <RefreshCw size={14} />
          Retry Request
        </button>
      )}
    </div>
  );
};

export default ErrorState;

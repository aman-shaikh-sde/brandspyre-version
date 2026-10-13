import React from "react";

export interface CrmTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const CrmTextarea: React.FC<CrmTextareaProps> = ({
  label,
  icon,
  error,
  required,
  helperText,
  className = "",
  id,
  rows = 3,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1"
        >
          {icon && <span className="text-slate-400">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-red-600 font-bold ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full p-3 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs font-medium rounded-lg focus:outline-none focus:ring-2 transition-all duration-150 shadow-2xs ${
          error
            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
            : "border-slate-300 dark:border-slate-700 focus:ring-red-500/20 focus:border-red-600"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default CrmTextarea;

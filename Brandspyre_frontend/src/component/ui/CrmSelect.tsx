import React from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  badgeColor?: string;
  icon?: string;
}

export interface CrmSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export const CrmSelect: React.FC<CrmSelectProps> = ({
  label,
  icon,
  options,
  placeholder = "Select Option",
  error,
  required,
  helperText,
  className = "",
  id,
  children,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1"
        >
          {icon && <span className="text-slate-400">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-red-600 font-bold ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 text-xs font-medium rounded-xl focus:outline-none focus:ring-2 transition-all duration-150 shadow-2xs ${
          error
            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500"
            : "border-slate-300 dark:border-slate-700 focus:ring-red-500/20 focus:border-red-600"
        } ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options && options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default CrmSelect;

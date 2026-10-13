import React from "react";

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel: React.FC<FormLabelProps> = ({ children, required, className = "", ...props }) => (
  <label className={`block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ${className}`} {...props}>
    {children}
    {required && <span className="text-red-600 ml-1">*</span>}
  </label>
);

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = "", error, leftIcon, ...props }, ref) => (
    <div className="relative w-full">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={`w-full h-10 ${leftIcon ? "pl-10" : "px-3.5"} py-2 bg-white dark:bg-slate-900 border ${
          error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-red-600 focus:ring-red-500/20"
        } rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-150 shadow-2xs ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>}
    </div>
  )
);
FormInput.displayName = "FormInput";

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className = "", error, options, children, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        className={`w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border ${
          error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-red-600 focus:ring-red-500/20"
        } rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-150 shadow-2xs ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>}
    </div>
  )
);
FormSelect.displayName = "FormSelect";

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className = "", error, rows = 3, ...props }, ref) => (
    <div className="relative w-full">
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full px-3.5 py-2 bg-white dark:bg-slate-900 border ${
          error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:border-red-600 focus:ring-red-500/20"
        } rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-150 shadow-2xs ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>}
    </div>
  )
);
FormTextarea.displayName = "FormTextarea";

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, required, error, className = "", children }) => (
  <div className={`w-full ${className}`}>
    {label && <FormLabel required={required}>{label}</FormLabel>}
    {children}
    {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>}
  </div>
);

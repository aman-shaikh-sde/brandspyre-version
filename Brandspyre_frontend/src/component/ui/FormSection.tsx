import React from "react";

export interface FormSectionProps {
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  columns = 2,
  children,
  className = "",
}) => {
  const colMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 mb-4 space-y-3 ${className}`}>
      {(title || description) && (
        <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800">
          {title && <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>}
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      )}
      <div className={`grid ${colMap[columns]} gap-3`}>{children}</div>
    </div>
  );
};

export default FormSection;

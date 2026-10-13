import React from "react";

interface CrmFormSectionProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const CrmFormSection: React.FC<CrmFormSectionProps> = ({
  title,
  icon,
  children,
  columns = 2,
  className = "",
}) => {
  const colMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 flex items-center gap-2">
          {icon && <span className="text-red-700 dark:text-red-500">{icon}</span>}
          <span>{title}</span>
        </h4>
      )}
      <div className={`grid gap-4 ${colMap[columns]}`}>{children}</div>
    </div>
  );
};

interface CrmFormLayoutProps {
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export const CrmFormLayout: React.FC<CrmFormLayoutProps> = ({
  title,
  icon,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  loading = false,
  error,
  className = "",
}) => {
  return (
    <div className={`flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm ${className}`}>
      {title && (
        <div className="border-b pb-3 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {icon && <span className="text-red-700 dark:text-red-500">{icon}</span>}
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {children}

        {(onSubmit || onCancel) && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            )}
            {onSubmit && (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold bg-red-700 hover:bg-red-800 text-white rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Saving..." : submitLabel}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default CrmFormLayout;

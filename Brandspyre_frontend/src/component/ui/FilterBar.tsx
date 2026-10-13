import React from "react";
import { Search, X, Filter } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  placeholder?: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  onClearAll?: () => void;
  children?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  filters = [],
  onClearAll,
  children,
}) => {
  const hasActiveFilters = Boolean(
    searchQuery || filters.some((f) => Boolean(f.value))
  );

  return (
    <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Search & Select Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          {onSearchChange && (
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Dynamic Select Filters */}
          {filters.map((filter) => (
            <div key={filter.key} className="min-w-[130px]">
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all cursor-pointer"
              >
                <option value="">{filter.placeholder || `All ${filter.label}s`}</option>
                {(filter.options || []).map((opt, optIdx) => (
                  <option key={opt?.value ?? optIdx} value={opt?.value ?? ""}>
                    {opt?.label || opt?.value || ""}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {children}
        </div>

        {/* Right Side: Clear Filters Button */}
        {hasActiveFilters && onClearAll && (
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
          >
            <X size={14} />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

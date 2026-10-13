import React, { useState } from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";
import { TableSkeleton } from "./ui/SkeletonLoader";
import { EmptyState } from "./ui/EmptyState";

const DataTable = ({
  thead,
  tbody,
  isSearch = false,
  handleSearch,
  searchPlaceholder = "Search...",
  className = "",
  tableClassName = "",
  isLoading = false,
  noDataText = "No Data Found",
  maxHeight = "auto",
  maxWidth = "100%",
  onRowDoubleClick,
  enableSorting = false,
  enableFilters = false,
}: any) => {
  const header = thead?.() || [];
  const bodyData = tbody?.() || [];

  const [sortConfig, setSortConfig] = useState<{ key: number; direction: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<Record<number, string>>({});

  const handleSort = (index: number) => {
    if (!enableSorting) return;
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === index && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: index, direction });
  };

  // Filter Data
  let filteredData = bodyData.filter((row: any) => {
    return Object.keys(filters).every((keyStr) => {
      const key = Number(keyStr);
      const filterVal = filters[key]?.toLowerCase() || "";
      const cellVal = String(row?.data?.[key]?.data || "").toLowerCase();
      return cellVal.includes(filterVal);
    });
  });

  // Sort Data
  if (sortConfig !== null) {
    filteredData.sort((a: any, b: any) => {
      const aVal = a?.data?.[sortConfig.key]?.data || "";
      const bVal = b?.data?.[sortConfig.key]?.data || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Optional Search Bar */}
      {isSearch && (
        <div className="mb-3.5 flex justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => handleSearch?.(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div 
        className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs"
        style={{ maxHeight, maxWidth }}
      >
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          {/* Header */}
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-[5]">
            <tr>
              {header.map((headerItem: any, index: number) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(index)}
                >
                  {headerItem.data}
                  {enableSorting &&
                    sortConfig?.key === index &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>

            {/* Inline Filter Row */}
            {enableFilters && (
              <tr className="bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                {header.map((_: any, index: number) => (
                  <th key={index} className="px-3 py-1.5">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters[index] || ""}
                      onChange={(e) =>
                        setFilters({ ...filters, [index]: e.target.value })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={Math.max(1, header.length)} className="p-0">
                  <TableSkeleton rows={4} cols={header.length || 5} />
                </td>
              </tr>
            ) : filteredData?.length > 0 ? (
              filteredData.map((row: any, rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                >
                  {row?.data?.map((cell: any, cellIndex: number) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap align-middle"
                    >
                      {cell.data}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(1, header.length)} className="p-6">
                  <EmptyState title={typeof noDataText === 'string' ? noDataText : "No records found"} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

DataTable.propTypes = {
  thead: PropTypes.func.isRequired,
  tbody: PropTypes.func.isRequired,
  className: PropTypes.string,
  tableClassName: PropTypes.string,
  isLoading: PropTypes.bool,
  noDataText: PropTypes.node,
  maxHeight: PropTypes.string,
  maxWidth: PropTypes.string,
  onRowDoubleClick: PropTypes.func,
  enableSorting: PropTypes.bool,
  enableFilters: PropTypes.bool,
};

export default DataTable;

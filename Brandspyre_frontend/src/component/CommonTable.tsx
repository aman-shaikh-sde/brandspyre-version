import React from 'react';
import PropTypes from 'prop-types';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';
import { TableSkeleton } from './ui/SkeletonLoader';

const CommonTable = ({
  thead,
  tbody,
  isSearch = false,
  handleSearch,
  searchPlaceholder = 'Search records...',
  className = '',
  tableClassName = '',
  isLoading = false,
  noDataText = "No Data Found",
  actionIcons = []
}) => {
  const headers = thead?.() || [];
  const bodyData = tbody?.() || [];

  const renderActionIcons = () => {
    return actionIcons.map((iconName, index) => {
      const IconComponent = (LucideIcons as any)[iconName];
      if (!IconComponent) return null;
      
      return (
        <button
          key={index}
          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-0.5 ${
            iconName === 'Trash2' || iconName === 'Trash' ? 'text-red-600 hover:text-red-700 dark:text-red-400' :
            iconName === 'Edit' || iconName === 'Pencil' ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400' :
            'text-blue-600 hover:text-blue-700 dark:text-blue-400'
          }`}
          title={iconName}
        >
          <IconComponent className="h-4 w-4" />
        </button>
      );
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Top Search Bar */}
      {isSearch && (
        <div className="mb-3.5 flex justify-end">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          {/* Modern Clean Header */}
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {headers.map((header: any, index: number) => (
                <th
                  key={index}
                  className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider select-none whitespace-nowrap"
                >
                  {header.data}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <tr>
                <td colSpan={Math.max(1, headers.length)} className="p-0">
                  <TableSkeleton rows={4} cols={headers.length || 5} />
                </td>
              </tr>
            ) : bodyData.length > 0 ? (
              bodyData.map((row: any, rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {row?.data?.map((cell: any, cellIndex: number) => (
                    <td 
                      key={cellIndex} 
                      className="px-4 py-3 text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap align-middle"
                    >
                      {cellIndex === row.data.length - 1 && actionIcons.length > 0 ? (
                        <div className="flex items-center space-x-1">
                          {renderActionIcons()}
                        </div>
                      ) : (
                        cell.data
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(1, headers.length)} className="p-6">
                  <EmptyState title={typeof noDataText === 'string' ? noDataText : "No data available"} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

CommonTable.propTypes = {
  thead: PropTypes.func.isRequired,
  tbody: PropTypes.func.isRequired,
  isSearch: PropTypes.bool,
  handleSearch: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
  tableClassName: PropTypes.string,
  isLoading: PropTypes.bool,
  noDataText: PropTypes.node,
  actionIcons: PropTypes.arrayOf(PropTypes.string)
};

export default CommonTable;

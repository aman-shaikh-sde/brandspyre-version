import React, { useState, useEffect } from 'react';
import { apiClient } from "src/services/apiClient";
import { useOrganizationConfig } from '../../stores/useOrganizationConfig';
import { CrmBadge } from '../ui/CrmBadge';
import { Button } from '../ui/Button';
import { Search, Edit, Trash2, Tag, Layers } from 'lucide-react';

export interface DynamicColumn {
  field_code: string;
  label: string;
  data_type: string;
  input_type: string;
  is_system?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface DynamicTableProps {
  entity: string;
  data: any[];
  loading?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  actions?: (item: any) => React.ReactNode;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
  entity,
  data,
  loading = false,
  onEdit,
  onDelete,
  actions
}) => {
  const [columns, setColumns] = useState<DynamicColumn[]>([]);
  const [search, setSearch] = useState('');
  const { getEntityFields } = useOrganizationConfig();

  useEffect(() => {
    const loadColumns = async () => {
      try {
        let fieldDefs = getEntityFields(entity);
        if (!fieldDefs || fieldDefs.length === 0) {
          const res = await apiClient.get(`/config/entities/${entity}/fields`);
          if (res.data?.success) {
            fieldDefs = res.data.data || [];
          }
        }

        const visibleCols = (fieldDefs || [])
          .filter((f: any) => f.visible !== false)
          .map((f: any) => ({
            field_code: f.field_code,
            label: f.label,
            data_type: f.data_type,
            input_type: f.input_type,
            is_system: f.is_system !== false,
            align: ['currency', 'number'].includes(f.input_type) ? ('right' as const) : ('left' as const)
          }));

        setColumns(visibleCols);
      } catch (err) {
        console.warn(`Failed to load dynamic table columns for entity ${entity}:`, err);
      }
    };

    loadColumns();
  }, [entity]);

  // Filtered data based on search string
  const filteredData = data.filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return columns.some((col) => {
      const val = col.is_system ? item[col.field_code] : item.custom_fields?.[col.field_code];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
    });
  });

  const renderCellValue = (item: any, col: DynamicColumn) => {
    const val = col.is_system ? item[col.field_code] : item.custom_fields?.[col.field_code];

    if (val === undefined || val === null || val === '') return <span className="text-slate-400 text-xs">-</span>;

    if (col.input_type === 'currency' || col.data_type === 'number') {
      return (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {col.input_type === 'currency' ? `₹${Number(val).toLocaleString()}` : val}
        </span>
      );
    }

    if (col.input_type === 'checkbox' || col.data_type === 'boolean') {
      return (
        <CrmBadge variant={val ? 'success' : 'neutral'}>
          {val ? 'Yes' : 'No'}
        </CrmBadge>
      );
    }

    if (col.field_code === 'status') {
      return <CrmBadge variant="primary">{String(val).toUpperCase()}</CrmBadge>;
    }

    return <span className="text-slate-700 dark:text-slate-300 text-xs">{String(val)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredData.length}</span> entries
        </div>
      </div>

      {/* Dynamic Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.field_code} className={`px-4 py-3 text-${col.align || 'left'}`}>
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete || actions) && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400 animate-pulse">
                  Loading records...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center">
                  <Layers className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No records found</p>
                  <p className="text-xs text-slate-400">Try adjusting your search criteria</p>
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr key={item._id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {columns.map((col) => (
                    <td key={col.field_code} className={`px-4 py-3 text-${col.align || 'left'}`}>
                      {renderCellValue(item, col)}
                    </td>
                  ))}
                  {(onEdit || onDelete || actions) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions && actions(item)}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTable;

import React, { useState, useMemo, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";

// ---------------------------------------------------------------
// Variable Picker Modal
// ---------------------------------------------------------------
interface VariableDefinition {
  path: string;
  label: string;
  group: string;
  sample: string;
}

export default function VariablePicker({
  isOpen,
  variables,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  variables: VariableDefinition[];
  onSelect: (variable: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const groups: Record<string, VariableDefinition[]> = {};
    const filtered = variables.filter(
      (v) =>
        v.path.toLowerCase().includes(search.toLowerCase()) ||
        v.label.toLowerCase().includes(search.toLowerCase())
    );
    for (const v of filtered) {
      if (!groups[v.group]) groups[v.group] = [];
      groups[v.group].push(v);
    }
    return groups;
  }, [variables, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Insert Variable</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">&times;</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search variables..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Variable List */}
        <div className="overflow-y-auto max-h-[45vh] p-3">
          {Object.entries(grouped).map(([group, vars]) => (
            <div key={group} className="mb-2">
              <button
                onClick={() => setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              >
                <span>{group} ({vars.length})</span>
                <ChevronDown size={14} className={`transition-transform ${expandedGroups[group] === false ? "-rotate-90" : ""}`} />
              </button>

              {expandedGroups[group] !== false && (
                <div className="space-y-0.5 mt-1">
                  {vars.map((v) => (
                    <button
                      key={v.path}
                      onClick={() => { onSelect(v.path); onClose(); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition group text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{v.label}</p>
                        <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">{`{{${v.path}}}`}</p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded hidden group-hover:block">{v.sample}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 dark:text-gray-500">No variables found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

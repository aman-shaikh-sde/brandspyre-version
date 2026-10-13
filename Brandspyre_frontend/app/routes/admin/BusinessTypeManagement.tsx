import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import { Sliders, Layers, CheckCircle2, Save, Plus } from 'lucide-react';

export default function BusinessTypeManagement() {
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [selectedBt, setSelectedBt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const ALL_MODULES = [
    { code: 'CRM', name: 'Sales & CRM' },
    { code: 'PRODUCTS', name: 'Products & Catalog' },
    { code: 'INVENTORY', name: 'Inventory & Warehouses' },
    { code: 'PURCHASE', name: 'Purchase & Procurement' },
    { code: 'POS', name: 'Point of Sale (POS)' },
    { code: 'PRODUCTION', name: 'Production & Manufacturing' },
    { code: 'BILLING', name: 'Commercial Billing' },
    { code: 'LEAD_EXCHANGE', name: 'Lead Exchange' },
    { code: 'PROJECTS', name: 'Projects & Tasks' },
    { code: 'HRMS', name: 'Human Resources' },
    { code: 'FINANCE', name: 'Finance & Accounts' },
    { code: 'MEETINGS', name: 'Meetings & Video' },
    { code: 'AI_ASSISTANT', name: 'AI Assistant' }
  ];

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  const fetchBusinessTypes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/platform-admin/business-types');
      if (res.data?.success) {
        setBusinessTypes(res.data.data);
        if (res.data.data.length > 0) setSelectedBt(res.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching business types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicabilityChange = (modCode: string, applicability: string) => {
    if (!selectedBt) return;
    setSelectedBt((prev: any) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [modCode]: applicability
      }
    }));
  };

  const handleSaveMatrix = async () => {
    if (!selectedBt) return;
    try {
      setSaving(true);
      await apiClient.put(`/v1/platform-admin/business-types/${selectedBt.code}/matrix`, {
        modules: selectedBt.modules
      });
      alert('Business Type module matrix updated successfully!');
      fetchBusinessTypes();
    } catch (err) {
      alert('Failed to save matrix updates.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Industry Business Type Matrix...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100">
      {/* Standard Page Header */}
      <PageHeader
        title="Industry & Business Type Matrix Manager"
        description="Configure Core (C), Recommended (R), Optional (O), or Hidden (-) module applicability per Business Type profile."
        actions={
          selectedBt && (
            <button
              onClick={handleSaveMatrix}
              disabled={saving}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Matrix Configuration'}
            </button>
          )
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business Type Selector */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">
            Business Profiles ({businessTypes.length})
          </h3>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {businessTypes.map((bt) => {
              const isSelected = selectedBt?.code === bt.code;
              return (
                <button
                  key={bt.code}
                  onClick={() => setSelectedBt(bt)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                      : 'bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span className="truncate">{bt.name}</span>
                  <span className="text-[10px] font-mono opacity-70">{bt.industry_name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Matrix Editor */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {selectedBt ? (
            <>
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedBt.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Industry: {selectedBt.industry_name} ({selectedBt.code})</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">C: Core</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">R: Rec</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">O: Opt</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">-: Off</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
                {ALL_MODULES.map((m) => {
                  const currentApp = selectedBt.modules?.[m.code] || '-';
                  return (
                    <div
                      key={m.code}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                      <select
                        value={currentApp}
                        onChange={(e) => handleApplicabilityChange(m.code, e.target.value)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-600"
                      >
                        <option value="C">C - Core (Default)</option>
                        <option value="R">R - Recommended</option>
                        <option value="O">O - Optional Addon</option>
                        <option value="-">- Hidden / Off</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">Select a business type profile to edit module matrix</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";
import { notify } from "~/services/notificationService";
import {
  Package,
  CheckCircle2,
  XCircle,
  Lock,
  RefreshCw,
  Sliders,
  Globe2,
  Layers,
  CreditCard,
  Building2,
  Users,
  ShoppingCart,
  DollarSign,
  Bot,
  Factory,
  Loader2,
  Plus,
  Tag,
  Type,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "src/component/ui/Button";

interface ModuleRegistryItem {
  code: string;
  name: string;
  description: string;
  category: string;
  is_core: boolean;
  is_future: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  CORE: Building2,
  CRM: Users,
  SALES: ShoppingCart,
  PROJECTS: Layers,
  "COMMERCIAL & B2B": DollarSign,
  HRMS: Users,
  "COLLABORATION & AI": Bot,
  PRODUCTION: Factory,
  FINANCE: CreditCard,
  ADMINISTRATION: Sliders
};

export default function ModuleSettings() {
  const { enabledModules, fetchConfig, subscription, industry, getTerminology } = useOrganizationConfig();
  const [activeTab, setActiveTab] = useState<"MODULES" | "FIELDS" | "TERMINOLOGY">("MODULES");

  // Module state
  const [modules, setModules] = useState<ModuleRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  // Custom Fields state
  const [selectedEntity, setSelectedEntity] = useState("PRODUCT");
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldCode, setCustomFieldCode] = useState("");
  const [customFieldDataType, setCustomFieldDataType] = useState("string");
  const [savingField, setSavingField] = useState(false);
  const [existingFields, setExistingFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);

  // Terminology state
  const [termLabel, setTermLabel] = useState("");
  const [termPlural, setTermPlural] = useState("");
  const [savingTerm, setSavingTerm] = useState(false);

  const productTerm = getTerminology("PRODUCT", "Product");

  const loadRegistry = async () => {
    setLoading(true);
    try {
      const modRes = await apiClient.get("/industries/registry/modules?includeFuture=true");
      if (modRes.data?.success) {
        setModules(modRes.data.data);
      }
    } catch (err: any) {
      notify.error("Failed to load module registry.");
    } finally {
      setLoading(false);
    }
  };

  const loadEntityFields = async (entity: string) => {
    setLoadingFields(true);
    try {
      const res = await apiClient.get(`/config/entities/${entity}/fields`);
      if (res.data?.success) {
        setExistingFields(res.data.data || []);
      }
    } catch (err) {
      console.warn("Failed to load entity fields:", err);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    loadRegistry();
  }, []);

  useEffect(() => {
    if (activeTab === "FIELDS") {
      loadEntityFields(selectedEntity);
    }
  }, [selectedEntity, activeTab]);

  useEffect(() => {
    const t = getTerminology(selectedEntity, selectedEntity === 'PRODUCT' ? 'Product' : 'Customer');
    setTermLabel(t.label);
    setTermPlural(t.plural_label);
  }, [selectedEntity]);

  const handleToggleModule = async (moduleCode: string, isCurrentlyEnabled: boolean) => {
    setUpdatingCode(moduleCode);
    try {
      const action = isCurrentlyEnabled ? "disable" : "enable";
      const res = await apiClient.put("/organization/modules", {
        action,
        module: moduleCode
      });

      if (res.data?.success) {
        notify.success(res.data.message || `Module ${action}d successfully.`);
        await fetchConfig();
      } else {
        notify.error(res.data?.error || "Failed to update module.");
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to update module entitlement.");
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleAddCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldName || !customFieldCode) {
      notify.error("Field label and code are required.");
      return;
    }

    setSavingField(true);
    try {
      const res = await apiClient.post(`/config/entities/${selectedEntity}/fields`, {
        field_code: customFieldCode,
        label: customFieldName,
        data_type: customFieldDataType,
        input_type: customFieldDataType === 'number' ? 'number' : customFieldDataType === 'boolean' ? 'checkbox' : 'text',
        required: false,
        section: "Organization Custom Fields"
      });

      if (res.data?.success) {
        notify.success(editingField ? `Custom field '${customFieldName}' updated successfully!` : `Custom field '${customFieldName}' added successfully!`);
        setCustomFieldName("");
        setCustomFieldCode("");
        setEditingField(null);
        await loadEntityFields(selectedEntity);
        await fetchConfig();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to save custom field.");
    } finally {
      setSavingField(false);
    }
  };

  const handleEditField = (field: any) => {
    setEditingField(field);
    setCustomFieldName(field.label || "");
    setCustomFieldCode(field.field_code || "");
    setCustomFieldDataType(field.data_type || "string");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setCustomFieldName("");
    setCustomFieldCode("");
    setCustomFieldDataType("string");
  };

  const handleDeleteField = async (fieldCode: string, fieldLabel: string) => {
    if (!window.confirm(`Are you sure you want to delete custom field '${fieldLabel}'?`)) return;

    try {
      const res = await apiClient.delete(`/config/entities/${selectedEntity}/fields/${fieldCode}`);
      if (res.data?.success) {
        notify.success(`Custom field '${fieldLabel}' deleted successfully.`);
        if (editingField?.field_code === fieldCode) {
          handleCancelEdit();
        }
        await loadEntityFields(selectedEntity);
        await fetchConfig();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to delete custom field.");
    }
  };

  const handleSaveTerminology = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termLabel || !termPlural) {
      notify.error("Label and Plural Label are required.");
      return;
    }

    setSavingTerm(true);
    try {
      const res = await apiClient.put("/config/terminology", {
        entity_type: selectedEntity,
        label: termLabel,
        plural_label: termPlural
      });

      if (res.data?.success) {
        notify.success("Terminology configuration updated!");
        await fetchConfig();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to update terminology.");
    } finally {
      setSavingTerm(false);
    }
  };

  const categories = Array.from(new Set(modules.map((m) => m.category)));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/30 shadow-xs">
            <Sliders size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Module & Platform Configuration
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Customize enabled modules, dynamic fields, terminology, and industry rules for your tenant organization.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchConfig()}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all shadow-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Configuration
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("MODULES")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "MODULES"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Package className="h-4 w-4 inline mr-1.5" /> Modules & Features
        </button>
        <button
          onClick={() => setActiveTab("FIELDS")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "FIELDS"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Tag className="h-4 w-4 inline mr-1.5" /> Custom Fields Engine
        </button>
        <button
          onClick={() => setActiveTab("TERMINOLOGY")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === "TERMINOLOGY"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Type className="h-4 w-4 inline mr-1.5" /> Industry Terminology
        </button>
      </div>

      {/* TAB 1: MODULES & FEATURES */}
      {activeTab === "MODULES" && (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catModules = modules.filter((m) => m.category === cat);
            const CatIcon = CATEGORY_ICONS[cat] || Layers;

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <CatIcon size={14} className="text-slate-400" />
                  <span>{cat}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catModules.map((mod) => {
                    const isEnabled = enabledModules.includes(mod.code);
                    const isUpdating = updatingCode === mod.code;

                    return (
                      <div
                        key={mod.code}
                        className={`p-4 rounded-2xl border transition-all ${
                          isEnabled
                            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xs"
                            : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                              {mod.name}
                              {mod.is_core && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                  Core
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <span className={`font-semibold ${isEnabled ? "text-emerald-600" : "text-slate-400"}`}>
                            {isEnabled ? "Active" : "Disabled"}
                          </span>

                          {!mod.is_core && (
                            <button
                              onClick={() => handleToggleModule(mod.code, isEnabled)}
                              disabled={isUpdating}
                              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                                isEnabled
                                  ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              }`}
                            >
                              {isUpdating ? "Updating..." : isEnabled ? "Disable" : "Enable"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CUSTOM FIELDS ENGINE */}
      {activeTab === "FIELDS" && (
        <div className="space-y-6">
          {/* Add / Edit Form Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {editingField ? `Edit Custom Field (${editingField.field_code})` : "Add Custom Entity Field Definition"}
                </h3>
                <p className="text-xs text-slate-500">
                  Create dynamic custom fields for {selectedEntity}. New fields automatically appear in dynamic forms and tables without frontend code edits.
                </p>
              </div>
              {editingField && (
                <button
                  onClick={handleCancelEdit}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Cancel Editing
                </button>
              )}
            </div>

            <form onSubmit={handleAddCustomField} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Entity</label>
                <select
                  value={selectedEntity}
                  onChange={(e) => {
                    setSelectedEntity(e.target.value);
                    handleCancelEdit();
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                >
                  <option value="PRODUCT">PRODUCT ({productTerm.label})</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="SUPPLIER">SUPPLIER</option>
                  <option value="SALES_ORDER">SALES ORDER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Field Label</label>
                <input
                  type="text"
                  placeholder="e.g. Shelf Location / Manufacturer"
                  value={customFieldName}
                  onChange={(e) => {
                    setCustomFieldName(e.target.value);
                    if (!editingField) {
                      setCustomFieldCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Data Type</label>
                <select
                  value={customFieldDataType}
                  onChange={(e) => setCustomFieldDataType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
                >
                  <option value="string">Text (String)</option>
                  <option value="number">Number</option>
                  <option value="boolean">Yes/No Checkbox</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2">
                {editingField && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" variant="primary" disabled={savingField}>
                  {savingField ? "Saving..." : editingField ? "Update Custom Field" : "Add Custom Field"}
                </Button>
              </div>
            </form>
          </div>

          {/* Existing Field Definitions List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Active Field Definitions ({selectedEntity})
                </h3>
                <p className="text-xs text-slate-500">
                  Manage custom field configurations created for your organization.
                </p>
              </div>
              <button
                onClick={() => loadEntityFields(selectedEntity)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Refresh Fields"
              >
                <RefreshCw size={14} className={loadingFields ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Field Label</th>
                    <th className="px-4 py-3">Field Code</th>
                    <th className="px-4 py-3">Data Type</th>
                    <th className="px-4 py-3">Scope / Type</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {loadingFields ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 animate-pulse">
                        Loading field definitions...
                      </td>
                    </tr>
                  ) : existingFields.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No custom fields created for {selectedEntity} yet.
                      </td>
                    </tr>
                  ) : (
                    existingFields.map((field, idx) => {
                      const isCustom = field.is_system === false || field.scope === 'ORGANIZATION';
                      return (
                        <tr key={field.field_code || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {field.label}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                            {field.field_code}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">
                            {field.data_type || 'string'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isCustom
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {isCustom ? "Custom Field" : "System Field"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isCustom ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditField(field)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  title="Edit Field"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.field_code, field.label)}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                  title="Delete Field"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Built-in</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TERMINOLOGY */}
      {activeTab === "TERMINOLOGY" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              Configure Entity Terminology
            </h3>
            <p className="text-xs text-slate-500">
              Customize entity labels across your organization. E.g., rename "Product" to "Medicine" for Pharmacy, "Material" for Manufacturing, or "Service Item" for IT.
            </p>
          </div>

          <form onSubmit={handleSaveTerminology} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Entity</label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
              >
                <option value="PRODUCT">PRODUCT</option>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="SUPPLIER">SUPPLIER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Singular Label</label>
              <input
                type="text"
                value={termLabel}
                onChange={(e) => setTermLabel(e.target.value)}
                placeholder="e.g. Medicine"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plural Label</label>
              <input
                type="text"
                value={termPlural}
                onChange={(e) => setTermPlural(e.target.value)}
                placeholder="e.g. Medicines"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" variant="primary" disabled={savingTerm}>
                {savingTerm ? "Saving..." : "Save Terminology Override"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

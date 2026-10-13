import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTemplateStore } from "../../../src/stores/documentTemplateStore";
import {
  FileText, Plus, Search, Filter, Copy, Trash2, CheckCircle,
  Archive, RotateCcw, Star, MoreVertical, ChevronLeft, ChevronRight,
  LayoutGrid, List, Eye
} from "lucide-react";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const MODULE_LABELS: Record<string, string> = {
  hr: "HR", sales: "Sales", accounting: "Accounting",
  projects: "Projects", crm: "CRM", meetings: "Meetings"
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300", label: "Draft" },
  published: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Published" },
  archived: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", label: "Archived" },
};

function formatDocType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------
// Create Template Modal
// ---------------------------------------------------------------
const TYPE_GROUPS: Record<string, string[]> = {
  HR: ["offer_letter", "joining_letter", "appointment_letter", "confirmation_letter", "promotion_letter", "salary_revision", "payslip", "experience_letter", "relieving_letter", "termination_letter", "warning_letter"],
  Sales: ["quotation", "sales_order", "invoice", "proforma_invoice", "credit_note", "debit_note", "payment_receipt"],
  Accounting: ["purchase_order", "vendor_bill", "expense_voucher", "payment_voucher"],
  Projects: ["project_proposal", "project_contract", "work_order", "timesheet", "project_summary"],
  CRM: ["lead_proposal", "customer_agreement", "service_contract"],
  Meetings: ["meeting_invitation", "minutes_of_meeting", "attendance_sheet"],
};

function CreateTemplateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("");
  const [category, setCategory] = useState("professional");
  const [creating, setCreating] = useState(false);
  const createTemplate = useDocumentTemplateStore((s) => s.createTemplate);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim() || !docType) return;
    setCreating(true);
    const template = await createTemplate({ name: name.trim(), document_type: docType, category } as any);
    setCreating(false);
    if (template) {
      onClose();
      navigate(`/settings/document-templates/builder/${template._id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Professional Offer Letter"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            >
              {["professional", "corporate", "minimal", "modern", "classic", "government", "gst", "international", "custom"].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Type</label>
            <div className="space-y-3">
              {Object.entries(TYPE_GROUPS).map(([group, types]) => (
                <div key={group}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {types.map((t) => (
                      <button
                        key={t}
                        onClick={() => setDocType(t)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          docType === t
                            ? "bg-red-600 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {formatDocType(t)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || !docType || creating}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {creating ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Action Dropdown
// ---------------------------------------------------------------
function ActionDropdown({ template, onAction }: { template: any; onAction: (action: string, id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
        <MoreVertical size={16} className="text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 min-w-[180px]">
            <button onClick={() => { onAction("edit", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <FileText size={14} /> Edit
            </button>
            <button onClick={() => { onAction("preview", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <Eye size={14} /> Preview
            </button>
            <button onClick={() => { onAction("duplicate", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <Copy size={14} /> Duplicate
            </button>
            {template.status !== "published" && (
              <button onClick={() => { onAction("publish", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <CheckCircle size={14} /> Publish
              </button>
            )}
            {template.status !== "archived" && (
              <button onClick={() => { onAction("archive", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Archive size={14} /> Archive
              </button>
            )}
            {template.status === "archived" && (
              <button onClick={() => { onAction("restore", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <RotateCcw size={14} /> Restore
              </button>
            )}
            {!template.is_default && (
              <button onClick={() => { onAction("setDefault", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Star size={14} /> Set as Default
              </button>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button onClick={() => { onAction("delete", template._id); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------
export default function DocumentTemplates() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchDebounce, setSearchDebounce] = useState("");

  const {
    templates, pagination, filters, loading,
    setFilters, fetchTemplates, duplicateTemplate,
    publishTemplate, archiveTemplate, restoreTemplate,
    setDefaultTemplate, deleteTemplate, seedTemplates,
  } = useDocumentTemplateStore();

  useEffect(() => {
    fetchTemplates(1);
  }, [filters.module, filters.status, filters.category, filters.document_type]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchDebounce });
      fetchTemplates(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDebounce]);

  const handleAction = useCallback(async (action: string, id: string) => {
    switch (action) {
      case "edit": navigate(`/settings/document-templates/builder/${id}`); break;
      case "preview": navigate(`/settings/document-templates/builder/${id}?preview=true`); break;
      case "duplicate": await duplicateTemplate(id); break;
      case "publish": await publishTemplate(id); break;
      case "archive": await archiveTemplate(id); break;
      case "restore": await restoreTemplate(id); break;
      case "setDefault": await setDefaultTemplate(id); break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this template?")) {
          await deleteTemplate(id);
        }
        break;
    }
  }, [navigate, duplicateTemplate, publishTemplate, archiveTemplate, restoreTemplate, setDefaultTemplate, deleteTemplate]);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage document templates for all modules</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => seedTemplates()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition"
            title="Seed pre-designed sample templates"
          >
            <RotateCcw size={16} />
            Load Samples
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl shadow-sm transition"
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchDebounce}
            onChange={(e) => setSearchDebounce(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Module Filter */}
        <select
          value={filters.module}
          onChange={(e) => setFilters({ module: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none transition"
        >
          <option value="">All Modules</option>
          {Object.entries(MODULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 outline-none transition"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition ${viewMode === "grid" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
          >
            <LayoutGrid size={16} className={viewMode === "grid" ? "text-red-600" : "text-gray-500"} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-white dark:bg-gray-600 shadow-sm" : ""}`}
          >
            <List size={16} className={viewMode === "list" ? "text-red-600" : "text-gray-500"} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No templates found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first document template to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition"
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>
      )}

      {/* Grid View */}
      {!loading && templates.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {templates.map((t) => {
            const badge = STATUS_BADGES[t.status] || STATUS_BADGES.draft;
            return (
              <div
                key={t._id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/settings/document-templates/builder/${t._id}`)}
              >
                {/* Preview Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <FileText size={48} className="text-gray-300 dark:text-gray-600" />
                  {t.is_default && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-md flex items-center gap-1">
                      <Star size={10} /> Default
                    </div>
                  )}
                  <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                    <ActionDropdown template={t} onAction={handleAction} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{t.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDocType(t.document_type)}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${badge.bg} ${badge.text}`}>{badge.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{MODULE_LABELS[t.module] || t.module}</span>
                    <span>v{t.version}</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(t.updated_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && templates.length > 0 && viewMode === "list" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Template</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Type</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Module</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Version</th>
                <th className="text-left px-5 py-3 text-gray-600 dark:text-gray-300 font-medium">Updated</th>
                <th className="text-right px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {templates.map((t) => {
                const badge = STATUS_BADGES[t.status] || STATUS_BADGES.draft;
                return (
                  <tr
                    key={t._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition"
                    onClick={() => navigate(`/settings/document-templates/builder/${t._id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                          {t.is_default && <span className="text-xs text-amber-600 dark:text-amber-400">★ Default</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{formatDocType(t.document_type)}</td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{MODULE_LABELS[t.module] || t.module}</td>
                    <td className="px-5 py-3.5"><span className={`px-2.5 py-1 text-xs font-medium rounded-md ${badge.bg} ${badge.text}`}>{badge.label}</span></td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">v{t.version}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{formatDate(t.updated_at)}</td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <ActionDropdown template={t} onAction={handleAction} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTemplates(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchTemplates(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  p === pagination.page ? "bg-red-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchTemplates(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateTemplateModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

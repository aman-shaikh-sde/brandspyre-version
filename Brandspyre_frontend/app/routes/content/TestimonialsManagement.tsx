import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Quote,
  CheckCircle2,
  Trash2,
  Edit2,
  Send,
  Archive,
  Star,
  Layers,
  AlertCircle,
  X,
  Building2,
  Check,
} from "lucide-react";
import { authFetch } from "../../../src/utils/authFetch";
import { BASE_URL } from "../../constants/api";

interface TestimonialAdminItem {
  _id: string;
  person_name: string;
  person_role: string;
  company_name: string;
  company_logo?: string;
  person_avatar?: string;
  industry?: string;
  sector: string;
  testimonial_quote: string;
  rating?: number;
  headline?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  modules_used?: string[];
  location?: string;
  featured?: boolean;
  sort_order?: number;
  status: "draft" | "published" | "archived";
  published_at?: string;
  created_at: string;
}

export default function TestimonialsManagement() {
  const [items, setItems] = useState<TestimonialAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [industry, setIndustry] = useState("");
  const [headline, setHeadline] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [outcome, setOutcome] = useState("");
  const [modulesUsed, setModulesUsed] = useState("");
  const [rating, setRating] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${BASE_URL}/content/testimonials`;
      if (statusFilter && statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const res = await authFetch(url);
      if (!res.ok) throw new Error("Failed to load testimonials");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setEditingId(null);
    setPersonName("");
    setPersonRole("");
    setCompanyName("");
    setSector("");
    setIndustry("");
    setHeadline("");
    setTestimonialQuote("");
    setChallenge("");
    setSolution("");
    setOutcome("");
    setModulesUsed("");
    setRating(5);
    setFeatured(false);
    setStatus("published");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: TestimonialAdminItem) => {
    setEditingId(item._id);
    setPersonName(item.person_name || "");
    setPersonRole(item.person_role || "");
    setCompanyName(item.company_name || "");
    setSector(item.sector || "");
    setIndustry(item.industry || "");
    setHeadline(item.headline || "");
    setTestimonialQuote(item.testimonial_quote || "");
    setChallenge(item.challenge || "");
    setSolution(item.solution || "");
    setOutcome(item.outcome || "");
    setModulesUsed(Array.isArray(item.modules_used) ? item.modules_used.join(", ") : "");
    setRating(item.rating || 5);
    setFeatured(Boolean(item.featured));
    setStatus(item.status === "draft" ? "draft" : "published");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !sector.trim() || !testimonialQuote.trim()) {
      alert("Please fill in required fields: Person Name, Sector, and Testimonial Quote.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        person_name: personName.trim(),
        person_role: personRole.trim() || "Operations Leader",
        company_name: companyName.trim() || "Enterprise Client",
        sector: sector.trim(),
        industry: industry.trim(),
        headline: headline.trim(),
        testimonial_quote: testimonialQuote.trim(),
        challenge: challenge.trim(),
        solution: solution.trim(),
        outcome: outcome.trim(),
        modules_used: modulesUsed
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        rating: Number(rating),
        featured,
        status,
      };

      const url = editingId
        ? `${BASE_URL}/content/testimonials/${editingId}`
        : `${BASE_URL}/content/testimonials`;
      const method = editingId ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save testimonial");
      }

      setIsModalOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      alert(err.message || "Error saving testimonial");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      const action = currentStatus === "published" ? "unpublish" : "publish";
      const res = await authFetch(`${BASE_URL}/content/testimonials/${id}/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error("Error toggling testimonial status:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete story for ${name}?`)) return;
    try {
      const res = await authFetch(`${BASE_URL}/content/testimonials/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error("Error deleting testimonial:", err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.person_name?.toLowerCase().includes(q) ||
      item.company_name?.toLowerCase().includes(q) ||
      item.sector?.toLowerCase().includes(q) ||
      item.headline?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold text-xs">
              CMS Social Proof
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Public Marketing Website</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
            Case Studies & Testimonials
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer quotes, operational challenges, configuration solutions, and verified outcomes.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-700 hover:bg-red-800 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Case Study</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1">
          {[
            { key: "all", label: "All Stories" },
            { key: "published", label: "Published" },
            { key: "draft", label: "Drafts" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>
      </div>

      {/* Grid of Testimonials */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading case studies...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          No case studies found. Click "Add Case Study" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                    {item.sector}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {item.featured && (
                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-bold text-[9px]">
                        FEATURED
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {item.headline || `${item.company_name} Case Study`}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-3">
                  &ldquo;{item.testimonial_quote}&rdquo;
                </p>

                {item.outcome && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] text-slate-700 dark:text-slate-300 border border-emerald-200/50 dark:border-emerald-900/30">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">Outcome: </span>
                    <span className="line-clamp-2">{item.outcome}</span>
                  </div>
                )}
              </div>

              {/* Footer Row */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white text-[11px] block">
                    {item.person_name}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.person_role}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePublish(item._id, item.status)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title={item.status === "published" ? "Unpublish to Draft" : "Publish Now"}
                  >
                    {item.status === "published" ? <Archive size={13} /> : <Send size={13} />}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Story"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(item._id, item.person_name)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                    title="Delete Story"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingId ? "Edit Customer Story" : "New Customer Story & Testimonial"}
                </h3>
                <p className="text-xs text-slate-500">
                  Published to Brandspyre's public marketing website and homepage.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Role / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations Director"
                    value={personRole}
                    onChange={(e) => setPersonRole(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Logistics Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Sector / Industry *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Multi-Store Retail & Distribution"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Connecting POS checkouts with warehouse inventory."
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Testimonial Quote *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Direct customer quotation..."
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    The Operational Challenge
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What friction was the customer facing?"
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    How Brandspyre Was Configured (Solution)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Which modules and automations were deployed?"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Operational Outcome
                </label>
                <input
                  type="text"
                  placeholder="e.g. Month-end billing closed in minutes with zero discrepancy disputes."
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Modules Deployed (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Retail Point of Sale, Multi-Warehouse Inventory, Purchase Orders"
                  value={modulesUsed}
                  onChange={(e) => setModulesUsed(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span>Featured on Home</span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Status:</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="px-2 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-800 text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update Story" : "Publish Story"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

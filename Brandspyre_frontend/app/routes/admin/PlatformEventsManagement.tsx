import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Sliders,
  Send,
  ShieldCheck,
  Check
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function PlatformEventsManagement() {
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "commissions" | "settlements">("overview");
  const [loading, setLoading] = useState(true);

  // Overview Data
  const [overview, setOverview] = useState<any>(null);

  // Events List Data
  const [events, setEvents] = useState<any[]>([]);
  const [eventStatusFilter, setEventStatusFilter] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  // Commission Rules Data
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState({
    scope: "GLOBAL",
    commission_model: "PERCENTAGE",
    rate_percentage: 5,
    fixed_fee: 0,
    fee_payer: "ORGANIZER",
    applies_to: "TICKETS_AND_ADDONS",
    min_commission: 0,
    max_commission: 0,
    currency: "INR"
  });

  // Settlements Data
  const [settlements, setSettlements] = useState<any[]>([]);
  const [settlementStatusFilter, setSettlementStatusFilter] = useState("");
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);
  const [disburseError, setDisburseError] = useState<string | null>(null);
  const [disburseForm, setDisburseForm] = useState({
    payout_method: "BANK_TRANSFER",
    payout_reference: "",
    notes: ""
  });

  // Generate Batch Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchForm, setBatchForm] = useState({
    tenant_id: "",
    period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [ovRes, evRes, comRes, setRes] = await Promise.all([
        eventService.getAdminOverview(),
        eventService.getAdminEvents({ limit: 50 }),
        eventService.getCommissionRules(),
        eventService.getAdminSettlements({ limit: 50 })
      ]);

      // Overview: backend returns { data: { metrics: {...} } }
      if (ovRes.success) setOverview(ovRes.data?.metrics || ovRes.data || {});
      // Events list: backend returns { data: [...events], pagination: {...} }
      if (evRes.success) setEvents(Array.isArray(evRes.data) ? evRes.data : (evRes.data?.events || []));
      // Commission rules: backend returns { data: [...rules] }
      if (comRes.success) setCommissionRules(Array.isArray(comRes.data) ? comRes.data : (comRes.data || []));
      // Settlements: backend returns { data: [...settlements], pagination: {...} }
      if (setRes.success) setSettlements(Array.isArray(setRes.data) ? setRes.data : (setRes.data?.settlements || []));
    } catch (err) {
      console.error("Platform admin event data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (eventId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      const res = await eventService.moderateEvent(eventId, { status: newStatus });
      if (res.success) {
        setFeedback({ type: "success", text: `Event updated to status ${newStatus}.` });
        const evRes = await eventService.getAdminEvents({ limit: 50 });
        if (evRes.success) setEvents(Array.isArray(evRes.data) ? evRes.data : (evRes.data?.events || []));
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Failed to update event status." });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditRule = (rule: any) => {
    setEditingRuleId(rule._id);
    setRuleForm({
      scope: rule.scope || rule.rule_level || "GLOBAL",
      commission_model: rule.commission_model || "PERCENTAGE",
      rate_percentage: rule.rate_percentage ?? rule.percentage ?? 5,
      fixed_fee: rule.fixed_fee || 0,
      fee_payer: rule.fee_payer || rule.fee_bearer || "ORGANIZER",
      applies_to: rule.applies_to || "TICKETS_AND_ADDONS",
      min_commission: rule.min_commission_cap || 0,
      max_commission: rule.max_commission_cap || 0,
      currency: rule.currency || "INR"
    });
    setShowRuleModal(true);
  };

  const handleSaveCommissionRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await eventService.saveCommissionRule({
        ...(editingRuleId ? { id: editingRuleId } : {}),
        scope: ruleForm.scope,
        model: ruleForm.commission_model,         // backend expects 'model', not 'commission_model'
        rate_percentage: Number(ruleForm.rate_percentage),
        fixed_fee: Number(ruleForm.fixed_fee),
        fee_payer: ruleForm.fee_payer,
        applies_to: ruleForm.applies_to,
        min_commission_cap: Number(ruleForm.min_commission),
        max_commission_cap: Number(ruleForm.max_commission),
        currency: ruleForm.currency
      });
      if (res.success) {
        setFeedback({ type: "success", text: editingRuleId ? "Commission rule updated." : "Platform commission rule saved successfully." });
        setShowRuleModal(false);
        setEditingRuleId(null);
        const comRes = await eventService.getCommissionRules();
        if (comRes.success) setCommissionRules(Array.isArray(comRes.data) ? comRes.data : (comRes.data || []));
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.response?.data?.message || "Failed to save commission rule." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setBatchError(null);
      const res = await eventService.generateSettlementBatch({
        tenant_id: batchForm.tenant_id,
        period_start: batchForm.period_start,
        period_end: batchForm.period_end,
        notes: batchForm.notes
      });
      if (res.success) {
        setFeedback({ type: "success", text: "Settlement batch generated successfully from ledger balances." });
        setShowBatchModal(false);
        setBatchForm({
          tenant_id: "",
          period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          period_end: new Date().toISOString().slice(0, 10),
          notes: ""
        });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to generate settlement batch.";
      setFeedback({ type: "error", text: errMsg });
      setBatchError(errMsg);
    } finally {
      try {
        const [setRes, ovRes] = await Promise.all([
          eventService.getAdminSettlements({ limit: 50 }),
          eventService.getAdminOverview()
        ]);
        if (setRes.success) setSettlements(Array.isArray(setRes.data) ? setRes.data : (setRes.data?.settlements || []));
        if (ovRes.success) setOverview(ovRes.data?.metrics || ovRes.data || {});
      } catch (e) {
        console.error("Error refreshing data:", e);
      }
      setActionLoading(false);
    }
  };

  const handleApproveSettlement = async (id: string) => {
    try {
      setActionLoading(true);
      const res = await eventService.approveSettlement(id);
      if (res.success) {
        setFeedback({ type: "success", text: "Settlement approved for bank disbursement." });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to approve settlement.";
      setFeedback({ type: "error", text: errMsg });
    } finally {
      try {
        const [setRes, ovRes] = await Promise.all([
          eventService.getAdminSettlements({ limit: 50 }),
          eventService.getAdminOverview()
        ]);
        if (setRes.success) setSettlements(Array.isArray(setRes.data) ? setRes.data : (setRes.data?.settlements || []));
        if (ovRes.success) setOverview(ovRes.data?.metrics || ovRes.data || {});
      } catch (e) {
        console.error("Error refreshing data after approval:", e);
      }
      setActionLoading(false);
    }
  };

  const handleDisburseSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement) return;
    try {
      setActionLoading(true);
      setDisburseError(null);
      const res = await eventService.disburseSettlement(selectedSettlement._id, disburseForm);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Settlement #${selectedSettlement.settlement_number || selectedSettlement._id.slice(-6)} recorded as disbursed.`
        });
        setShowDisburseModal(false);
        setSelectedSettlement(null);
        setDisburseForm({ payout_method: "BANK_TRANSFER", payout_reference: "", notes: "" });
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to record disbursement.";
      setFeedback({ type: "error", text: errMsg });
      setDisburseError(errMsg);
      // If settlement was already COMPLETED or cannot be disbursed, close modal and reset selectedSettlement
      if (errMsg.toLowerCase().includes("completed") || errMsg.toLowerCase().includes("disbursed")) {
        setShowDisburseModal(false);
        setSelectedSettlement(null);
      }
    } finally {
      try {
        const [setRes, ovRes] = await Promise.all([
          eventService.getAdminSettlements({ limit: 50 }),
          eventService.getAdminOverview()
        ]);
        if (setRes.success) setSettlements(Array.isArray(setRes.data) ? setRes.data : (setRes.data?.settlements || []));
        if (ovRes.success) setOverview(ovRes.data?.metrics || ovRes.data || {});
      } catch (e) {
        console.error("Error refreshing data after disbursement:", e);
      }
      setActionLoading(false);
    }
  };

  const handleDeleteSettlement = async (id: string, settlementNumber?: string) => {
    if (!window.confirm(`Delete settlement batch #${settlementNumber || id.slice(-6)}? This will release reserved balances so remaining amounts can be re-calculated.`)) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await eventService.deleteSettlement(id);
      if (res.success) {
        setFeedback({ type: "success", text: `Settlement batch #${settlementNumber || id.slice(-6)} deleted successfully.` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.response?.data?.message || err?.message || "Failed to delete settlement batch." });
    } finally {
      try {
        const [setRes, ovRes] = await Promise.all([
          eventService.getAdminSettlements({ limit: 50 }),
          eventService.getAdminOverview()
        ]);
        if (setRes.success) setSettlements(Array.isArray(setRes.data) ? setRes.data : (setRes.data?.settlements || []));
        if (ovRes.success) setOverview(ovRes.data?.metrics || ovRes.data || {});
      } catch (e) {
        console.error("Error refreshing data after deletion:", e);
      }
      setActionLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (eventStatusFilter && ev.status !== eventStatusFilter) return false;
    if (eventSearch) {
      const q = eventSearch.toLowerCase();
      return ev.title?.toLowerCase().includes(q) || ev.tenant_id?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Event Management & Settlements"
        description="Global platform administration for events, commission precedence hierarchy, and organizer settlements."
        rightElement={
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Gross CMV</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            INR {(overview?.platform_gmv || overview?.total_gmv || 0).toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Gross ticket & add-on sales</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Commission Earned</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            INR {(overview?.platform_commission_earned || overview?.total_platform_commission || 0).toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Net platform fee revenue</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Orders</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {(overview?.total_orders || 0).toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Authoritative bookings</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Events</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">
            {(overview?.published_events || overview?.total_active_events || events.length || 0).toLocaleString()}
          </div>
          <p className="text-2xs text-gray-400 mt-1">Across all organizations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {[
            { id: "overview", label: "Executive Summary", icon: TrendingUp },
            { id: "events", label: `Events Moderation (${events.length})`, icon: CalendarDays },
            { id: "commissions", label: `Commission Engine (${commissionRules.length})`, icon: Percent },
            { id: "settlements", label: `Settlements & Payouts (${settlements.length})`, icon: DollarSign }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? "border-primary-600 text-primary-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Executive Summary */}
        {activeTab === "overview" && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-6 h-6 text-primary-400" />
                <h3 className="text-lg font-bold">Brandspyre Event Infrastructure Status</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                The event system operates with strict multi-tenant isolation, immutable double-entry financial ledgering,
                unpredictable 192-bit QR verification tokens, and authoritative server-side commission snapshots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Quick Navigation</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("events")}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-800"
                  >
                    <span>Moderate & Review Events</span>
                    <span className="text-primary-600">→</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("commissions")}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-800"
                  >
                    <span>Configure Global / Tenant Commission Policies</span>
                    <span className="text-primary-600">→</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("settlements")}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-800"
                  >
                    <span>Generate & Disburse Organizer Payouts</span>
                    <span className="text-primary-600">→</span>
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Commission Precedence Architecture</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="p-2.5 rounded bg-purple-50 text-purple-900 font-medium">
                    1. <strong>EVENT Override:</strong> Highest priority rule configured directly on an authorized event.
                  </div>
                  <div className="p-2.5 rounded bg-blue-50 text-blue-900 font-medium">
                    2. <strong>ORGANIZATION Agreement:</strong> Custom negotiated commission rate for a specific tenant.
                  </div>
                  <div className="p-2.5 rounded bg-indigo-50 text-indigo-900 font-medium">
                    3. <strong>SUBSCRIPTION PLAN Rule:</strong> Tiered rate associated with the tenant’s SaaS plan.
                  </div>
                  <div className="p-2.5 rounded bg-gray-50 text-gray-900 font-medium">
                    4. <strong>GLOBAL Platform Default:</strong> Universal fallback rate (Default: 5% organizer-paid).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Events Moderation */}
        {activeTab === "events" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter events by title or organization..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={eventStatusFilter}
                  onChange={(e) => setEventStatusFilter(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Event</th>
                    <th className="px-5 py-3.5">Organization</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.map((ev: any) => (
                    <tr key={ev._id} className="hover:bg-gray-50 text-xs">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{ev.title}</div>
                        <div className="text-2xs text-gray-400 mt-0.5">{ev.event_type} • {ev.venue_name || "Online"}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-700">
                        {ev.tenant_id?.name || "Brandspyre Tenant"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-gray-100 text-gray-700">
                          {ev.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(ev.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-2xs font-semibold px-2.5 py-1 rounded-full ${
                            ev.status === "PUBLISHED"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : ev.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {ev.status !== "PUBLISHED" && (
                            <button
                              onClick={() => handleModerate(ev._id, "PUBLISHED")}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-2xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {ev.status === "PUBLISHED" && (
                            <button
                              onClick={() => handleModerate(ev._id, "CANCELLED")}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-2xs font-semibold"
                            >
                              Suspend
                            </button>
                          )}
                          <a
                            href={`/explore-events/${ev.slug || ev._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Preview Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Commission Engine Rules */}
        {activeTab === "commissions" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Commission Rules & Fee Schedules</h3>
                <p className="text-xs text-gray-500">Configure deterministic percentage and flat fees per ticket.</p>
              </div>
              <button
                onClick={() => setShowRuleModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Commission Rule
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Scope Level</th>
                    <th className="px-5 py-3.5">Model</th>
                    <th className="px-5 py-3.5">Commission Rate</th>
                    <th className="px-5 py-3.5">Fixed Fee</th>
                    <th className="px-5 py-3.5">Fee Bearer</th>
                    <th className="px-5 py-3.5">Add-ons</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {commissionRules.map((rule: any) => (
                    <tr key={rule._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {rule.scope || rule.rule_level || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{rule.commission_model}</td>
                      <td className="px-5 py-4 font-semibold text-amber-700">
                        {rule.rate_percentage ?? rule.percentage ?? 0}%
                      </td>
                      <td className="px-5 py-4 text-gray-800">
                        INR {rule.fixed_fee || 0}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-gray-100 text-gray-700">
                          {rule.fee_payer || rule.fee_bearer || "ORGANIZER"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {(rule.applies_to === 'TICKETS_AND_ADDONS' || rule.applies_to_addons) ? (
                          <span className="text-green-600 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-400">Tickets Only</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                            rule.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {rule.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditRule(rule)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Settlements & Payouts */}
        {activeTab === "settlements" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Organizer Settlements Management</h3>
                <p className="text-xs text-gray-500">Generate settlement statements, approve batches, and record bank payouts.</p>
              </div>
              <button
                onClick={() => setShowBatchModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" /> Generate Settlement Batch
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Batch #</th>
                    <th className="px-5 py-3.5">Organization</th>
                    <th className="px-5 py-3.5">Period</th>
                    <th className="px-5 py-3.5">Gross Sales</th>
                    <th className="px-5 py-3.5">Platform Fee</th>
                    <th className="px-5 py-3.5">Net Payout</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {settlements.map((st: any) => (
                    <tr key={st._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-mono font-bold text-primary-600">
                        {st.settlement_number || st._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-800">
                        {st.tenant_id?.company_name || st.tenant_id?.name || "Organization"}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(st.period_start).toLocaleDateString()} – {new Date(st.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {st.currency || "INR"} {(st.gross_sales ?? st.gross_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-red-600">
                        -{st.currency || "INR"} {(st.total_commission_deducted ?? st.commission_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {st.currency || "INR"} {(st.net_payout_amount ?? st.net_amount ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-2xs font-semibold px-2.5 py-1 rounded-full ${
                            st.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : st.status === "APPROVED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : st.status === "PENDING_APPROVAL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : st.status === "REVERSED" || st.status === "FAILED"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {st.status === "PENDING_APPROVAL" ? "PENDING APPROVAL"
                            : st.status === "COMPLETED" ? "DISBURSED"
                            : st.status === "REVERSED" ? "CANCELLED"
                            : st.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {st.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                onClick={() => handleApproveSettlement(st._id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-2xs font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeleteSettlement(st._id, st.settlement_number)}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-2xs font-semibold border border-red-200"
                                title="Delete pending batch"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {st.status === "APPROVED" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSettlement(st);
                                  setDisburseError(null);
                                  setShowDisburseModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-semibold"
                              >
                                Record Payout
                              </button>
                              <button
                                onClick={() => handleDeleteSettlement(st._id, st.settlement_number)}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded text-2xs font-semibold border border-gray-200"
                                title="Cancel approval and delete"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {st.status === "COMPLETED" && (
                            <span className="text-2xs text-gray-400 font-mono">UTR: {st.payout_reference}</span>
                          )}
                          {st.status === "REVERSED" && (
                            <span className="text-2xs text-red-400 italic">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Commission Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingRuleId ? "Edit Commission Rule" : "Create Commission Rule"}
              </h3>
              <button onClick={() => { setShowRuleModal(false); setEditingRuleId(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ×
              </button>
            </div>
            <form onSubmit={handleSaveCommissionRule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Scope Level</label>
                  <select
                    value={ruleForm.scope}
                    onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="GLOBAL">Global Default</option>
                    <option value="SUBSCRIPTION_PLAN">Subscription Plan</option>
                    <option value="ORGANIZATION">Organization</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Model</label>
                  <select
                    value={ruleForm.commission_model}
                    onChange={(e) => setRuleForm({ ...ruleForm, commission_model: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Fee</option>
                    <option value="PERCENTAGE_PLUS_FIXED">% + Fixed Fee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Percentage Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ruleForm.rate_percentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, rate_percentage: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Fixed Fee Per Item</label>
                  <input
                    type="number"
                    min="0"
                    value={ruleForm.fixed_fee}
                    onChange={(e) => setRuleForm({ ...ruleForm, fixed_fee: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Fee Bearer</label>
                  <select
                    value={ruleForm.fee_payer}
                    onChange={(e) => setRuleForm({ ...ruleForm, fee_payer: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="ORGANIZER">Organizer (Deducted from sales)</option>
                    <option value="BUYER">Buyer (Added to ticket price)</option>
                    <option value="SPLIT">Split</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Applies to Add-ons?</label>
                  <select
                    value={ruleForm.applies_to}
                    onChange={(e) => setRuleForm({ ...ruleForm, applies_to: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="TICKETS_AND_ADDONS">Yes (Tickets + Addons)</option>
                    <option value="TICKETS_ONLY">No (Tickets Only)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payout / Disburse Modal */}
      {showDisburseModal && selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Record Settlement Payout</h3>
              <button
                onClick={() => {
                  setShowDisburseModal(false);
                  setDisburseError(null);
                  setSelectedSettlement(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {disburseError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{disburseError}</span>
              </div>
            )}

            <p className="text-xs text-gray-600">
              You are recording bank disbursement of{" "}
              <strong className="text-emerald-700 font-bold">
                {selectedSettlement.currency || "INR"} {(selectedSettlement.net_payout_amount ?? selectedSettlement.net_amount ?? 0).toLocaleString()}
              </strong>{" "}
              to <strong>{selectedSettlement.tenant_id?.company_name || selectedSettlement.tenant_id?.name || "Organizer"}</strong> for Batch #{selectedSettlement.settlement_number || selectedSettlement._id.slice(-8)}.
            </p>
            <form onSubmit={handleDisburseSettlement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Payout Method</label>
                <select
                  value={disburseForm.payout_method}
                  onChange={(e) => setDisburseForm({ ...disburseForm, payout_method: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="IMPS">IMPS Instant Transfer</option>
                  <option value="UPI">UPI Payout</option>
                  <option value="RAZORPAYX">RazorpayX Automated Payout</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Bank UTR / Reference Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR123456789012"
                  value={disburseForm.payout_reference}
                  onChange={(e) => setDisburseForm({ ...disburseForm, payout_reference: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via Corporate Banking"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisburseModal(false);
                    setDisburseError(null);
                    setSelectedSettlement(null);
                  }}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !disburseForm.payout_reference.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Generate Settlement Batch</h3>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {batchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{batchError}</span>
              </div>
            )}

            {/* Settlement flow guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold uppercase tracking-wide mb-1">3-Step Settlement Flow</p>
              <p>① <strong>Generate Batch</strong> — calculates payable balance from the financial ledger</p>
              <p>② <strong>Approve</strong> — admin reviews and authorizes the settlement</p>
              <p>③ <strong>Record Payout</strong> — enter the bank UTR after transferring funds</p>
            </div>
            <form onSubmit={handleGenerateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Organization *</label>
                {events.length > 0 ? (
                  <select
                    required
                    value={batchForm.tenant_id}
                    onChange={(e) => setBatchForm({ ...batchForm, tenant_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">— Select an organization —</option>
                    {Array.from(
                      new Map(
                        events
                          .filter((ev: any) => ev.tenant_id?._id)
                          .map((ev: any) => [ev.tenant_id._id, ev.tenant_id])
                      ).values()
                    ).map((org: any) => (
                      <option key={org._id} value={org._id}>
                        {org.company_name || org.name || org._id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Paste Organization / Tenant ID"
                    value={batchForm.tenant_id}
                    onChange={(e) => setBatchForm({ ...batchForm, tenant_id: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Period Start</label>
                  <input
                    type="date"
                    required
                    value={batchForm.period_start}
                    onChange={(e) => setBatchForm({ ...batchForm, period_start: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 uppercase mb-1">Period End</label>
                  <input
                    type="date"
                    required
                    value={batchForm.period_end}
                    onChange={(e) => setBatchForm({ ...batchForm, period_end: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 uppercase mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes for this settlement run..."
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchError(null);
                  }}
                  className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !batchForm.tenant_id.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "Generating…" : "Generate Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

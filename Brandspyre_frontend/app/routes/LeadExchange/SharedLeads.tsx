import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { getAuthHeaders } from "src/utils/authFetch";

export default function SharedLeads() {
  const [shares, setShares] = useState<any[]>([]);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [historyModalLead, setHistoryModalLead] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("Fulfilled");
  const [shareForm, setShareForm] = useState({
    lead_id: "",
    target_tenant_id: "",
    access_level: "read_update",
    document_permission: "shared"
  });
  const [summaryNote, setSummaryNote] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchSharedLeads = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [sharesRes, leadsRes, orgsRes, analyticsRes] = await Promise.all([
        apiClient.get(`/lead-exchange/shared-leads`, { headers }),
        apiClient.get(`/lead-exchange/available-leads`, { headers }),
        apiClient.get(`/lead-exchange/available-organizations`, { headers }),
        apiClient.get(`/lead-exchange/analytics`, { headers })
      ]);

      if (sharesRes.data.success) {
        setShares(sharesRes.data.data || []);
        if (sharesRes.data.current_tenant_id) {
          setCurrentTenantId(sharesRes.data.current_tenant_id.toString());
        }
      }
      if (leadsRes.data.success) setAvailableLeads(leadsRes.data.data || []);
      if (orgsRes.data.success) setAvailableOrgs(orgsRes.data.data || []);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedLeads();
  }, []);

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = getAuthHeaders();
      const res = await apiClient.post(`/lead-exchange/share-lead`, shareForm, {
        headers
      });
      if (res.data.success) {
        setMessage({ text: "Lead shared cleanly with partner organization (Immediately visible & accepted)!", type: "success" });
        setShowShareModal(false);
        fetchSharedLeads();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to share lead", type: "error" });
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      const headers = getAuthHeaders();
      const res = await apiClient.patch(
        `/lead-exchange/shared-leads/${selectedLead.lead_id._id}/stage`,
        { status: newStatus, summary: summaryNote },
        { headers }
      );

      if (res.data.success) {
        setMessage({ text: res.data.message || `Lead status updated to '${newStatus}'!`, type: "success" });
        setSelectedLead(null);
        setSummaryNote("");
        fetchSharedLeads();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to update lead status", type: "error" });
    }
  };

  const handleRecallAccess = async (leadId: string) => {
    if (!window.confirm("Are you sure you want to recall shared access for this lead?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await apiClient.patch(
        `/lead-exchange/shared-leads/${leadId}/recall`,
        { reason: "Recalled by Provider Organization" },
        { headers }
      );
      if (res.data.success) {
        setMessage({ text: "Shared lead access recalled cleanly!", type: "success" });
        fetchSharedLeads();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to recall lead", type: "error" });
    }
  };

  const handleRejectLead = async (leadId: string) => {
    if (!window.confirm("Reject this shared lead?")) return;
    try {
      const headers = getAuthHeaders();
      const res = await apiClient.patch(
        `/lead-exchange/shared-leads/${leadId}/reject`,
        { reason: "Rejected by Consumer Organization" },
        { headers }
      );
      if (res.data.success) {
        setMessage({ text: "Shared lead rejected cleanly", type: "success" });
        fetchSharedLeads();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to reject lead", type: "error" });
    }
  };

  const getMarketplaceBadge = (status: string) => {
    switch (status) {
      case 'fulfilled':
      case 'billable':
      case 'settlement_created':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">⚡ Billable (Fulfilled)</span>;
      case 'invoiced':
      case 'payment_pending':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">📄 Payment Pending</span>;
      case 'settled':
      case 'paid':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">✓ Settled</span>;
      case 'disputed':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">⚠️ Disputed</span>;
      case 'working':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">In Progress</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Pending</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shared Leads Marketplace</h1>
          <p className="text-slate-500 text-sm">Bilateral lead exchange, SLA fulfillment tracking, and separate marketplace settlement states.</p>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="bg-red-700 hover:bg-red-800 text-white font-medium px-4 py-2 rounded-lg transition flex items-center gap-2 shadow"
        >
          <span>+ Share Lead with Partner</span>
        </button>
      </div>

      {/* Analytics KPI Dashboard */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Leads Shared (Provider)</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{analytics.provider_analytics?.leads_shared || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Leads Received (Consumer)</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{analytics.consumer_analytics?.leads_received || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Fulfilled & Settled</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{analytics.settlement_analytics?.paid_transactions || 0}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">Settled Volume (₹)</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">₹{(analytics.settlement_analytics?.paid_amount || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {message.text}
        </div>
      )}

      {/* Shared Leads Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <th className="p-3.5">Lead / Contact</th>
              <th className="p-3.5">Provider (Source)</th>
              <th className="p-3.5">Receiver (Processor)</th>
              <th className="p-3.5">CRM Stage</th>
              <th className="p-3.5">Marketplace Settlement Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">Loading shared leads...</td>
              </tr>
            ) : shares.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No shared leads recorded. Click &quot;+ Share Lead&quot; to share a lead with partner organizations.</td>
              </tr>
            ) : (
              shares.map((s) => {
                const isProvider = currentTenantId === (s.owner_tenant_id?._id || s.owner_tenant_id)?.toString();
                const isConsumer = currentTenantId === (s.shared_tenant_id?._id || s.shared_tenant_id)?.toString();

                return (
                  <tr key={s._id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{s.lead_id?.lead_name || "Lead Record"}</div>
                      <div className="text-xs text-slate-400 font-normal">{s.lead_id?.phone || s.lead_id?.email || "-"}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium text-xs">{s.owner_tenant_id?.company_name || s.owner_tenant_id?.name || "Provider"}</td>
                    <td className="p-3.5 text-slate-700 font-medium text-xs">{s.shared_tenant_id?.company_name || s.shared_tenant_id?.name || "Receiver"}</td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">
                        {s.lead_id?.status || "New"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {getMarketplaceBadge(s.marketplace_status || s.share_status)}
                    </td>
                    <td className="p-3.5 text-right flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => { setSelectedLead(s); setNewStatus(s.lead_id?.status || "Fulfilled"); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                      >
                        Update Stage
                      </button>
                      <button
                        onClick={() => setHistoryModalLead(s)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                      >
                        Audit Trail ({s.activity_history?.length || 0})
                      </button>
                      {isProvider && s.share_status !== 'recalled' && (
                        <button
                          onClick={() => handleRecallAccess(s.lead_id?._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                        >
                          Recall
                        </button>
                      )}
                      {isConsumer && s.share_status !== 'rejected' && s.share_status !== 'completed' && (
                        <button
                          onClick={() => handleRejectLead(s.lead_id?._id)}
                          className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs px-2 py-1.5 rounded-lg transition"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Share Lead Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Share Lead with Partner Org</h2>
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Lead from CRM</label>
                <select
                  required
                  value={shareForm.lead_id}
                  onChange={(e) => setShareForm({ ...shareForm, lead_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                >
                  <option value="">-- Choose Lead --</option>
                  {availableLeads.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.lead_name} {l.meta_lead_id ? "(META AD)" : ""} - {l.phone || l.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Target Partner Organization</label>
                <select
                  required
                  value={shareForm.target_tenant_id}
                  onChange={(e) => setShareForm({ ...shareForm, target_tenant_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                >
                  <option value="">-- Choose Target Organization --</option>
                  {availableOrgs.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.company_name || o.name} ({o.tenant_code || o.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Document Sharing Scope</label>
                <select
                  value={shareForm.document_permission}
                  onChange={(e) => setShareForm({ ...shareForm, document_permission: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                >
                  <option value="shared">Shared Documents Only</option>
                  <option value="read_only">Read Only Documents</option>
                  <option value="private">Private (No Documents Shared)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium shadow"
                >
                  Share Lead Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {historyModalLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">Lead Audit Trail</h2>
              <button onClick={() => setHistoryModalLead(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              {historyModalLead.activity_history?.map((h: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="uppercase text-red-700">{h.action}</span>
                    <span className="text-slate-400 font-normal">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-600">{h.notes || "No notes recorded"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Update Stage Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Update Shared Lead Stage</h2>
            <p className="text-xs text-slate-500 mb-4">Lead: <span className="font-semibold text-slate-700">{selectedLead.lead_id?.lead_name}</span></p>

            <form onSubmit={handleUpdateStage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Stage Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold text-slate-800 bg-emerald-50/50"
                >
                  <option value="Fulfilled">Fulfilled / Completed (Evaluates Bilateral SLA & Settlement)</option>
                  <option value="Converted">Converted</option>
                  <option value="Won">Won</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Contacted">Contacted / In Progress</option>
                  <option value="Lost">Lost / Closed</option>
                </select>
                <p className="text-[11px] text-amber-700 mt-1">
                  Note: A financial settlement is generated ONLY when the stage matches the active agreement&apos;s contractual success criteria.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Update Summary / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes on fulfillment or client progress..."
                  value={summaryNote}
                  onChange={(e) => setSummaryNote(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium shadow"
                >
                  Save Stage Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

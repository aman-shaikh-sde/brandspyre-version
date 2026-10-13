import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import PageHeader from "src/component/ui/PageHeader";

export default function TenantRelationships() {
  const [relationships, setRelationships] = useState<any[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    target_tenant_code: "",
    relationship_type: "child",
    custom_type_label: "",
    notes: ""
  });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/lead-exchange/relationships');
      if (res.data.success) {
        setRelationships(res.data.data);
        if (res.data.current_tenant_id) {
          setCurrentTenantId(res.data.current_tenant_id.toString());
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOrganizations = async () => {
    try {
      const res = await apiClient.get('/lead-exchange/available-organizations');
      if (res.data.success) {
        setAvailableOrgs(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch available orgs:", err);
    }
  };

  useEffect(() => {
    fetchRelationships();
    fetchAvailableOrganizations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/lead-exchange/relationships', formData);
      if (res.data.success) {
        setMessage({ text: res.data.message || "Relationship request sent! Awaiting target organization acceptance.", type: "success" });
        setShowModal(false);
        setFormData({ target_tenant_code: "", relationship_type: "child", custom_type_label: "", notes: "" });
        fetchRelationships();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to send relationship request", type: "error" });
    }
  };

  const handleAcceptRequest = async (relId: string) => {
    try {
      const res = await apiClient.patch(`/lead-exchange/relationships/${relId}/status`, { status: "active" });
      if (res.data.success) {
        setMessage({ text: "Relationship accepted! Child company leads are now automatically shared with Parent Company.", type: "success" });
        fetchRelationships();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to accept relationship request", type: "error" });
    }
  };

  // Helper to determine if current session user is the TARGET (Receiver of the invitation)
  const isTargetOrg = (r: any) => {
    const targetId = (r.target_tenant_id?._id || r.target_tenant_id || "").toString();

    // 1. Compare against API current_tenant_id
    if (currentTenantId && targetId) {
      return currentTenantId.toString() === targetId.toString();
    }

    // 2. Compare against central auth store tenantId
    const storeTenantId = (useAuthStore.getState().tenantId || "").toString();
    if (storeTenantId && targetId) {
      return storeTenantId.toString() === targetId.toString();
    }

    return false;
  };

  const filteredOrgs = availableOrgs.filter((org) => {
    const query = searchTerm.toLowerCase();
    return (
      (org.company_name && org.company_name.toLowerCase().includes(query)) ||
      (org.tenant_code && org.tenant_code.toLowerCase().includes(query)) ||
      (org.subdomain && org.subdomain.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Organization Relationships"
        description="Establish parent-child, franchise, or partner tenant links to share leads and automate commercial workflows."
        primaryAction={{
          label: "Send Relationship Request",
          onClick: () => {
            setShowModal(true);
            fetchAvailableOrganizations();
          },
        }}
      />

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
              <th className="p-4">Initiator (Parent / Sender)</th>
              <th className="p-4">Target (Child / Receiver)</th>
              <th className="p-4">Relationship Type</th>
              <th className="p-4">Approval Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">Loading relationships...</td>
              </tr>
            ) : relationships.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No cross-organization relationships requested yet.</td>
              </tr>
            ) : (
              relationships.map((r) => {
                const targetIsMe = isTargetOrg(r);
                const targetName = r.target_tenant_id?.company_name || "Target Org";

                return (
                  <tr key={r._id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-800">{r.initiator_tenant_id?.company_name || "Unknown Org"}</td>
                    <td className="p-4 font-medium text-slate-800">{r.target_tenant_id?.company_name || "Unknown Org"}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded border border-blue-200 text-xs uppercase">
                        {r.relationship_type === "custom" ? r.custom_type_label || "Custom" : r.relationship_type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${r.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {r.status === "active" ? "✓ ACTIVE (LEADS SHARED)" : "⏳ PENDING APPROVAL"}
                      </span>
                    </td>
                    <td className="p-4">
                      {r.status === "active" ? (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          ✓ Connected & Active
                        </span>
                      ) : targetIsMe ? (
                        <button
                          onClick={() => handleAcceptRequest(r._id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow transition flex items-center gap-1"
                        >
                          ✓ Accept Request & Share Leads
                        </button>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold italic flex items-center gap-1">
                          ⏳ Sent (Awaiting {targetName} Acceptance)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Send Relationship Request</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Target Child / Partner Organization</label>
                
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="🔍 Search organization name, code, or subdomain..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm pl-3 focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-50"
                  />
                </div>

                <select
                  required
                  value={formData.target_tenant_code}
                  onChange={(e) => setFormData({ ...formData, target_tenant_code: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="">-- Choose Target Organization --</option>
                  {filteredOrgs.map((org) => (
                    <option key={org._id} value={org.tenant_code || org.subdomain || org._id}>
                      {org.company_name} ({org.tenant_code || org.subdomain || "ID: " + org._id.slice(-6)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Relationship Type</label>
                <select
                  value={formData.relationship_type}
                  onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="child">Child Subsidiary</option>
                  <option value="parent">Parent Company</option>
                  <option value="partner">Business Partner</option>
                  <option value="franchise">Franchise</option>
                  <option value="vendor">Vendor / Supplier</option>
                  <option value="distributor">Distributor</option>
                  <option value="broker">Broker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notes / Terms</label>
                <textarea
                  rows={3}
                  placeholder="Optional partnership notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium shadow"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

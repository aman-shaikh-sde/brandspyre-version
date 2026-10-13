import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { Plus, GitCommit, ShieldCheck, Check, X, Layers } from "lucide-react";

export default function AgreementsList() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [versionModal, setVersionModal] = useState<any>(null);

  const [formData, setFormData] = useState({
    client_code: "",
    agreement_name: "",
    billing_type: "per_lead",
    rate: 1000,
    currency: "INR",
    cgst_percentage: 9,
    sgst_percentage: 9,
    igst_percentage: 0,
    tds_percentage: 0,
    client_acceptance_required: false,
    approval_threshold_amount: 50000,
    billing_cycle: "instant",
    effective_from: new Date().toISOString().split("T")[0]
  });

  const [newRate, setNewRate] = useState(1500);

  useEffect(() => {
    fetchAgreements();
    fetchClients();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("billing/agreements");
      if (res.data.success) {
        setAgreements(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching agreements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await apiClient.get("client/overview/dropdown");
      if (res.data?.data) {
        const opts = res.data.data.map((c: any) => ({
          value: c.client_code,
          label: `${c.client_name || c.client_code} (${c.client_code})`
        }));
        setClientOptions(opts);
        if (opts.length > 0) {
          setFormData((prev) => ({ ...prev, client_code: opts[0].value }));
        }
      }
    } catch (err) {
      console.warn("Fetch clients warning:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        client_code: formData.client_code,
        agreement_name: formData.agreement_name,
        billing_type: formData.billing_type,
        rate: formData.rate,
        currency: formData.currency,
        tax_config: {
          cgst_percentage: formData.cgst_percentage,
          sgst_percentage: formData.sgst_percentage,
          igst_percentage: formData.igst_percentage,
          tds_percentage: formData.tds_percentage,
          is_reverse_charge: false,
          is_tax_exempt: false
        },
        client_acceptance_required: formData.client_acceptance_required,
        approval_threshold_amount: formData.approval_threshold_amount,
        billing_cycle: formData.billing_cycle,
        effective_from: formData.effective_from
      };

      const res = await apiClient.post("billing/agreements", payload);
      if (res.data.success) {
        setShowModal(false);
        fetchAgreements();
      }
    } catch (err) {
      console.error("Error creating agreement:", err);
    }
  };

  const handleCreateVersion = async () => {
    if (!versionModal) return;
    try {
      const res = await apiClient.post(`billing/agreements/${versionModal._id}/version`, {
        rate: newRate,
        effective_from: new Date().toISOString().split("T")[0]
      });
      if (res.data.success) {
        setVersionModal(null);
        fetchAgreements();
      }
    } catch (err) {
      console.error("Create version error:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Versioned Client Commercial Agreements</h1>
          <p className="text-xs text-slate-500 mt-1">Version-controlled commercial terms with effective date matching & multi-tax configuration.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create Agreement
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Agreement Code</th>
              <th className="p-4">Client</th>
              <th className="p-4 text-center">Version</th>
              <th className="p-4">Effective From</th>
              <th className="p-4">Billing Type</th>
              <th className="p-4 text-right">Commercial Rate</th>
              <th className="p-4 text-center">Taxes (GST)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={9} className="py-8 text-center text-slate-400">Loading commercial agreements...</td></tr>
            ) : agreements.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-slate-400">No active commercial agreements configured yet.</td></tr>
            ) : (
              agreements.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-semibold text-indigo-600">{item.agreement_code}</td>
                  <td className="p-4 font-medium text-slate-900">{item.client_code}</td>
                  <td className="p-4 text-center">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs">
                      v{item.version || 1}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 text-xs">
                    {new Date(item.effective_from || item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-xs uppercase">
                      {item.billing_type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    ₹{item.rate?.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{item.currency}</span>
                  </td>
                  <td className="p-4 text-center text-xs text-slate-600 font-medium">
                    CGST: {item.tax_config?.cgst_percentage || 9}% | SGST: {item.tax_config?.sgst_percentage || 9}%
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs capitalize ${
                      item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 'active' && (
                      <button
                        onClick={() => { setVersionModal(item); setNewRate(item.rate * 1.1); }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto"
                      >
                        <GitCommit className="w-3.5 h-3.5" /> New Version
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Agreement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Create Client Commercial Agreement</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Code</label>
                  {clientOptions.length > 0 ? (
                    <select
                      value={formData.client_code}
                      onChange={(e) => setFormData({ ...formData, client_code: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      {clientOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABC_BUILDERS"
                      value={formData.client_code}
                      onChange={(e) => setFormData({ ...formData, client_code: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agreement Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meta Ads Lead Commercial Agreement"
                    value={formData.agreement_name}
                    onChange={(e) => setFormData({ ...formData, agreement_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Type</label>
                  <select
                    value={formData.billing_type}
                    onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="per_lead">Per Successful Lead</option>
                    <option value="per_qualified_lead">Per Qualified Lead</option>
                    <option value="per_site_visit">Per Site Visit</option>
                    <option value="per_booking">Per Booking</option>
                    <option value="monthly_retainer">Monthly Retainer</option>
                    <option value="retainer_plus_success">Retainer + Success Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Commercial Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CGST %</label>
                  <input
                    type="number"
                    value={formData.cgst_percentage}
                    onChange={(e) => setFormData({ ...formData, cgst_percentage: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SGST %</label>
                  <input
                    type="number"
                    value={formData.sgst_percentage}
                    onChange={(e) => setFormData({ ...formData, sgst_percentage: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Threshold (₹)</label>
                  <input
                    type="number"
                    value={formData.approval_threshold_amount}
                    onChange={(e) => setFormData({ ...formData, approval_threshold_amount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md">Save Agreement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Creation Modal */}
      {versionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Create New Agreement Version</h3>
            <p className="text-xs text-slate-500">
              Supersedes Version {versionModal.version} for {versionModal.client_code}. Previous lead conversions will maintain historical Version {versionModal.version} rates.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Commercial Rate (₹)</label>
              <input
                type="number"
                required
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setVersionModal(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={handleCreateVersion} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md">
                Publish Version {versionModal.version + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

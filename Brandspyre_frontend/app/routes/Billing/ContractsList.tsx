import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { Plus, FileText, Calendar, ShieldCheck, User, Paperclip, X } from "lucide-react";

import { BASE_URL } from "~/constants/api";

export default function ContractsList() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    contract_number: `CNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    client_code: "",
    title: "",
    effective_date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    attachment_url: ""
  });

  useEffect(() => {
    fetchContracts();
    fetchClients();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("billing/contracts");
      if (res.data.success) {
        setContracts(res.data.data);
      }
    } catch (err) {
      console.error("Fetch contracts error:", err);
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
      const res = await apiClient.post("billing/contracts", formData);
      if (res.data.success) {
        setShowModal(false);
        fetchContracts();
      }
    } catch (err) {
      console.error("Create contract error:", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Master Contracts</h1>
          <p className="text-xs text-slate-500 mt-1">Manage master SLA legal contracts governing commercial lead billing terms.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create Contract
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="p-4">Contract #</th>
              <th className="p-4">Client</th>
              <th className="p-4">Title</th>
              <th className="p-4">Effective Date</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading contracts...</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No master contracts created yet.</td></tr>
            ) : (
              contracts.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/60">
                  <td className="p-4 font-semibold text-indigo-600">{c.contract_number}</td>
                  <td className="p-4 font-medium text-slate-900">{c.client_code}</td>
                  <td className="p-4 text-slate-800">{c.title}</td>
                  <td className="p-4 text-slate-600">{new Date(c.effective_date).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-600">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "Indefinite"}</td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full text-xs capitalize">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">Create Client Master Contract</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNT-2026-001"
                  value={formData.contract_number}
                  onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meta Lead Generation Master Agreement"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md">Save Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

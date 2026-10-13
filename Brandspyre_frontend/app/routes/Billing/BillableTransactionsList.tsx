import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  AlertTriangle, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  ShieldCheck 
} from "lucide-react";

export default function BillableTransactionsList() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clientCodeFilter, setClientCodeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [reversalModal, setReversalModal] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState("");

  const [disputeModal, setDisputeModal] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [clientCodeFilter, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = "billing/transactions?";
      if (clientCodeFilter) url += `client_code=${clientCodeFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await apiClient.get(url);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTierApprove = async (id: string, tierLevel: number) => {
    try {
      const res = await apiClient.post(`billing/transactions/${id}/tier-approve`, { tier_level: tierLevel });
      if (res.data.success) {
        fetchTransactions();
      }
    } catch (err) {
      console.error("Tier approve error:", err);
    }
  };

  const handleReverseSubmit = async () => {
    if (!reversalModal) return;
    try {
      const res = await apiClient.post(`billing/transactions/${reversalModal._id}/reverse`, {
        reversal_reason: reversalReason
      });
      if (res.data.success) {
        alert(`Transaction reversed! Credit Note ${res.data.credit_note_no} issued.`);
        setReversalModal(null);
        setReversalReason("");
        fetchTransactions();
      }
    } catch (err) {
      console.error("Reversal error:", err);
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeModal) return;
    try {
      const res = await apiClient.post("billing/disputes", {
        transaction_id: disputeModal._id,
        dispute_reason: disputeReason
      });
      if (res.data.success) {
        alert("Dispute submitted successfully!");
        setDisputeModal(null);
        setDisputeReason("");
        fetchTransactions();
      }
    } catch (err) {
      console.error("Dispute error:", err);
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedIds.length === 0) return;
    const firstTxn = transactions.find((t) => selectedIds.includes(t._id));
    if (!firstTxn) return;

    try {
      const res = await apiClient.post("billing/generate-invoice", {
        client_code: firstTxn.client_code,
        transaction_ids: selectedIds
      });
      if (res.data.success) {
        alert(`Invoice ${res.data.data.invoice_no} generated successfully!`);
        setSelectedIds([]);
        fetchTransactions();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to generate invoice");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((t) => t._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Idempotent Billable Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Multi-tier approval chains, reversal Credit Notes, and duplicate billing locks.</p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleGenerateInvoice}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Generate Invoice ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by Client Code..."
            value={clientCodeFilter}
            onChange={(e) => setClientCodeFilter(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs w-44"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="invoiced">Invoiced</option>
            <option value="reversed">Reversed / Credit Note</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={transactions.length > 0 && selectedIds.length === transactions.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4">Txn Code</th>
                <th className="p-4">Client</th>
                <th className="p-4">Lead Info</th>
                <th className="p-4 text-center">Version</th>
                <th className="p-4 text-right">Base Rate</th>
                <th className="p-4 text-right">Total (+Taxes)</th>
                <th className="p-4 text-center">Approval Chain</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="py-8 text-center text-slate-400">Loading ledger...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-slate-400">No billable transactions found.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t._id)}
                        onChange={() => toggleSelectOne(t._id)}
                      />
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{t.transaction_code}</td>
                    <td className="p-4 font-medium text-indigo-600">{t.client_code}</td>
                    <td className="p-4 text-slate-800 font-medium">
                      {t.lead_id?.lead_name || "Lead #" + t.lead_id?._id}
                      <p className="text-xs text-slate-400 font-normal">{t.lead_id?.phone || t.lead_id?.email}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs">
                        v{t.agreement_version || 1}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-700">₹{t.calculated_amount?.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-slate-900">₹{t.total_amount?.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        {t.approval_chain && t.approval_chain.length > 0 ? (
                          t.approval_chain.map((tier: any, idx: number) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                tier.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              T{tier.tier_level}: {tier.role}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Direct</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        t.status === 'pending_approval' ? 'bg-amber-50 text-amber-700' :
                        t.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        t.status === 'invoiced' ? 'bg-indigo-50 text-indigo-700' :
                        t.status === 'reversed' ? 'bg-purple-100 text-purple-800' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {t.credit_note_no ? `Reversed (${t.credit_note_no})` : t.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {t.status === "pending_approval" && (
                          <button
                            onClick={() => handleTierApprove(t._id, 1)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Approve Tier 1"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {t.status !== "reversed" && (
                          <button
                            onClick={() => setReversalModal(t)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Rollback / Issue Credit Note"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {t.status !== "disputed" && (
                          <button
                            onClick={() => setDisputeModal(t)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Raise Dispute"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reversal Modal */}
      {reversalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Reverse Transaction #{reversalModal.transaction_code}</h3>
            <p className="text-xs text-slate-500">Generates a Credit Note and posts reversing entries to the accounting journal.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reversal Rationale / Reason</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Lead rejected by client after invoice issuance..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReversalModal(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button onClick={handleReverseSubmit} className="bg-purple-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md">
                Reverse & Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Raise Dispute for #{disputeModal.transaction_code}</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Reason</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Client stated lead phone number was invalid..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDisputeModal(null)} className="px-3 py-1.5 text-xs text-slate-600">Cancel</button>
              <button onClick={handleDisputeSubmit} className="bg-amber-600 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-md">
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

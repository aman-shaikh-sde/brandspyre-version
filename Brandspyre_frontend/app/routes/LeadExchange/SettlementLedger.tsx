import React, { useState, useEffect } from "react";
import PageHeader from "src/component/ui/PageHeader";
import apiClient from "src/services/apiClient";
import MarketplacePaymentModal from "../../components/payments/MarketplacePaymentModal";

export default function SettlementLedger() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<any[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAgrModal, setShowAgrModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputingTxn, setDisputingTxn] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [paymentModalData, setPaymentModalData] = useState<any>(null);

  const [agrForm, setAgrForm] = useState({
    receiver_tenant_id: "",
    billing_model: "per_lead",
    rate: 5000,
    commission_rate_override: 10,
    success_stages: "Fulfilled, Completed"
  });
  const [selectedTxns, setSelectedTxns] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load Razorpay Checkout Script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [txnsRes, agrsRes, orgsRes] = await Promise.all([
        apiClient.get("/lead-exchange/transactions"),
        apiClient.get("/lead-exchange/agreements"),
        apiClient.get("/lead-exchange/available-organizations"),
      ]);

      if (txnsRes.data?.success) {
        setTransactions(txnsRes.data.data || []);
        if (txnsRes.data.current_tenant_id) {
          setCurrentTenantId(txnsRes.data.current_tenant_id.toString());
        }
      }
      if (agrsRes.data?.success) setAgreements(agrsRes.data.data || []);
      if (orgsRes.data?.success) setAvailableOrgs(orgsRes.data.data || []);
    } catch (err: any) {
      console.error("Failed to load settlement ledger data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const stages = agrForm.success_stages.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = {
        ...agrForm,
        success_stages: stages,
        success_criteria: {
          successful_stages: stages
        }
      };
      const res = await apiClient.post("/lead-exchange/agreements", payload);
      if (res.data?.success) {
        setMessage({ text: "B2B Settlement Agreement created successfully!", type: "success" });
        setShowAgrModal(false);
        fetchData();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to create agreement", type: "error" });
    }
  };

  const toggleSelectTxn = (id: string) => {
    if (selectedTxns.includes(id)) {
      setSelectedTxns(selectedTxns.filter((t) => t !== id));
    } else {
      setSelectedTxns([...selectedTxns, id]);
    }
  };

  const handleGenerateInvoice = async () => {
    if (selectedTxns.length === 0) return;
    try {
      const res = await apiClient.post("/lead-exchange/generate-invoice", {
        transaction_ids: selectedTxns
      });
      if (res.data?.success) {
        setMessage({ text: `Invoice ${res.data.data.invoice_number} generated successfully for selected transactions!`, type: "success" });
        setSelectedTxns([]);
        fetchData();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to generate invoice", type: "error" });
    }
  };

  const handleOpenPayment = (txn: any) => {
    setPaymentModalData({
      invoiceId: txn.invoice_id?._id || txn.invoice_id,
      transactionId: txn._id,
      paymentRequestId: txn.invoice_id?.payment_request_id?._id || txn.invoice_id?.payment_request_id,
      invoiceNumber: txn.invoice_id?.invoice_number || txn.transaction_code,
      title: `Settlement for Lead ${txn.lead_id?.lead_name || txn.transaction_code}`,
      totalAmount: txn.total_amount || 0,
      platformFee: txn.platform_commission || 0,
      platformTax: txn.platform_commission_tax || 0,
      receiverAmount: txn.receiver_net_amount || 0,
      receiverName: txn.provider_tenant_id?.company_name || txn.provider_tenant_id?.name || "Provider Org",
      currency: txn.currency || 'INR'
    });
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingTxn || !disputeReason) return;
    try {
      const res = await apiClient.post(`/lead-exchange/dispute/${disputingTxn._id}`, {
        reason: disputeReason
      });
      if (res.data?.success) {
        setMessage({ text: `Transaction ${disputingTxn.transaction_code} marked as disputed.`, type: "success" });
        setShowDisputeModal(false);
        setDisputingTxn(null);
        setDisputeReason("");
        fetchData();
      }
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || "Failed to dispute transaction", type: "error" });
    }
  };

  const isReceiverPayer = (t: any) => {
    const recId = (t.receiver_tenant_id?._id || t.receiver_tenant_id || "").toString();
    return Boolean(currentTenantId && recId && currentTenantId === recId);
  };

  const isProviderSeller = (t: any) => {
    const provId = (t.provider_tenant_id?._id || t.provider_tenant_id || "").toString();
    return Boolean(currentTenantId && provId && currentTenantId === provId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <PageHeader
        title="Commercial Settlement Platform"
        description="B2B contractual agreements, verified lead fulfillment obligations, Brandspyre marketplace commissions, and Razorpay settlements."
        primaryAction={{
          label: "Create B2B Agreement",
          onClick: () => setShowAgrModal(true),
        }}
        secondaryActions={
          selectedTxns.length > 0
            ? [{ label: `Generate Invoice (${selectedTxns.length})`, onClick: handleGenerateInvoice }]
            : []
        }
      />

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
          {message.text}
        </div>
      )}

      {/* Active B2B Settlement Agreements */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Active Commercial SLA Agreements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agreements.length === 0 ? (
            <div className="col-span-full p-6 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              No commercial agreements established yet. Click &quot;Create B2B Agreement&quot; to define rates and success criteria.
            </div>
          ) : (
            agreements.map((a) => (
              <div key={a._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{a.agreement_code}</span>
                  <span className="text-xs font-semibold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{a.status}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Provider: {a.provider_tenant_id?.company_name || a.provider_tenant_id?.name || "Provider Org"}
                  </div>
                  <div className="text-xs text-slate-500">
                    Receiver (Buyer): {a.receiver_tenant_id?.company_name || a.receiver_tenant_id?.name || "Receiver Org"}
                  </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-sm">
                  <span className="text-slate-500 text-xs uppercase font-medium">{a.billing_model}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">₹{a.rate?.toLocaleString()} (+18% GST)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Commission: {a.commission_rate_override ? `${a.commission_rate_override}%` : "Platform Standard (10%)"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* B2B Settlement Transactions Ledger */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">B2B Settlement Transactions Ledger</h2>
          <span className="text-xs text-slate-500">Only fulfilled leads adhering to SLA agreements are billable</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-3.5 w-10">Select</th>
                <th className="p-3.5">TXN Code</th>
                <th className="p-3.5">Provider (Seller)</th>
                <th className="p-3.5">Receiver (Buyer)</th>
                <th className="p-3.5">Lead</th>
                <th className="p-3.5">Gross (+GST)</th>
                <th className="p-3.5">Brandspyre Fee</th>
                <th className="p-3.5">Receiver Net</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Loading ledger transactions...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">No B2B settlement transactions recorded yet.</td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isPayer = isReceiverPayer(t);
                  const isSeller = isProviderSeller(t);
                  const isPaid = t.status === "paid" || t.status === "settled";
                  const isInvoiced = t.status === "invoiced" || t.status === "payment_pending";

                  return (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        {t.status === "unbilled" && isSeller && (
                          <input
                            type="checkbox"
                            checked={selectedTxns.includes(t._id)}
                            onChange={() => toggleSelectTxn(t._id)}
                            className="rounded border-slate-300 text-red-700 focus:ring-red-500"
                          />
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-xs font-semibold text-slate-700">{t.transaction_code}</td>
                      <td className="p-3.5 font-medium text-slate-800 text-xs">{t.provider_tenant_id?.company_name || t.provider_tenant_id?.name || "-"}</td>
                      <td className="p-3.5 font-medium text-slate-800 text-xs">{t.receiver_tenant_id?.company_name || t.receiver_tenant_id?.name || "-"}</td>
                      <td className="p-3.5 font-semibold text-slate-900 text-xs">{t.lead_id?.lead_name || "Lead"}</td>
                      <td className="p-3.5 font-bold text-slate-900 text-xs">₹{t.total_amount?.toLocaleString()}</td>
                      <td className="p-3.5 font-medium text-amber-700 text-xs">₹{(t.platform_commission || 0).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-emerald-700 text-xs">₹{(t.receiver_net_amount || t.total_amount).toLocaleString()}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isPaid ? "bg-emerald-100 text-emerald-800" : 
                          isInvoiced ? "bg-blue-100 text-blue-800" : 
                          t.status === "disputed" ? "bg-rose-100 text-rose-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isPaid ? (
                          <span className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1">
                            ✓ Settled
                          </span>
                        ) : isPayer && isInvoiced ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenPayment(t)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition"
                            >
                              💳 Pay Settlement
                            </button>
                            <button
                              onClick={() => {
                                setDisputingTxn(t);
                                setShowDisputeModal(true);
                              }}
                              className="text-slate-400 hover:text-rose-600 text-xs font-medium"
                              title="Dispute transaction"
                            >
                              Dispute
                            </button>
                          </div>
                        ) : isPayer && t.status === "unbilled" ? (
                          <span className="text-[11px] text-amber-600 font-medium italic">
                            ⏳ Awaiting Provider Invoice
                          </span>
                        ) : isSeller && t.status === "unbilled" ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            Select to Invoice
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            ⏳ Awaiting Buyer Payment
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
      </div>

      {/* Create Agreement Modal */}
      {showAgrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Create Commercial Settlement Agreement</h2>
            <form onSubmit={handleCreateAgreement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Receiver Organization (Lead Consumer)</label>
                <select
                  required
                  value={agrForm.receiver_tenant_id}
                  onChange={(e) => setAgrForm({ ...agrForm, receiver_tenant_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                >
                  <option value="">
                    {availableOrgs.length === 0 
                      ? "-- No other registered organizations found --" 
                      : "-- Choose Target Organization --"}
                  </option>
                  {availableOrgs.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.company_name || o.name || "Organization"} {o.tenant_code ? `(${o.tenant_code})` : o.subdomain ? `(${o.subdomain})` : ""}
                    </option>
                  ))}
                </select>
                {availableOrgs.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Tip: Create another organization or invite partners from Organization settings.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Billing Model</label>
                <select
                  value={agrForm.billing_model}
                  onChange={(e) => setAgrForm({ ...agrForm, billing_model: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                >
                  <option value="per_lead">Per Fulfilled Lead (Fixed Commercial Rate)</option>
                  <option value="per_qualified">Per Qualified Lead</option>
                  <option value="rev_share">Revenue Share (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contractual Success Stages (Comma-separated)</label>
                <input
                  type="text"
                  required
                  value={agrForm.success_stages}
                  onChange={(e) => setAgrForm({ ...agrForm, success_stages: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  placeholder="e.g. Fulfilled, Completed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Settlements are created ONLY when a shared lead reaches one of these exact stages.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Commercial Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={agrForm.rate}
                    onChange={(e) => setAgrForm({ ...agrForm, rate: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Commission Override (%)</label>
                  <input
                    type="number"
                    value={agrForm.commission_rate_override}
                    onChange={(e) => setAgrForm({ ...agrForm, commission_rate_override: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    placeholder="10% standard"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAgrModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-medium shadow"
                >
                  Save Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && disputingTxn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Dispute Settlement Transaction</h2>
            <p className="text-xs text-slate-500 mb-4">
              Disputing {disputingTxn.transaction_code} for {disputingTxn.lead_id?.lead_name || 'Lead'}. Funds will remain on hold pending review.
            </p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reason for Dispute</label>
                <textarea
                  required
                  rows={3}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe why this lead fulfillment does not meet SLA criteria..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputingTxn(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Marketplace Payment Modal */}
      {paymentModalData && (
        <MarketplacePaymentModal
          isOpen={!!paymentModalData}
          onClose={() => setPaymentModalData(null)}
          onSuccess={() => {
            setPaymentModalData(null);
            fetchData();
          }}
          {...paymentModalData}
        />
      )}
    </div>
  );
}

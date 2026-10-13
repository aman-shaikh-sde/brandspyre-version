import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRightLeft, 
  Clock, 
  Eye, 
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2
} from "lucide-react";
import { notify } from "~/services/notificationService";
import { organizationPaymentApi } from "src/services/organizationPaymentService";
import PaymentReceiptModal from "./PaymentReceiptModal";

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function AdminReconciliation() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [transferFilter, setTransferFilter] = useState("all");
  const [refundFilter, setRefundFilter] = useState("all");
  const [adjustmentFilter, setAdjustmentFilter] = useState("all");
  const [reconRequiredOnly, setReconRequiredOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Adjustment Modal
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [newAdjustmentStatus, setNewAdjustmentStatus] = useState<string>("UNDER_REVIEW");
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const res = await organizationPaymentApi.getAdminReconciliations({
        status: statusFilter !== "all" ? statusFilter : undefined,
        transfer_status: transferFilter !== "all" ? transferFilter : undefined,
        refund_status: refundFilter !== "all" ? refundFilter : undefined,
        adjustment_status: adjustmentFilter !== "all" ? adjustmentFilter : undefined,
        reconciliation_required: reconRequiredOnly ? true : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        limit: 25
      });
      setPayments(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      notify.error("Failed to load reconciliation transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [statusFilter, transferFilter, refundFilter, adjustmentFilter, reconRequiredOnly, page]);

  const handleUpdateAdjustment = async () => {
    if (!selectedPayment) return;
    setUpdatingStatus(true);
    try {
      await organizationPaymentApi.updateAdjustmentStatus(selectedPayment._id, {
        status: newAdjustmentStatus,
        notes: adjustmentNotes
      });
      notify.success("Adjustment status updated successfully.");
      setSelectedPayment(null);
      setAdjustmentNotes("");
      fetchReconciliations();
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Failed to update adjustment status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filtered = payments.filter(p => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      p.transaction_code?.toLowerCase().includes(s) ||
      p.receipt_number?.toLowerCase().includes(s) ||
      p.provider_payment_id?.toLowerCase().includes(s) ||
      p.provider_transfer_id?.toLowerCase().includes(s) ||
      (p.receiver_tenant_id?.company_name || p.receiver_tenant_id?.name || "")?.toLowerCase().includes(s) ||
      (p.payer_tenant_id?.company_name || p.payer_tenant_id?.name || "")?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                Financial Operations
              </span>
              <span className="text-xs text-slate-400">Direct Route Settlements</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Marketplace Reconciliation & SLA Discrepancies</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Audit real-time lead payment flows, monitor Razorpay Route transfers, track post-transfer refund adjustments, and resolve discrepancies across bilateral settlements.
            </p>
          </div>
          <button
            onClick={fetchReconciliations}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Ledger
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Payment ID, Transfer ID, Receipt, or Organization..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 shadow-2xs"
            />
          </div>

          <button
            onClick={() => setReconRequiredOnly(!reconRequiredOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition border ${
              reconRequiredOnly
                ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300"
                : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            <AlertTriangle size={14} /> Reconciliation Required Only
          </button>
        </div>

        {/* Multi-Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Payments</option>
              <option value="CAPTURED">Captured</option>
              <option value="SETTLED">Settled</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
              <option value="RECONCILIATION_REQUIRED">Reconciliation Required</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transfer Status</label>
            <select
              value={transferFilter}
              onChange={e => setTransferFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Transfers</option>
              <option value="SETTLED">Transfer Settled</option>
              <option value="PENDING">Transfer Pending</option>
              <option value="TRANSFER_FAILED">Transfer Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Adjustment Status</label>
            <select
              value={adjustmentFilter}
              onChange={e => setAdjustmentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Adjustments</option>
              <option value="NOT_REQUIRED">Not Required</option>
              <option value="PENDING_RECONCILIATION">Pending Reconciliation</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ADJUSTMENT_REQUESTED">Adjustment Requested</option>
              <option value="ADJUSTMENT_RECEIVED">Adjustment Received</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Refund Status</label>
            <select
              value={refundFilter}
              onChange={e => setRefundFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Refunds</option>
              <option value="REFUNDED">Fully Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading reconciliation records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">No Reconciliation Issues Found</h4>
          <p className="text-xs text-slate-500">All direct payments and Route transfers are balanced with active bilateral ledgers.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Payment / Receipt</th>
                  <th className="px-3.5 py-3">Parties & Leads</th>
                  <th className="px-3.5 py-3 text-right">Gross Amount</th>
                  <th className="px-3.5 py-3 text-right">Commission & Tax</th>
                  <th className="px-3.5 py-3 text-right">Receiver Amount</th>
                  <th className="px-3.5 py-3 text-center">Payment Status</th>
                  <th className="px-3.5 py-3 text-center">Transfer Status</th>
                  <th className="px-3.5 py-3 text-center">Adjustment Status</th>
                  <th className="px-3.5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((payment) => {
                  const req = payment.payment_request_id;
                  const payeeName = payment.receiver_tenant_id?.company_name || payment.receiver_tenant_id?.name || "Provider";
                  const payerName = payment.payer_tenant_id?.company_name || payment.payer_tenant_id?.name || req?.payer_name || "Buyer";
                  const leads = payment.leads || [];

                  // Transfer status styling
                  let transferBadge = { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", label: "Pending" };
                  if (payment.status === "SETTLED") {
                    transferBadge = { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", label: "Processed" };
                  } else if (payment.status === "TRANSFER_FAILED") {
                    transferBadge = { bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300", label: "Failed" };
                  } else if (payment.status === "RECONCILIATION_REQUIRED") {
                    transferBadge = { bg: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300", label: "Mismatch" };
                  }

                  // Adjustment status styling
                  let adjBadge = { bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", label: "Not Required" };
                  if (payment.receiver_adjustment_status === "PENDING_RECONCILIATION") {
                    adjBadge = { bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", label: "Pending Recon" };
                  } else if (payment.receiver_adjustment_status === "UNDER_REVIEW") {
                    adjBadge = { bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300", label: "Under Review" };
                  } else if (payment.receiver_adjustment_status === "ADJUSTMENT_REQUESTED") {
                    adjBadge = { bg: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300", label: "Adjustment Req." };
                  } else if (payment.receiver_adjustment_status === "ADJUSTMENT_RECEIVED" || payment.receiver_adjustment_status === "COMPLETED") {
                    adjBadge = { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", label: "Completed" };
                  }

                  return (
                    <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {payment.transaction_code}
                        <div className="text-[10px] text-slate-400 font-normal">{payment.receipt_number}</div>
                        {payment.provider_payment_id && (
                          <div className="text-[9px] text-indigo-500 font-mono">{payment.provider_payment_id}</div>
                        )}
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {payeeName} <span className="text-[10px] text-slate-400 font-normal">(Payee)</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {payerName} <span className="text-[10px] text-slate-400 font-normal">(Payer)</span>
                        </div>
                        {leads.length > 0 && (
                          <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
                            Leads: {leads.join(", ")}
                          </div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {fmt(payment.amount)}
                        {payment.refunded_amount > 0 && (
                          <div className="text-[10px] text-rose-500 font-medium">Refunded: {fmt(payment.refunded_amount)}</div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {fmt(payment.platform_fee)}
                        <div className="text-[10px] text-slate-400">Tax: {fmt(payment.tax_on_platform_fee)}</div>
                      </td>

                      <td className="px-3.5 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(payment.receiver_amount)}
                        {payment.receiver_adjustment_required && (
                          <div className="text-[10px] text-amber-600 font-medium">
                            Adj: {fmt(payment.receiver_adjustment_amount)}
                          </div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {payment.status}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${transferBadge.bg}`}>
                          {transferBadge.label}
                        </span>
                        {payment.provider_transfer_id && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{payment.provider_transfer_id}</div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${adjBadge.bg}`}>
                          {adjBadge.label}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setReceiptPaymentId(payment._id)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="View Official Receipt"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setNewAdjustmentStatus(payment.receiver_adjustment_status || "UNDER_REVIEW");
                            }}
                            className="p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold"
                            title="Reconciliation Action"
                          >
                            <SlidersHorizontal size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Action Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Marketplace Adjustment Action</h3>
                <p className="text-xs text-slate-500">Transaction: {selectedPayment.transaction_code}</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Gross:</span>
                <span className="font-bold">{fmt(selectedPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receiver Disbursed:</span>
                <span className="font-bold text-emerald-600">{fmt(selectedPayment.receiver_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refunded to Payer:</span>
                <span className="font-bold text-rose-500">{fmt(selectedPayment.refunded_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Outstanding Receiver Adjustment:</span>
                <span className="font-bold text-amber-600">{fmt(selectedPayment.receiver_adjustment_amount || 0)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Update Adjustment Status
                </label>
                <select
                  value={newAdjustmentStatus}
                  onChange={e => setNewAdjustmentStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                >
                  <option value="PENDING_RECONCILIATION">PENDING_RECONCILIATION</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ADJUSTMENT_REQUESTED">ADJUSTMENT_REQUESTED</option>
                  <option value="ADJUSTMENT_RECEIVED">ADJUSTMENT_RECEIVED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reconciliation Notes & Evidence
                </label>
                <textarea
                  rows={3}
                  value={adjustmentNotes}
                  onChange={e => setAdjustmentNotes(e.target.value)}
                  placeholder="Enter manual bank reference, reversal transfer ID, or operational explanation..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={updatingStatus}
                onClick={handleUpdateAdjustment}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm flex items-center gap-1.5"
              >
                {updatingStatus && <Loader2 size={12} className="animate-spin" />} Save Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <PaymentReceiptModal
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </div>
  );
}

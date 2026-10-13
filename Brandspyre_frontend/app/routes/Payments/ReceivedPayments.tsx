import { useState, useEffect } from "react";
import { Eye, RotateCcw, Loader2, Search, ArrowDownToLine } from "lucide-react";
import { notify } from "~/services/notificationService";
import { organizationPaymentApi } from "src/services/organizationPaymentService";
import PaymentReceiptModal from "./PaymentReceiptModal";

const statusBadges: Record<string, { bg: string; text: string }> = {
  CREATED: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", text: "CREATED" },
  AUTHORIZED: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", text: "AUTHORIZED" },
  CAPTURED: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", text: "CAPTURED" },
  SETTLED: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", text: "SETTLED" },
  FAILED: { bg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", text: "FAILED" },
  CANCELLED: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", text: "CANCELLED" },
  REFUNDED: { bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300", text: "REFUNDED" },
  PARTIALLY_REFUNDED: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", text: "PARTIAL REFUND" },
  DISPUTED: { bg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", text: "DISPUTED" }
};

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function ReceivedPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await organizationPaymentApi.getReceivedPayments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      setPayments(res.data?.data || []);
    } catch {
      notify.error("Failed to load received payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const handleRefund = async (paymentId: string) => {
    const reason = prompt("Reason for refund (optional):");
    if (reason === null) return;
    try {
      await organizationPaymentApi.refundPayment(paymentId, { reason });
      notify.success("Refund processed successfully.");
      fetchPayments();
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Refund failed.");
    }
  };

  const filtered = payments.filter(p => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      p.transaction_code?.toLowerCase().includes(s) ||
      p.receipt_number?.toLowerCase().includes(s) ||
      p.provider_payment_id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by transaction code, receipt..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 shadow-2xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 shadow-2xs"
          >
            <option value="all">All Status</option>
            <option value="CAPTURED">Captured</option>
            <option value="SETTLED">Settled</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading received payments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <ArrowDownToLine size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">No Payments Received Yet</h4>
          <p className="text-xs text-slate-500">Transactions will appear here when clients or partner organizations make payments.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Payer / Request</th>
                  <th className="px-4 py-3 text-right">Gross Amount</th>
                  <th className="px-4 py-3 text-right">Net Share</th>
                  <th className="px-4 py-3 text-right">Platform Fee</th>
                  <th className="px-4 py-3 text-center">Payment Status</th>
                  <th className="px-4 py-3 text-center">Receiver Settlement</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Receipt & Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((payment) => {
                  const badge = statusBadges[payment.status] || statusBadges.CREATED;
                  const req = payment.payment_request_id;
                  
                  // Settlement status distinction (Requirement 13 & 17)
                  let settlementBadge = { bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", text: "Pending Capture" };
                  if (payment.status === "SETTLED") {
                    settlementBadge = { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", text: "Transferred / Settled" };
                  } else if (payment.status === "CAPTURED") {
                    settlementBadge = { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", text: "Processing Transfer" };
                  } else if (payment.status === "TRANSFER_FAILED") {
                    settlementBadge = { bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300", text: "Transfer Failed" };
                  } else if (payment.status === "RECONCILIATION_REQUIRED") {
                    settlementBadge = { bg: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", text: "Reconciliation Req." };
                  } else if (payment.receiver_adjustment_required) {
                    settlementBadge = { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", text: `Adjustment (${payment.receiver_adjustment_status || 'Required'})` };
                  }

                  return (
                    <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {payment.transaction_code}
                        <div className="text-[10px] text-slate-400 font-normal">{payment.receipt_number}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{typeof req === "object" ? req?.payer_name : "Payer"}</div>
                        <div className="text-[11px] text-slate-400">{typeof req === "object" ? req?.title : ""}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{fmt(payment.amount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(payment.receiver_amount)}</td>
                      <td className="px-4 py-3 text-right text-slate-500 font-medium">{fmt(payment.platform_fee)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${settlementBadge.bg}`}>
                          {settlementBadge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {(payment.captured_at || payment.created_at) ? new Date(payment.captured_at || payment.created_at).toLocaleDateString() : "–"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setReceiptPaymentId(payment._id)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="View Official Receipt">
                            <Eye size={13} />
                          </button>
                          {(payment.status === "CAPTURED" || payment.status === "PARTIALLY_REFUNDED") && (
                            <button onClick={() => handleRefund(payment._id)} className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600" title="Issue Refund">
                              <RotateCcw size={13} />
                            </button>
                          )}
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

      <PaymentReceiptModal
        paymentId={receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
      />
    </div>
  );
}

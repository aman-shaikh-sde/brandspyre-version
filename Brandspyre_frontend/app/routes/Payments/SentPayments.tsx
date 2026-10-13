import { useState, useEffect } from "react";
import { Eye, Loader2, Search, ArrowUpFromLine } from "lucide-react";
import { notify } from "~/services/notificationService";
import { organizationPaymentApi } from "src/services/organizationPaymentService";
import PaymentReceiptModal from "./PaymentReceiptModal";

const statusBadges: Record<string, { bg: string; text: string }> = {
  CREATED: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", text: "CREATED" },
  AUTHORIZED: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", text: "AUTHORIZED" },
  CAPTURED: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", text: "CAPTURED" },
  SETTLED: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", text: "SETTLED" },
  FAILED: { bg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", text: "FAILED" },
  REFUNDED: { bg: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300", text: "REFUNDED" },
};

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function SentPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await organizationPaymentApi.getSentPayments();
        setPayments(res.data?.data || []);
      } catch {
        notify.error("Failed to load sent payments.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center py-16 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading sent payments...
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <ArrowUpFromLine size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">No Outbound Payments</h4>
          <p className="text-xs text-slate-500">Payments you make to other partner organizations will appear here.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Paid To</th>
                  <th className="px-4 py-3">Payment Request</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => {
                  const badge = statusBadges[p.status] || statusBadges.CREATED;
                  const receiver = p.receiver_tenant_id;
                  const req = p.payment_request_id;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{p.transaction_code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{typeof receiver === "object" ? (receiver?.company_name || receiver?.name) : "Organization"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{typeof req === "object" ? req?.title : "–"}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{fmt(p.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{(p.captured_at || p.created_at) ? new Date(p.captured_at || p.created_at).toLocaleDateString() : "–"}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setReceiptPaymentId(p._id)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="View Receipt">
                          <Eye size={13} />
                        </button>
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

import { useState, useEffect } from "react";
import Modal from "src/component/Modal";
import { Plus, Eye, XCircle, Copy, ExternalLink, Loader2, FileText, Search } from "lucide-react";
import { notify } from "~/services/notificationService";
import { organizationPaymentApi } from "src/services/organizationPaymentService";
import CreatePaymentRequestModal from "./CreatePaymentRequestModal";

const statusBadges: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", text: "DRAFT" },
  PENDING: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", text: "PENDING" },
  PARTIALLY_PAID: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", text: "PARTIAL" },
  PAID: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", text: "PAID" },
  CANCELLED: { bg: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", text: "CANCELLED" },
  EXPIRED: { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", text: "EXPIRED" }
};

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function PaymentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await organizationPaymentApi.getPaymentRequests({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      setRequests(res.data?.data || []);
    } catch {
      notify.error("Failed to load payment requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this payment request?")) return;
    try {
      await organizationPaymentApi.cancelPaymentRequest(id);
      notify.success("Payment request cancelled.");
      fetchRequests();
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Failed to cancel.");
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/pay/${token}`;
    navigator.clipboard.writeText(url);
    notify.success("Payment link copied to clipboard!");
  };

  const filtered = requests.filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      r.request_code?.toLowerCase().includes(s) ||
      r.payer_name?.toLowerCase().includes(s) ||
      r.title?.toLowerCase().includes(s) ||
      r.invoice_number?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, payer, title..."
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
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto">
          <Plus size={14} /> Create Payment Request
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <FileText size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">No Payment Requests Found</h4>
          <p className="text-xs text-slate-500 mb-4">Create a payment request to share a secure payment link with your payer.</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition inline-flex items-center gap-1.5 shadow-2xs">
            <Plus size={14} /> New Request
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Title / Subject</th>
                  <th className="px-4 py-3">Payer</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((req) => {
                  const badge = statusBadges[req.status] || statusBadges.DRAFT;
                  return (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{req.request_code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{req.title}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{req.payer_name}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{fmt(req.total_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{fmt(req.paid_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">{fmt(req.balance_due)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{req.due_date ? new Date(req.due_date).toLocaleDateString() : "–"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setShowDetail(req)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="View Details">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => copyLink(req.payment_link_token)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Copy Checkout Link">
                            <Copy size={13} />
                          </button>
                          {req.status !== "PAID" && req.status !== "CANCELLED" && (
                            <button onClick={() => handleCancel(req._id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Cancel Request">
                              <XCircle size={13} />
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

      {/* Create Modal */}
      <CreatePaymentRequestModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); fetchRequests(); }}
      />

      {/* Detail Modal */}
      <Modal isVisible={!!showDetail} onClose={() => setShowDetail(null)} title={`Payment Request: ${showDetail?.request_code || ""}`} maxWidth="2xl">
        {showDetail && (
          <div className="space-y-4 p-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-400 block">Title</span><span className="font-semibold text-slate-800 dark:text-slate-200">{showDetail.title}</span></div>
              <div><span className="text-slate-400 block">Payer</span><span className="font-semibold text-slate-800 dark:text-slate-200">{showDetail.payer_name}</span></div>
              <div><span className="text-slate-400 block">Email</span><span className="text-slate-800 dark:text-slate-200">{showDetail.payer_email}</span></div>
              <div><span className="text-slate-400 block">Total Amount</span><span className="font-bold text-sm text-slate-900 dark:text-slate-100">{fmt(showDetail.total_amount)}</span></div>
              <div><span className="text-slate-400 block">Paid Amount</span><span className="font-semibold text-emerald-600">{fmt(showDetail.paid_amount)}</span></div>
              <div><span className="text-slate-400 block">Remaining Balance</span><span className="font-semibold text-amber-600">{fmt(showDetail.balance_due)}</span></div>
              {showDetail.invoice_number && <div><span className="text-slate-400 block">Invoice Number</span><span className="font-mono">{showDetail.invoice_number}</span></div>}
              {showDetail.due_date && <div><span className="text-slate-400 block">Due Date</span><span>{new Date(showDetail.due_date).toLocaleDateString()}</span></div>}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5" onClick={() => copyLink(showDetail.payment_link_token)}>
                <Copy size={13} /> Copy Link
              </button>
              <a href={`/pay/${showDetail.payment_link_token}`} target="_blank" rel="noreferrer" className="px-3.5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5 shadow-2xs">
                <ExternalLink size={13} /> Open Checkout
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

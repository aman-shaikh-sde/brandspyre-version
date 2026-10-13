import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Filter,
  DollarSign,
  Calendar,
  AlertCircle,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";
import eventService from "~/services/eventService";

export default function OrganizerOrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, total_pages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Refund Modal State
  const [refundModalOrder, setRefundModalOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await eventService.getOrganizerOrders({
        page,
        limit: pagination.limit,
        status: statusFilter || undefined
      });
      if (res.success) {
        const orderList = res.data?.orders || res.orders || (Array.isArray(res.data) ? res.data : []);
        const pag = res.pagination || res.data?.pagination || {};
        setOrders(orderList);
        setPagination((prev) => ({
          ...prev,
          page: pag.page || prev.page,
          limit: pag.limit || prev.limit,
          total: pag.total ?? orderList.length,
          total_pages: pag.total_pages || pag.pages || 1
        }));
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    try {
      setRefundSubmitting(true);
      const res = await eventService.refundOrder(refundModalOrder._id, {
        reason: refundReason
      });
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Refund initiated successfully for order #${refundModalOrder.order_number}. Net balance adjusted.`
        });
        setRefundModalOrder(null);
        setRefundReason("");
        fetchOrders(pagination.page);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.response?.data?.message || "Failed to process refund."
      });
    } finally {
      setRefundSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ord.order_number?.toLowerCase().includes(q) ||
      ord.customer_name?.toLowerCase().includes(q) ||
      ord.customer_email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Orders & Bookings"
        description="Monitor attendee purchases, authoritative commission deductions, and process refunds."
        rightElement={
          <div className="flex items-center gap-3">
            <Link
              to="/event-management/settlements"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-2xs"
            >
              <DollarSign className="w-4 h-4 text-green-600" /> View Settlements
            </Link>
          </div>
        }
      />

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-gray-600 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order #, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending Payment</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">No Orders Found</h3>
            <p className="text-xs text-gray-400 mt-1">There are no orders matching your selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Gross Amount</th>
                  <th className="px-5 py-3.5">Platform Fee</th>
                  <th className="px-5 py-3.5">Net Payable</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord: any) => (
                  <tr key={ord._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-bold text-primary-600">{ord.order_number}</div>
                      <div className="text-2xs text-gray-400 mt-0.5">{ord.event_id?.title || "Event"}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">{ord.customer_name}</div>
                      <div className="text-xs text-gray-500">{ord.customer_email}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-900">
                      {ord.currency || 'INR'} {(ord.total_payable ?? ord.total_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-red-600 font-medium">
                      -{ord.currency || 'INR'} {(ord.commission_snapshot?.total_commission_deduction ?? ord.platform_commission_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-green-700">
                      {ord.currency || 'INR'} {(ord.net_organizer_payable ?? ord.organizer_payable_amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-2xs font-semibold px-2.5 py-1 rounded-full ${
                          ord.status === "PAID"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : ord.status === "REFUNDED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : ord.status === "PARTIALLY_REFUNDED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(ord.created_at || ord.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ord.status === "PAID" && (
                          <button
                            onClick={() => {
                              setRefundModalOrder(ord);
                              setRefundReason("");
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Process Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <span>
              Showing {orders.length} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchOrders(pagination.page + 1)}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono text-primary-600 font-bold">
                  ORDER #{selectedOrder.order_number}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">Booking Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-400 block">Customer Name</span>
                <span className="font-semibold text-gray-900">{selectedOrder.customer_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Email Address</span>
                <span className="font-semibold text-gray-900">{selectedOrder.customer_email}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Order Date</span>
                <span className="font-semibold text-gray-900">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Payment Method</span>
                <span className="font-semibold text-gray-900">{selectedOrder.payment_method || "RAZORPAY"}</span>
              </div>
            </div>

            {/* Line items */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="p-3 text-xs flex justify-between items-center bg-white">
                    <div>
                      <span className="font-semibold text-gray-900">{item.item_name}</span>
                      <span className="ml-2 text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                        {item.item_type} × {item.quantity}
                      </span>
                      {item.attendee_name && (
                        <div className="text-gray-500 text-2xs mt-0.5">Attendee: {item.attendee_name}</div>
                      )}
                    </div>
                    <span className="font-bold text-gray-900">
                      {selectedOrder.currency} {item.total_price?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Ledger Snapshot */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-2xs">Financial Calculation</h4>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (Tickets & Addons)</span>
                <span>
                  {selectedOrder.currency} {selectedOrder.subtotal?.toLocaleString()}
                </span>
              </div>
              {selectedOrder.tax_amount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Taxes ({selectedOrder.commission_snapshot?.tax_rate || 18}%)</span>
                  <span>
                    +{selectedOrder.currency} {selectedOrder.tax_amount?.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Gross Paid by Buyer</span>
                <span>
                  {selectedOrder.currency} {selectedOrder.total_amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-600 pt-1">
                <span>Platform Commission ({selectedOrder.commission_snapshot?.commission_rate || 5}%)</span>
                <span>
                  -{selectedOrder.currency} {selectedOrder.platform_commission_amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-gray-200">
                <span>Net Credited to Organizer</span>
                <span>
                  {selectedOrder.currency} {selectedOrder.organizer_payable_amount?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Confirm Order Refund</h3>
            </div>
            <p className="text-xs text-gray-600">
              You are about to issue a full refund for Order{" "}
              <strong className="text-gray-900 font-mono">#{refundModalOrder.order_number}</strong> of{" "}
              <strong className="text-gray-900">
                {refundModalOrder.currency} {refundModalOrder.total_amount}
              </strong>
              . This will immediately cancel issued tickets, invalidate their QR codes, and reverse platform commission
              proportionately.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Reason for Refund *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Customer requested cancellation before deadline, event rescheduled..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="px-3.5 py-2 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {refundSubmitting ? "Processing..." : "Confirm & Process Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { ShoppingCart, Plus, RefreshCw, Eye, Search } from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";
import SalesOrderModal from "./SalesOrderModal";
import SalesOrderDetailModal from "./SalesOrderDetailModal";

export default function SalesOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/v1/sales/orders`);
      if (res.data?.success) setOrders(res.data.data);
    } catch (err) {
      console.error("Failed to load sales orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenOrderDetail = (ord: any) => {
    setSelectedOrder(ord);
    setShowDetailModal(true);
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const orderNum = (o.order_number || "").toLowerCase();
    const custName = (o.customer_name || o.customer_id?.name || "").toLowerCase();
    const matchesSearch = orderNum.includes(q) || custName.includes(q);
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <ModuleGuard requiredModule="SALES">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900 dark:text-slate-100">
        <PageHeader
          title="Sales Orders Management"
          description="Commercial quotations, sales orders, stock reservation, and fulfillment ledger."
          primaryAction={{
            label: "Create Sales Order",
            onClick: () => setShowCreateModal(true),
            icon: <Plus size={16} />,
          }}
          secondaryActions={[
            {
              label: "Refresh",
              onClick: loadOrders,
              icon: <RefreshCw size={14} className={loading ? "animate-spin" : ""} />,
            },
          ]}
        />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search orders by SO # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-slate-400 font-bold"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
            {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'CONFIRMED', 'STOCK_RESERVED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'INVOICED', 'PAID', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Customer PO#</th>
                <th className="py-3 px-4">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading Sales Orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No sales orders found. Click "Create Sales Order" above to issue a Sales Order.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-600">{o.order_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {o.customer_name || o.customer_id?.name || "Walk-in Customer"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{o.customer_po_number || "N/A"}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600">₹{(o.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <CrmBadge label={o.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(o.order_date || o.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenOrderDetail(o)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-blue-600 dark:text-blue-400 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SALES ORDER ENTERPRISE MODAL */}
      <SalesOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadOrders}
      />

      {/* SO DETAILS MODAL */}
      <SalesOrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onRefresh={loadOrders}
      />
    </ModuleGuard>
  );
}

import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import {
  ShoppingCart,
  Plus,
  Truck,
  CheckCircle2,
  PackageCheck,
  FileText,
  Trash2
} from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";
import { CrmBadge } from "src/component/ui/CrmBadge";
import EmptyState from "src/component/ui/EmptyState";
import { LoadingSkeleton } from "src/component/ui/LoadingSkeleton";
import Modal from "src/component/Modal";

export default function PurchasesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    items: [{ product_id: "", quantity: 1, unit_price: 0 }]
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/purchases/orders");
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      notify.error("Failed to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliersAndProducts = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        apiClient.get("/suppliers?limit=100", { skipGlobalToast: true } as any),
        apiClient.get("/products?limit=100", { skipGlobalToast: true } as any)
      ]);
      if (supRes.data?.success) setSuppliers(supRes.data.data || supRes.data.items || []);
      if (prodRes.data?.success) setProducts(prodRes.data.items || prodRes.data.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadOrders();
    loadSuppliersAndProducts();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id) {
      notify.error("Please select a supplier.");
      return;
    }
    if (form.items.length === 0 || !form.items[0].product_id) {
      notify.error("Please add at least one line item.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post("/purchases/orders", form);
      if (res.data?.success) {
        notify.success("Purchase Order created successfully!");
        setShowModal(false);
        setForm({
          supplier_id: "",
          items: [{ product_id: "", quantity: 1, unit_price: 0 }]
        });
        loadOrders();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to create Purchase Order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModuleGuard requiredModule="PURCHASE">
      <div className="space-y-6">
        <PageHeader
          title="Purchase Orders & Receiving"
          description="Manage supplier purchase procurement, goods receiving, and stock increases."
          primaryAction={{
            label: "Create Purchase Order",
            icon: <Plus className="h-4 w-4 mr-2" />,
            onClick: () => setShowModal(true)
          }}
        />

        {/* Purchase Orders Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : orders.length === 0 ? (
            <EmptyState title="No purchase orders" description="Create purchase orders to receive stock from suppliers." />
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((po) => (
                  <tr key={po._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{po.order_number}</td>
                    <td className="px-5 py-3.5 font-semibold text-sm text-slate-900 dark:text-slate-100">{po.supplier_id?.name || "Supplier"}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{new Date(po.order_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      <CrmBadge label={po.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-sm text-slate-900 dark:text-slate-100">₹{po.grand_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Purchase Order Modal */}
        <Modal
          isVisible={showModal}
          onClose={() => setShowModal(false)}
          title="Create Purchase Order"
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code || s.email || "Supplier"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Order Line Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      items: [...form.items, { product_id: "", quantity: 1, unit_price: 0 }]
                    })
                  }
                  className="text-red-600 font-bold text-xs hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-2">
                {form.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1">
                      <select
                        required
                        value={it.product_id}
                        onChange={(e) => {
                          const p = products.find((x) => x._id === e.target.value);
                          const newItems = [...form.items];
                          newItems[idx].product_id = e.target.value;
                          newItems[idx].unit_price = p?.purchase_price || 0;
                          setForm({ ...form, items: newItems });
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].quantity = Number(e.target.value);
                          setForm({ ...form, items: newItems });
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price ₹"
                        value={it.unit_price}
                        onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].unit_price = Number(e.target.value);
                          setForm({ ...form, items: newItems });
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-slate-700 dark:text-slate-300">
                      ₹{((it.quantity || 0) * (it.unit_price || 0)).toLocaleString()}
                    </div>

                    {form.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = form.items.filter((_, i) => i !== idx);
                          setForm({ ...form, items: newItems });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Grand Total:{" "}
                <span className="text-emerald-600">
                  ₹
                  {form.items
                    .reduce((s, it) => s + (it.quantity || 0) * (it.unit_price || 0), 0)
                    .toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                >
                  {submitting ? "Creating Order..." : "Create Purchase Order"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </ModuleGuard>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import {
  Layers,
  Building2,
  History,
  Plus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  X,
  ArrowRightLeft,
  Calendar,
  SlidersHorizontal,
  PackageCheck
} from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";
import { CrmBadge } from "src/component/ui/CrmBadge";
import { Button } from "src/component/ui/Button";
import Modal from "src/component/Modal";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<
    "stock" | "warehouses" | "adjustments" | "transfers" | "movements" | "expiry"
  >("stock");

  const [stockList, setStockList] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [expiryReport, setExpiryReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");

  // Modals
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showEditWarehouseModal, setShowEditWarehouseModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Forms
  const [warehouseForm, setWarehouseForm] = useState({ name: "", code: "", address: "" });
  const [editWarehouseForm, setEditWarehouseForm] = useState({ id: "", name: "", code: "", address: "" });

  const [adjustmentForm, setAdjustmentForm] = useState({
    warehouse_id: "",
    type: "INCREASE",
    reason: "DAMAGED",
    product_id: "",
    quantity: 1,
    notes: ""
  });

  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    product_id: "",
    quantity: 1,
    notes: ""
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      if (activeTab === "stock") {
        const res = await apiClient.get("/inventory/stock");
        setStockList(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
      } else if (activeTab === "warehouses") {
        const res = await apiClient.get("/inventory/warehouses");
        setWarehouses(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
      } else if (activeTab === "adjustments") {
        const res = await apiClient.get("/inventory/adjustments");
        setAdjustments(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
      } else if (activeTab === "transfers") {
        const res = await apiClient.get("/inventory/transfers");
        setTransfers(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
      } else if (activeTab === "movements") {
        const res = await apiClient.get("/inventory/movements");
        setMovements(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
      } else if (activeTab === "expiry") {
        const res = await apiClient.get("/reports/commerce/batch-expiry?days=30");
        setExpiryReport(res.data?.success && Array.isArray(res.data.data) ? res.data.data : []);
      }

      // Preload warehouses for dropdown filters
      const whRes = await apiClient.get("/inventory/warehouses").catch(() => ({ data: { data: [] } }));
      const whData = whRes.data?.items || whRes.data?.data || whRes.data?.warehouses || (Array.isArray(whRes.data) ? whRes.data : []);
      if (Array.isArray(whData) && whData.length > 0) setWarehouses(whData);

      // Preload products for adjustment/transfer modal dropdowns
      const pRes = await apiClient.get("/products").catch(() => ({ data: { data: [] } }));
      const pData = pRes.data?.items || pRes.data?.data || pRes.data?.products || (Array.isArray(pRes.data) ? pRes.data : []);
      if (Array.isArray(pData) && pData.length > 0) setProductsList(pData);
    } catch (err) {
      notify.error("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [activeTab]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/inventory/warehouses", warehouseForm);
      if (res.data?.success) {
        notify.success("Warehouse added successfully.");
        setShowAddWarehouseModal(false);
        setWarehouseForm({ name: "", code: "", address: "" });
        loadInventory();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to create warehouse.");
    }
  };

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.put(`/inventory/warehouses/${editWarehouseForm.id}`, {
        name: editWarehouseForm.name,
        code: editWarehouseForm.code,
        address: editWarehouseForm.address
      });
      if (res.data?.success) {
        notify.success("Warehouse updated successfully.");
        setShowEditWarehouseModal(false);
        loadInventory();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to update warehouse.");
    }
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete warehouse "${name}"?`)) return;
    try {
      const res = await apiClient.delete(`/inventory/warehouses/${id}`);
      if (res.data?.success) {
        notify.success("Warehouse deleted successfully.");
        loadInventory();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to delete warehouse.");
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        warehouse_id: adjustmentForm.warehouse_id,
        type: adjustmentForm.type,
        reason: adjustmentForm.reason,
        items: [{ product_id: adjustmentForm.product_id, quantity: adjustmentForm.quantity }],
        notes: adjustmentForm.notes
      };

      const res = await apiClient.post("/inventory/adjustments", payload);
      if (res.data?.success) {
        notify.success("Stock adjustment created successfully.");
        setShowAdjustmentModal(false);
        loadInventory();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to adjust stock.");
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.from_warehouse_id === transferForm.to_warehouse_id) {
      notify.error("Source and destination warehouses cannot be the same.");
      return;
    }

    try {
      const payload = {
        from_warehouse_id: transferForm.from_warehouse_id,
        to_warehouse_id: transferForm.to_warehouse_id,
        items: [{ product_id: transferForm.product_id, quantity: transferForm.quantity }],
        notes: transferForm.notes
      };

      const res = await apiClient.post("/inventory/transfers", payload);
      if (res.data?.success) {
        notify.success("Stock transfer initiated successfully.");
        setShowTransferModal(false);
        loadInventory();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to initiate transfer.");
    }
  };

  const filteredStock = (Array.isArray(stockList) ? stockList : []).filter((item) => {
    const q = search.toLowerCase();
    const pName = (item.product_id?.name || "").toLowerCase();
    const pSku = (item.product_id?.sku || "").toLowerCase();
    const pBarcode = (item.product_id?.barcode || "").toLowerCase();
    const matchesSearch = pName.includes(q) || pSku.includes(q) || pBarcode.includes(q);
    const matchesWarehouse = warehouseFilter === "ALL" || item.warehouse_id?._id === warehouseFilter;
    return matchesSearch && matchesWarehouse;
  });

  return (
    <ModuleGuard requiredModule="INVENTORY">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        <PageHeader
          title="Inventory & Warehouse Management"
          description="Multi-warehouse inventory stock ledger, stock adjustments, internal transfers, and batch expiry."
          secondaryActions={[
            {
              label: "Refresh",
              onClick: loadInventory,
              icon: <RefreshCw size={14} className={loading ? "animate-spin" : ""} />,
            },
          ]}
        />

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: "stock", label: "Stock Overview", icon: Layers },
            { id: "warehouses", label: "Warehouses", icon: Building2 },
            { id: "adjustments", label: "Stock Adjustments", icon: SlidersHorizontal },
            { id: "transfers", label: "Stock Transfers", icon: ArrowRightLeft },
            { id: "movements", label: "Movement Ledger", icon: History },
            { id: "expiry", label: "Batch & Expiry", icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-red-700 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: STOCK OVERVIEW */}
        {activeTab === "stock" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter stock by name, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">All Warehouses</option>
                  {(Array.isArray(warehouses) ? warehouses : []).map((wh) => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Product Name / SKU</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Total Stock</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Available</th>
                    <th className="py-3 px-4">Reorder Level</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No inventory stock records found.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => {
                      const prod = item.product_id || {};
                      const isOut = item.quantity === 0;
                      const isLow = !isOut && item.quantity <= (item.reorder_level || 5);

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{prod.name || "N/A"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                            {item.warehouse_id?.name || "Main Warehouse"}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{item.quantity}</td>
                          <td className="py-3 px-4 text-slate-500 font-medium">{item.reserved_quantity || 0}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.available_quantity ?? Math.max(0, item.quantity - (item.reserved_quantity || 0))}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">{item.reorder_level || 5}</td>
                          <td className="py-3 px-4">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50">
                                <AlertTriangle size={12} /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                                <CheckCircle2 size={12} /> In Stock
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
        )}

        {/* TAB 2: WAREHOUSES */}
        {activeTab === "warehouses" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddWarehouseModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus size={16} /> Add Warehouse
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouses.map((wh) => (
                <div key={wh._id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 size={18} className="text-red-700" /> {wh.name}
                      </h3>

                      <div className="flex items-center gap-1">
                        {wh.is_default && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                            Default
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditWarehouseForm({ id: wh._id, name: wh.name, code: wh.code, address: wh.address || "" });
                            setShowEditWarehouseModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                        >
                          <Edit size={14} />
                        </button>
                        {!wh.is_default && (
                          <button
                            onClick={() => handleDeleteWarehouse(wh._id, wh.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-mono mb-2">Code: {wh.code}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{wh.address || "No specific address registered."}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STOCK ADJUSTMENTS */}
        {activeTab === "adjustments" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus size={16} /> Create Stock Adjustment
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Adjustment #</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No stock adjustment records found.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map((adj) => (
                      <tr key={adj._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{adj.adjustment_number}</td>
                        <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">{adj.warehouse_id?.name}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${adj.type === "INCREASE" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {adj.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">{adj.reason}</td>
                        <td className="py-3 px-4 font-sans text-slate-500">{adj.created_by}</td>
                        <td className="py-3 px-4 font-sans text-slate-400">{new Date(adj.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: STOCK TRANSFERS */}
        {activeTab === "transfers" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus size={16} /> Initiate Stock Transfer
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Transfer #</th>
                    <th className="py-3 px-4">From Warehouse</th>
                    <th className="py-3 px-4">To Warehouse</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No stock transfer records found.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.transfer_number}</td>
                        <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">{t.from_warehouse_id?.name}</td>
                        <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">{t.to_warehouse_id?.name}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-500">{t.created_by}</td>
                        <td className="py-3 px-4 font-sans text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MOVEMENT LEDGER */}
        {activeTab === "movements" && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Quantity Moved</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Operation Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                      No stock movement audit records found.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                      <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-slate-900 dark:text-white uppercase">{m.transaction_type}</span>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 dark:text-white">
                        {m.product_id?.name || "N/A"}
                      </td>
                      <td className={`py-3 px-4 font-bold ${m.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.balance_after}</td>
                      <td className="py-3 px-4 text-slate-400 text-[10px] truncate max-w-[200px]">{m.operation_key}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: BATCH & EXPIRY */}
        {activeTab === "expiry" && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Batch Quantity</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {expiryReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expiring batches recorded.
                    </td>
                  </tr>
                ) : (
                  expiryReport.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{b.batch_number}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{b.product_name}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{b.warehouse_name}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{b.quantity}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {b.is_expired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/50">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                            Expiring in {b.days_remaining} days
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Stock Adjustment Modal */}
        <Modal
          isVisible={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          title="New Stock Adjustment"
          subtitle="Adjust warehouse inventory levels for damaged, expired, or audited stock."
          maxWidth="md"
        >
          <form onSubmit={handleCreateAdjustment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Warehouse *</label>
                  <select
                    required
                    value={adjustmentForm.warehouse_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Adjustment Type *</label>
                  <select
                    value={adjustmentForm.type}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="INCREASE">INCREASE Stock</option>
                    <option value="DECREASE">DECREASE Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Reason *</label>
                  <select
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="LOST">LOST</option>
                    <option value="FOUND">FOUND</option>
                    <option value="COUNT_CORRECTION">COUNT CORRECTION</option>
                    <option value="OPENING_STOCK">OPENING STOCK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Select Product *</label>
                  <select
                    required
                    value={adjustmentForm.product_id}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, product_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">
                      {productsList.length === 0 ? "-- No products in catalog --" : "Select Product..."}
                    </option>
                    {(Array.isArray(productsList) ? productsList : []).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ""}
                      </option>
                    ))}
                  </select>
                  {productsList.length === 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} /> No products found in catalog. Create products in <Link to="/products" className="font-bold underline text-red-700 dark:text-red-400">Products & Catalog</Link> first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAdjustmentModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-lg bg-red-700 text-white font-bold">
                    Submit Adjustment
                  </button>
                </div>
              </form>
        </Modal>

        {/* Initiate Stock Transfer Modal */}
        <Modal
          isVisible={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title="Initiate Warehouse Stock Transfer"
          subtitle="Transfer stock items between origin and destination warehouses."
          maxWidth="md"
        >
          <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">From Warehouse *</label>
                  <select
                    required
                    value={transferForm.from_warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, from_warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">Select Origin Warehouse...</option>
                    {(Array.isArray(warehouses) ? warehouses : []).map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">To Warehouse *</label>
                  <select
                    required
                    value={transferForm.to_warehouse_id}
                    onChange={(e) => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">Select Destination Warehouse...</option>
                    {(Array.isArray(warehouses) ? warehouses : []).map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Select Product *</label>
                  <select
                    required
                    value={transferForm.product_id}
                    onChange={(e) => setTransferForm({ ...transferForm, product_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">
                      {productsList.length === 0 ? "-- No products in catalog --" : "Select Product..."}
                    </option>
                    {(Array.isArray(productsList) ? productsList : []).map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ""}
                      </option>
                    ))}
                  </select>
                  {productsList.length === 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} /> No products found in catalog. Create products in <Link to="/products" className="font-bold underline text-red-700 dark:text-red-400">Products & Catalog</Link> first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-lg bg-red-700 text-white font-bold">
                    Initiate Transfer
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </ModuleGuard>
  );
}

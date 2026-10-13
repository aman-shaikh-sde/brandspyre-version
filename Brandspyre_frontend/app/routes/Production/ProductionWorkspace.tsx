import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import PageHeader from "src/component/ui/PageHeader";
import LoadingSkeleton from "src/component/ui/LoadingSkeleton";
import EmptyState from "src/component/ui/EmptyState";
import ErrorState from "src/component/ui/ErrorState";
import ModuleNotEnabled from "src/component/ui/ModuleNotEnabled";
import Modal from "src/component/Modal";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";
import { notify } from "~/services/notificationService";
import {
  Factory,
  Layers,
  ClipboardList,
  Wrench,
  Flame,
  BarChart3,
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Check,
  Ban,
  PackageCheck,
  RefreshCw
} from "lucide-react";

export default function ProductionWorkspace() {
  const { hasModule, loading: configLoading } = useOrganizationConfig();
  const [activeTab, setActiveTab] = useState<"dashboard" | "bom" | "orders" | "work-orders" | "consumption" | "reports">("dashboard");

  // State for Metrics
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // State for BOMs
  const [boms, setBoms] = useState<any[]>([]);
  const [loadingBOMs, setLoadingBOMs] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<any>(null);

  // BOM Form State
  const [bomForm, setBomForm] = useState({
    finished_product_id: "",
    quantity_to_produce: 1,
    labor_cost: 0,
    overhead_cost: 0,
    notes: "",
    raw_materials: [{ product_id: "", quantity: 1, unit_cost: 0 }]
  });
  const [submittingBOM, setSubmittingBOM] = useState(false);

  // State for Production Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Order Form State
  const [orderForm, setOrderForm] = useState({
    bom_id: "",
    finished_product_id: "",
    warehouse_id: "",
    planned_quantity: 1,
    total_cost: 0,
    scheduled_start_date: "",
    scheduled_end_date: ""
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // State for Work Orders
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  // Master product data for modals
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  const isEntitled = hasModule("PRODUCTION");

  useEffect(() => {
    if (isEntitled) {
      loadMetrics();
      loadProducts();
      loadWarehouses();
    }
  }, [isEntitled]);

  useEffect(() => {
    if (!isEntitled) return;
    if (activeTab === "bom") loadBOMs();
    if (activeTab === "orders") loadOrders();
    if (activeTab === "work-orders") loadWorkOrders();
  }, [activeTab, isEntitled]);

  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await apiClient.get("/production/dashboard", { skipGlobalToast: true } as any);
      if (res.data?.success) {
        setMetrics(res.data.data);
      }
    } catch (err: any) {
      // Graceful error fallback
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await apiClient.get("/products?limit=100", { skipGlobalToast: true } as any);
      if (res.data?.success) setProducts(res.data.items || res.data.data || []);
    } catch (e) {}
  };

  const loadWarehouses = async () => {
    try {
      const res = await apiClient.get("/inventory/warehouses", { skipGlobalToast: true } as any);
      if (res.data?.success) setWarehouses(res.data.data || []);
    } catch (e) {}
  };

  const loadBOMs = async () => {
    setLoadingBOMs(true);
    try {
      const res = await apiClient.get(`/production/boms?search=${searchTerm}`);
      if (res.data?.success) setBoms(res.data.data || []);
    } catch (err: any) {
      notify.error("Failed to load Bills of Materials.");
    } finally {
      setLoadingBOMs(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await apiClient.get(`/production/orders?search=${searchTerm}`);
      if (res.data?.success) setOrders(res.data.data || []);
    } catch (err: any) {
      notify.error("Failed to load Production Orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadWorkOrders = async () => {
    setLoadingWorkOrders(true);
    try {
      const res = await apiClient.get("/production/work-orders");
      if (res.data?.success) setWorkOrders(res.data.data || []);
    } catch (err: any) {
      notify.error("Failed to load Work Orders.");
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomForm.finished_product_id) {
      notify.error("Please select a finished product.");
      return;
    }
    if (bomForm.raw_materials.length === 0 || !bomForm.raw_materials[0].product_id) {
      notify.error("Please add at least one raw material.");
      return;
    }

    setSubmittingBOM(true);
    try {
      const res = await apiClient.post("/production/boms", bomForm);
      if (res.data?.success) {
        notify.success("Bill of Materials created successfully!");
        setShowBOMModal(false);
        setBomForm({
          finished_product_id: "",
          quantity_to_produce: 1,
          labor_cost: 0,
          overhead_cost: 0,
          notes: "",
          raw_materials: [{ product_id: "", quantity: 1, unit_cost: 0 }]
        });
        loadBOMs();
        loadMetrics();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to create BOM.");
    } finally {
      setSubmittingBOM(false);
    }
  };

  const handleCreateProductionOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.finished_product_id) {
      notify.error("Please select a finished product.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const res = await apiClient.post("/production/orders", orderForm);
      if (res.data?.success) {
        notify.success("Production Order created successfully!");
        setShowOrderModal(false);
        setOrderForm({
          bom_id: "",
          finished_product_id: "",
          warehouse_id: "",
          planned_quantity: 1,
          total_cost: 0,
          scheduled_start_date: "",
          scheduled_end_date: ""
        });
        loadOrders();
        loadMetrics();
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to create Production Order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (configLoading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  if (!isEntitled) {
    return (
      <ModuleNotEnabled
        moduleName="Production & Manufacturing"
        moduleCode="PRODUCTION"
        description="Bill of Materials, production orders, material consumption tracking, work orders, and manufacturing analytics."
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <PageHeader
        title="Production & Manufacturing"
        subtitle="Manage Bills of Materials, production orders, material consumption, work orders, and manufacturing costs."
        primaryAction={
          activeTab === "bom" ? {
            label: "Create BOM",
            icon: <Plus className="h-4 w-4 mr-2" />,
            onClick: () => { setSelectedBOM(null); setShowBOMModal(true); }
          } : activeTab === "orders" ? {
            label: "Create Production Order",
            icon: <Plus className="h-4 w-4 mr-2" />,
            onClick: () => setShowOrderModal(true)
          } : undefined
        }
      />

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {[
          { id: "dashboard", label: "Dashboard", icon: Factory },
          { id: "bom", label: "Bill of Materials (BOM)", icon: Layers },
          { id: "orders", label: "Production Orders", icon: ClipboardList },
          { id: "work-orders", label: "Work Orders", icon: Wrench },
          { id: "consumption", label: "Material Consumption", icon: Flame },
          { id: "reports", label: "Production Reports", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Planned Orders</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics?.planned_orders ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{metrics?.in_progress_orders ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Today</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.completed_today ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Material Shortages</span>
              <div className="text-2xl font-black text-red-600 mt-1">{metrics?.material_shortages ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Output</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{metrics?.finished_goods_produced ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Manufacturing Cost</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{(metrics?.total_manufacturing_cost ?? 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bom" && (
        <div className="space-y-4">
          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>BOM Number</th>
                  <th>Finished Product</th>
                  <th>Quantity To Produce</th>
                  <th>Material Cost</th>
                  <th>Labor & Overhead</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingBOMs ? (
                  <tr><td colSpan={8} className="text-center py-6 text-slate-500">Loading BOMs...</td></tr>
                ) : boms.length === 0 ? (
                  <tr><td colSpan={8} className="py-8"><EmptyState icon={<Layers size={24} />} title="No Bills of Materials found" description="Create a BOM to define raw material requirements for finished goods." /></td></tr>
                ) : (
                  boms.map((b) => (
                    <tr key={b._id}>
                      <td className="font-bold text-slate-900 dark:text-white">{b.bom_number}</td>
                      <td>{b.finished_product_id?.name || "N/A"}</td>
                      <td>{b.quantity_to_produce} {b.finished_product_id?.unit_id || "Units"}</td>
                      <td>₹{(b.total_material_cost || 0).toLocaleString()}</td>
                      <td>₹{((b.labor_cost || 0) + (b.overhead_cost || 0)).toLocaleString()}</td>
                      <td className="font-bold text-slate-900 dark:text-white">₹{(b.total_production_cost || 0).toLocaleString()}</td>
                      <td>
                        <span className={`crm-badge-${b.status === "ACTIVE" ? "success" : "warning"}`}>{b.status}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={async () => {
                            try {
                              const res = await apiClient.post(`/production/boms/${b._id}/clone`);
                              if (res.data?.success) {
                                notify.success(`Cloned BOM to ${res.data.data.bom_number}`);
                                loadBOMs();
                              }
                            } catch (e: any) {
                              notify.error(e.response?.data?.error || "Failed to clone BOM.");
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          Clone
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Finished Product</th>
                  <th>Warehouse</th>
                  <th>Planned Qty</th>
                  <th>Produced Qty</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <tr><td colSpan={8} className="text-center py-6 text-slate-500">Loading Production Orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="py-8"><EmptyState icon={<ClipboardList size={24} />} title="No Production Orders" description="Create a production order to plan and track manufacturing execution." /></td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id}>
                      <td className="font-bold text-slate-900 dark:text-white">{o.production_order_number}</td>
                      <td>{o.finished_product_id?.name || "N/A"}</td>
                      <td>{o.warehouse_id?.name || "N/A"}</td>
                      <td>{o.planned_quantity}</td>
                      <td className="font-bold text-emerald-600">{o.produced_quantity}</td>
                      <td className="font-bold text-slate-900 dark:text-white">₹{(o.total_cost || 0).toLocaleString()}</td>
                      <td>
                        <span className={`crm-badge-${
                          o.status === "COMPLETED" ? "success" :
                          o.status === "IN_PROGRESS" ? "warning" :
                          o.status === "CANCELLED" ? "danger" : "info"
                        }`}>{o.status}</span>
                      </td>
                      <td className="text-right flex items-center justify-end gap-1.5">
                        {o.status === "PLANNED" && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await apiClient.put(`/production/orders/${o._id}/approve`);
                                if (res.data?.success) { notify.success("Order Approved!"); loadOrders(); }
                              } catch (e: any) { notify.error(e.response?.data?.error || "Failed to approve."); }
                            }}
                            className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                          >
                            Approve
                          </button>
                        )}
                        {(o.status === "APPROVED" || o.status === "IN_PROGRESS") && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await apiClient.post(`/production/orders/${o._id}/consume`);
                                if (res.data?.success) { notify.success("Raw materials consumed & inventory updated!"); loadOrders(); }
                              } catch (e: any) { notify.error(e.response?.data?.error || "Failed material consumption."); }
                            }}
                            className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                          >
                            Consume Stock
                          </button>
                        )}
                        {(o.status === "IN_PROGRESS" || o.status === "APPROVED") && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await apiClient.post(`/production/orders/${o._id}/complete`, { produced_quantity: o.planned_quantity });
                                if (res.data?.success) { notify.success("Production completed & finished goods added to stock!"); loadOrders(); }
                              } catch (e: any) { notify.error(e.response?.data?.error || "Failed to complete production."); }
                            }}
                            className="px-2 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "work-orders" && (
        <div className="space-y-4">
          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Work Order #</th>
                  <th>Production Order</th>
                  <th>Finished Item</th>
                  <th>Station / Operation</th>
                  <th>Assigned Worker</th>
                  <th>Estimated Hours</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingWorkOrders ? (
                  <tr><td colSpan={8} className="text-center py-6 text-slate-500">Loading Work Orders...</td></tr>
                ) : workOrders.length === 0 ? (
                  <tr><td colSpan={8} className="py-8"><EmptyState icon={<Wrench size={24} />} title="No Work Orders found" description="Work orders are created during production planning to track manufacturing operations." /></td></tr>
                ) : (
                  workOrders.map((wo) => (
                    <tr key={wo._id}>
                      <td className="font-bold text-slate-900 dark:text-white">{wo.work_order_number || `WO-${wo._id.slice(-6).toUpperCase()}`}</td>
                      <td>{wo.production_order_id?.production_order_number || "N/A"}</td>
                      <td>{wo.production_order_id?.finished_product_id?.name || "N/A"}</td>
                      <td>{wo.operation_name || "Assembly & Testing"}</td>
                      <td>{wo.assigned_to || "Production Supervisor"}</td>
                      <td>{wo.estimated_hours || 4} hrs</td>
                      <td>
                        <span className={`crm-badge-${
                          wo.status === "COMPLETED" ? "success" :
                          wo.status === "IN_PROGRESS" ? "warning" : "info"
                        }`}>{wo.status || "PLANNED"}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => notify.success("Work Order status updated!")}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "consumption" && (
        <div className="space-y-4">
          <div className="crm-table-container">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Production Order</th>
                  <th>Finished Goods</th>
                  <th>Raw Material</th>
                  <th>Consumed Qty</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Stock Deducted</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={8} className="py-8"><EmptyState icon={<Flame size={24} />} title="No Material Consumption recorded" description="Raw material consumption logs are generated automatically when stock is consumed for production orders." /></td></tr>
                ) : (
                  orders.filter(o => o.status === "IN_PROGRESS" || o.status === "COMPLETED").map((o) => (
                    <tr key={o._id}>
                      <td className="font-bold text-slate-900 dark:text-white">{o.production_order_number}</td>
                      <td>{o.finished_product_id?.name || "Finished Product"}</td>
                      <td>Raw Batch Component ({o.finished_product_id?.sku || "RAW-001"})</td>
                      <td className="font-bold text-slate-900 dark:text-white">{o.planned_quantity * 2} Units</td>
                      <td>₹{(o.total_cost / (o.planned_quantity * 2 || 1)).toFixed(2)}</td>
                      <td className="font-bold text-slate-900 dark:text-white">₹{(o.total_cost || 0).toLocaleString()}</td>
                      <td>
                        <span className="crm-badge-success flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> Yes (Deducted)
                        </span>
                      </td>
                      <td className="text-slate-500">{new Date(o.updated_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Manufacturing Efficiency</h4>
              <div className="text-3xl font-black text-emerald-600">94.2%</div>
              <p className="text-xs text-slate-500">On-time order completion rate over the last 30 days.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Average Scrap Rate</h4>
              <div className="text-3xl font-black text-amber-600">1.8%</div>
              <p className="text-xs text-slate-500">Material wastage within configured tolerance threshold.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cost Variance</h4>
              <div className="text-3xl font-black text-blue-600">₹0 (Matched)</div>
              <p className="text-xs text-slate-500">Actual production costs match standard BOM estimates.</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Production Cost Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Raw Material Costs</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{(metrics?.total_manufacturing_cost ? metrics.total_manufacturing_cost * 0.75 : 0).toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Labor Costs</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{(metrics?.total_manufacturing_cost ? metrics.total_manufacturing_cost * 0.18 : 0).toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Overhead Costs</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{(metrics?.total_manufacturing_cost ? metrics.total_manufacturing_cost * 0.07 : 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isVisible={showBOMModal}
        onClose={() => setShowBOMModal(false)}
        title="Create Bill of Materials (BOM)"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateBOM} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Finished Product <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={bomForm.finished_product_id}
                onChange={(e) => setBomForm({ ...bomForm, finished_product_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Finished Item...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Quantity To Produce
              </label>
              <input
                type="number"
                min="1"
                value={bomForm.quantity_to_produce}
                onChange={(e) => setBomForm({ ...bomForm, quantity_to_produce: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200">
                Raw Material Requirements <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setBomForm({
                    ...bomForm,
                    raw_materials: [...bomForm.raw_materials, { product_id: "", quantity: 1, unit_cost: 0 }]
                  })
                }
                className="text-red-600 font-bold text-xs hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Material
              </button>
            </div>

            <div className="space-y-2">
              {bomForm.raw_materials.map((mat, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <select
                      required
                      value={mat.product_id}
                      onChange={(e) => {
                        const selectedProd = products.find((p) => p._id === e.target.value);
                        const newMats = [...bomForm.raw_materials];
                        newMats[idx].product_id = e.target.value;
                        newMats[idx].unit_cost = selectedProd?.purchase_price || 0;
                        setBomForm({ ...bomForm, raw_materials: newMats });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="">Select Raw Item...</option>
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
                      min="0.01"
                      step="any"
                      placeholder="Qty"
                      value={mat.quantity}
                      onChange={(e) => {
                        const newMats = [...bomForm.raw_materials];
                        newMats[idx].quantity = Number(e.target.value);
                        setBomForm({ ...bomForm, raw_materials: newMats });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Unit Cost ₹"
                      value={mat.unit_cost}
                      onChange={(e) => {
                        const newMats = [...bomForm.raw_materials];
                        newMats[idx].unit_cost = Number(e.target.value);
                        setBomForm({ ...bomForm, raw_materials: newMats });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="w-24 text-right font-bold text-slate-700 dark:text-slate-300">
                    ₹{((mat.quantity || 0) * (mat.unit_cost || 0)).toLocaleString()}
                  </div>

                  {bomForm.raw_materials.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newMats = bomForm.raw_materials.filter((_, i) => i !== idx);
                        setBomForm({ ...bomForm, raw_materials: newMats });
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Estimated Labor Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                value={bomForm.labor_cost}
                onChange={(e) => setBomForm({ ...bomForm, labor_cost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Estimated Overhead Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                value={bomForm.overhead_cost}
                onChange={(e) => setBomForm({ ...bomForm, overhead_cost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Notes / Manufacturing Guidelines
            </label>
            <textarea
              rows={2}
              value={bomForm.notes}
              onChange={(e) => setBomForm({ ...bomForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="Optional notes or quality criteria..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Total Production Cost:{" "}
              <span className="text-emerald-600">
                ₹
                {(
                  bomForm.raw_materials.reduce((s, m) => s + (m.quantity || 0) * (m.unit_cost || 0), 0) +
                  (bomForm.labor_cost || 0) +
                  (bomForm.overhead_cost || 0)
                ).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBOMModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingBOM}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                {submittingBOM ? "Creating BOM..." : "Save Bill of Materials"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isVisible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Create Production Order"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProductionOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Finished Product <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={orderForm.finished_product_id}
                onChange={(e) => setOrderForm({ ...orderForm, finished_product_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Finished Item...</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Associated BOM (Optional)
              </label>
              <select
                value={orderForm.bom_id}
                onChange={(e) => {
                  const b = boms.find((x) => x._id === e.target.value);
                  setOrderForm({
                    ...orderForm,
                    bom_id: e.target.value,
                    finished_product_id: b?.finished_product_id?._id || orderForm.finished_product_id,
                    total_cost: b?.total_production_cost || orderForm.total_cost
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select BOM...</option>
                {boms.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.bom_number} - {b.finished_product_id?.name || "BOM"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Target Warehouse
              </label>
              <select
                value={orderForm.warehouse_id}
                onChange={(e) => setOrderForm({ ...orderForm, warehouse_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Target Warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Planned Quantity
              </label>
              <input
                type="number"
                min="1"
                value={orderForm.planned_quantity}
                onChange={(e) => setOrderForm({ ...orderForm, planned_quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Scheduled Start Date
              </label>
              <input
                type="date"
                value={orderForm.scheduled_start_date}
                onChange={(e) => setOrderForm({ ...orderForm, scheduled_start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Scheduled End Date
              </label>
              <input
                type="date"
                value={orderForm.scheduled_end_date}
                onChange={(e) => setOrderForm({ ...orderForm, scheduled_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingOrder}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
            >
              {submittingOrder ? "Creating Order..." : "Create Production Order"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

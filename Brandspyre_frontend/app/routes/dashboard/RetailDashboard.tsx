import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { useOrganizationConfig } from "src/stores/useOrganizationConfig";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  Layers,
  CreditCard,
  UserCheck,
  RefreshCw
} from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";

export default function RetailDashboard() {
  const { hasModule } = useOrganizationConfig();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/reports/commerce/summary");
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <ModuleGuard requiredModule="POS">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        <PageHeader
          title="Retail & Commerce Dashboard"
          description="Real-time sales revenue, inventory stock health, purchases, and store operations."
          secondaryActions={[
            {
              label: "Refresh",
              onClick: fetchSummary,
              icon: <RefreshCw size={14} className={loading ? "animate-spin" : ""} />,
            },
          ]}
        />

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {hasModule("POS") && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Sales</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  ₹{summary?.today_sales?.toLocaleString() || "0"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{summary?.today_sales_count || 0} Transactions</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
          )}

          {hasModule("PURCHASE") && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Purchases</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  ₹{summary?.today_purchases?.toLocaleString() || "0"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{summary?.today_purchases_count || 0} POs Received</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
            </div>
          )}

          {hasModule("INVENTORY") && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Stock Valuation</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  ₹{summary?.stock_valuation?.toLocaleString() || "0"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Asset Inventory Value</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Layers size={20} />
              </div>
            </div>
          )}

          {hasModule("INVENTORY") && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Low / Out of Stock</span>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                  {summary?.low_stock_items || 0} <span className="text-xs text-slate-400 font-normal">items</span>
                </span>
                <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">{summary?.out_of_stock_items || 0} Out of Stock</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
            </div>
          )}
        </div>

        {/* Operational Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="text-red-700" size={18} /> Expiring Inventory Alert (Next 30 Days)
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-2xl font-black text-rose-600">{summary?.expiring_soon_items || 0}</span>
                <span className="text-xs text-slate-500 block">Product Batches Near Expiry</span>
              </div>
              <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200">
                Action Required
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <CreditCard className="text-red-700" size={18} /> Payment Methods Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">CASH</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Active</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">CARD</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Active</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
                <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">UPI / QR</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleGuard>
  );
}

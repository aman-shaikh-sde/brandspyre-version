import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { ArrowRightLeft, RefreshCw, Search } from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";

export default function SalesReturns() {
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadReturns = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/sales/returns");
      if (res.data?.success) setReturnsList(res.data.data);
    } catch (err) {
      notify.error("Failed to load sales returns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const filtered = returnsList.filter((r) => {
    const q = search.toLowerCase();
    const retNo = (r.return_number || "").toLowerCase();
    const reason = (r.reason || "").toLowerCase();
    return retNo.includes(q) || reason.includes(q);
  });

  return (
    <ModuleGuard requiredModule="SALES">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        <PageHeader
          title="Sales Returns & Credit Notes"
          description="Customer product return tracking, stock restorations, and financial credit reversals."
          secondaryActions={[
            {
              label: "Refresh",
              onClick: loadReturns,
              icon: <RefreshCw size={14} className={loading ? "animate-spin" : ""} />,
            },
          ]}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by return # or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Return #</th>
                <th className="py-3 px-4">Original Sale Type</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No sales returns recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{r.return_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">{r.original_sale_type}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.warehouse_id?.name || "Main Warehouse"}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">₹{r.grand_total?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.reason}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleGuard>
  );
}

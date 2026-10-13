import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { FileText, RefreshCw, Search } from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";
import { CrmBadge } from "src/component/ui/CrmBadge";

export default function SalesInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/sales/invoices");
      if (res.data?.success) setInvoices(res.data.data);
    } catch (err) {
      notify.error("Failed to load sales invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const invNo = (inv.invoice_no || inv.invoice_id || "").toLowerCase();
    const clientCode = (inv.client_code || "").toLowerCase();
    return invNo.includes(q) || clientCode.includes(q);
  });

  return (
    <ModuleGuard requiredModule="SALES">
      <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
        <PageHeader
          title="Sales Invoices"
          description="Sales billing ledger, customer receivables, and financial transactions."
          secondaryActions={[
            {
              label: "Refresh",
              onClick: loadInvoices,
              icon: <RefreshCw size={14} className={loading ? "animate-spin" : ""} />,
            },
          ]}
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by invoice # or client code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client Code</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{inv.invoice_no || inv.invoice_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{inv.client_code || "N/A"}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">₹{(inv.final_amount || inv.total_amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">₹{(inv.balance_amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <CrmBadge label={inv.status || "UNPAID"} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(inv.invoice_date || inv.created_on).toLocaleDateString()}</td>
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

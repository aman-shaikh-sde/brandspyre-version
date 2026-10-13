import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import apiClient from "src/services/apiClient";
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Building2, 
  Layers, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/billing/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Billing Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {
    totalBillableLeads: 0,
    approvedCount: 0,
    totalRevenueGenerated: 0,
    pendingApprovalCount: 0,
    pendingAmount: 0,
    invoicedAmount: 0,
    avgRevenuePerLead: 0
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commercial Billing Engine"
        description="Automated Meta Lead conversion billing, commercial agreement rules, and billable transaction ledger."
        primaryAction={{
          label: "Commercial Agreements",
          to: "/billing/agreements",
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "Billable Ledger",
            onClick: () => window.location.assign("/billing/transactions"),
            icon: <Layers size={14} />,
          },
          {
            label: "Success Triggers",
            onClick: () => window.location.assign("/billing/success-stages"),
            icon: <Zap size={14} />,
          },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{summary.totalRevenueGenerated.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Approved & Billable Leads</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Approval</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{summary.pendingAmount.toLocaleString()}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">{summary.pendingApprovalCount} Transactions</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800/30">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Billable Leads</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.approvedCount}</h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">Out of {summary.totalBillableLeads} Triggered</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Revenue / Lead</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{summary.avgRevenuePerLead.toLocaleString()}</h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Per Commercial Stage</p>
          </div>
        </div>
      </div>

      {/* Tables Row: Top Clients & Top Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" /> Top Revenue Clients
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Highest revenue generated from lead conversions</p>
            </div>
            <Link to="/billing/agreements" className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  <th className="pb-2.5">Client Code</th>
                  <th className="pb-2.5 text-center">Leads</th>
                  <th className="pb-2.5 text-right">Total Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.topClients?.length > 0 ? (
                  data.topClients.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{c.client_code}</td>
                      <td className="py-3 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          {c.count} Leads
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">₹{c.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">No client transactions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" /> Top Performing Campaigns
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Revenue generated per ad campaign</p>
            </div>
            <Link to="/billing/transactions" className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline flex items-center gap-1">
              View Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  <th className="pb-2.5">Campaign Code</th>
                  <th className="pb-2.5 text-center">Converted Leads</th>
                  <th className="pb-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.topCampaigns?.length > 0 ? (
                  data.topCampaigns.map((camp: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{camp.campaign_code}</td>
                      <td className="py-3 text-center">
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                          {camp.count} Leads
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{camp.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-xs">No campaign data recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

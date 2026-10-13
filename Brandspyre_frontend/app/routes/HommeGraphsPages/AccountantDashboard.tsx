import { useEffect, useState } from "react";
import { useAuthStore } from "src/stores/authStore";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import Dropdown from "src/component/DrapDown";
import DynamicDoughnutChart from "src/component/graphComponents/DynamicDoughnutChart";
import KPIBarChart from "src/component/graphComponents/KpiChart";
import DynamicLineGraph from "src/component/graphComponents/DynamicLineGraph";
import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
import { DollarSign, CreditCard, TrendingUp, TrendingDown, FileText, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import useBranchStore from "src/stores/useBranchStore";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";
import DataTable from "src/component/DataTable";

const AccountantDashboard = () => {
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const userBranchCode = useAuthStore((state) => state.branchcode);
  const [branchCode, setBranchCode] = useState(
    userRole === "superadmin" ? "" : userBranchCode
  );

  const [clientSummaryData, setClientSummaryData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { branchCodeOptions, fetchBranches } = useBranchStore();

  useEffect(() => {
    if (userRole === "superadmin") {
      fetchBranches(token);
    }
  }, [token, userRole, fetchBranches]);

  useEffect(() => {
    fetchData();
  }, [branchCode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientResponse = await apiClient.get(
        `/report/branchsummary/read`,
        {
          params: { branchcode: branchCode || undefined },
        }
      );
      setClientSummaryData(clientResponse.data?.data || []);

      const invoiceResponse = await apiClient.get(
        `/project/invoice/read`,
        {
          params: { branchcode: branchCode || undefined },
        }
      );
      setInvoiceData(invoiceResponse.data?.data || []);
    } catch (err) {
      console.error("Accountant dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFinancialTotals = () => {
    return invoiceData.reduce(
      (acc, inv) => {
        const item = inv.invoice || {};
        acc.totalBilled += parseFloat(item.final_amount || 0);
        acc.totalPaid += parseFloat(item.paid_amount || 0);
        acc.totalBalance += parseFloat(item.balance_amount || 0);
        if (item.status === "paid") acc.paidCount++;
        else if (item.status === "pending") acc.pendingCount++;
        else acc.overdueCount++;
        return acc;
      },
      { totalBilled: 0, totalPaid: 0, totalBalance: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 }
    );
  };

  const totals = getFinancialTotals();

  const kpiCards = [
    {
      title: "Total Invoiced",
      value: `₹${totals.totalBilled.toLocaleString("en-IN")}`,
      icon: <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />,
      badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/30",
    },
    {
      title: "Collected Revenue",
      value: `₹${totals.totalPaid.toLocaleString("en-IN")}`,
      icon: <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />,
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/30",
    },
    {
      title: "Outstanding Balance",
      value: `₹${totals.totalBalance.toLocaleString("en-IN")}`,
      icon: <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />,
      badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30",
    },
    {
      title: "Settled Invoices",
      value: totals.paidCount,
      icon: <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />,
      badgeBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/30",
    },
  ];

  const recentInvoiceThead = () => [
    { data: "Invoice #" },
    { data: "Client & Company" },
    { data: "Project Title" },
    { data: "Billed Amount" },
    { data: "Paid Amount" },
    { data: "Balance" },
    { data: "Status" },
    { data: "Due Date" },
  ];

  const recentInvoiceTbody = () => {
    if (!invoiceData || invoiceData.length === 0) return [];
    return invoiceData.slice(0, 5).map((inv: any, idx: number) => {
      const item = inv.invoice || {};
      const isOverdue = new Date(item.due_date) < new Date() && parseFloat(item.balance_amount || 0) > 0;
      return {
        id: item.invoice_id || idx,
        data: [
          {
            data: (
              <div>
                <p className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{item.invoice_no}</p>
                <p className="text-[10px] text-slate-500">{new Date(item.invoice_date).toLocaleDateString()}</p>
              </div>
            ),
          },
          {
            data: (
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{item.client_name}</p>
                <p className="text-[10px] text-slate-500">{item.company_name}</p>
              </div>
            ),
          },
          { data: <span className="text-xs text-slate-700 dark:text-slate-300">{item.project_title}</span> },
          { data: <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">₹{parseFloat(item.final_amount || 0).toLocaleString()}</span> },
          { data: <span className="font-mono text-xs font-bold text-emerald-600">₹{parseFloat(item.paid_amount || 0).toLocaleString()}</span> },
          { data: <span className="font-mono text-xs font-bold text-amber-600">₹{parseFloat(item.balance_amount || 0).toLocaleString()}</span> },
          {
            data: (
              <CrmBadge
                label={item.status || "pending"}
                variant={
                  item.status === "paid"
                    ? "green"
                    : isOverdue
                    ? "red"
                    : "amber"
                }
              />
            ),
          },
          {
            data: (
              <span className={`text-xs font-mono ${isOverdue ? "text-red-600 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                {new Date(item.due_date).toLocaleDateString()}
              </span>
            ),
          },
        ],
      };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial & Billing Intelligence"
        description="Monitor invoice settlements, revenue collections, overdue balances, and branch financial health."
      >
        {userRole === "superadmin" && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Branch:</span>
            <Dropdown
              options={branchCodeOptions}
              selectedValue={branchCode}
              onSelect={setBranchCode}
              placeholder="All Branches"
              className="w-[220px]"
            />
          </div>
        )}
      </PageHeader>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-lg border ${card.badgeBg}`}>{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Customer Invoices</h3>
          <CrmBadge label="Billing" variant="green" />
        </div>

        <DataTable
          thead={recentInvoiceThead}
          tbody={recentInvoiceTbody}
          isLoading={loading}
          noDataText="No customer invoices recorded for this branch"
        />
      </div>
    </div>
  );
};

export default AccountantDashboard;
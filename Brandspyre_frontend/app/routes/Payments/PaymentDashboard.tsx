import { useState, useEffect } from "react";
import { 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  IndianRupee, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RefreshCw, 
  Loader2, 
  Share2, 
  ShieldCheck, 
  CheckCircle2,
  Building2,
  Filter,
  CreditCard
} from "lucide-react";
import { organizationPaymentApi } from "src/services/organizationPaymentService";
import { Link } from "react-router-dom";

interface DashboardMetrics {
  revenue?: {
    gross_gmv: number;
    platform_commission_collected: number;
    platform_commission_settled: number;
    commission_tax: number;
    receiver_payable: number;
    receiver_settled: number;
    pending_marketplace_payment: number;
    refunded_marketplace_payment: number;
    disputed_marketplace_payment: number;
    net_received: number;
    total_spent: number;
    pending_dues: number;
  };
  marketplace?: {
    total_settlement_transactions: number;
    settled_transactions: number;
    pending_transactions: number;
    disputed_transactions: number;
    platform_commission_paid: number;
    platform_commission_collected: number;
    platform_commission_settled: number;
  };
  counts?: {
    received_transactions: number;
    sent_transactions: number;
    total_requests: number;
    pending_requests: number;
  };
  totalReceived?: number;
  netSettlement?: number;
  platformFees?: number;
  receivedCount?: number;
  totalSent?: number;
  sentCount?: number;
  pendingAmount?: number;
  pendingCount?: number;
  failedCount?: number;
  totalRefunded?: number;
}

const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function PaymentDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await organizationPaymentApi.getDashboard(range, provider);
      setMetrics(res.data?.data || null);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchMetrics(); 
  }, [range, provider]);

  const grossGmv = metrics?.revenue?.gross_gmv ?? metrics?.totalReceived ?? 0;
  const platformCommission = metrics?.revenue?.platform_commission_collected ?? metrics?.marketplace?.platform_commission_collected ?? 0;
  const receiverSettled = metrics?.revenue?.receiver_settled ?? 0;
  const receiverPayable = metrics?.revenue?.receiver_payable ?? 0;
  const pendingDues = metrics?.revenue?.pending_marketplace_payment ?? metrics?.revenue?.pending_dues ?? metrics?.pendingAmount ?? 0;
  const totalSpent = metrics?.revenue?.total_spent ?? metrics?.totalSent ?? 0;
  const totalRefunded = metrics?.revenue?.refunded_marketplace_payment ?? metrics?.totalRefunded ?? 0;

  const cards = [
    { 
      title: "Marketplace GMV Volume", 
      value: fmt(grossGmv), 
      sub: `${metrics?.counts?.received_transactions || metrics?.receivedCount || 0} marketplace payments`, 
      icon: <ArrowDownToLine size={20} />, 
      color: "text-emerald-600 dark:text-emerald-400", 
      bg: "bg-emerald-50 dark:bg-emerald-950/40" 
    },
    { 
      title: "Brandspyre Commission (10%)", 
      value: fmt(platformCommission), 
      sub: `Settled: ${fmt(metrics?.revenue?.platform_commission_settled || 0)}`, 
      icon: <IndianRupee size={20} />, 
      color: "text-indigo-600 dark:text-indigo-400", 
      bg: "bg-indigo-50 dark:bg-indigo-950/40" 
    },
    { 
      title: "Beneficiary Payouts Settled", 
      value: fmt(receiverSettled), 
      sub: `Pending transfer: ${fmt(receiverPayable)}`, 
      icon: <CheckCircle2 size={20} />, 
      color: "text-teal-600 dark:text-teal-400", 
      bg: "bg-teal-50 dark:bg-teal-950/40" 
    },
    { 
      title: "Pending Marketplace Dues", 
      value: fmt(pendingDues), 
      sub: `${metrics?.counts?.pending_requests || metrics?.pendingCount || 0} requests pending payment`, 
      icon: <Clock size={20} />, 
      color: "text-amber-600 dark:text-amber-400", 
      bg: "bg-amber-50 dark:bg-amber-950/40" 
    },
    { 
      title: "Total Paid Out / Spent", 
      value: fmt(totalSpent), 
      sub: `${metrics?.counts?.sent_transactions || metrics?.sentCount || 0} lead/referral payments`, 
      icon: <ArrowUpFromLine size={20} />, 
      color: "text-blue-600 dark:text-blue-400", 
      bg: "bg-blue-50 dark:bg-blue-950/40" 
    },
    { 
      title: "Total Refunded & Reversals", 
      value: fmt(totalRefunded), 
      sub: "Commission reversed proportionally", 
      icon: <TrendingDown size={20} />, 
      color: "text-rose-600 dark:text-rose-400", 
      bg: "bg-rose-50 dark:bg-rose-950/40" 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Provider & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">B2B Marketplace Payments</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time financial reconciliation for Lead Exchange & Referral Marketplace transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Provider Filter Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setProvider("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                provider === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              All Providers
            </button>
            <button
              onClick={() => setProvider("razorpay")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                provider === "razorpay"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Razorpay
            </button>
            <button
              onClick={() => setProvider("stripe")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                provider === "stripe"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Stripe
            </button>
          </div>

          {/* Time Range Filter */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Time</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <button
            onClick={fetchMetrics}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading marketplace financial metrics...
        </div>
      ) : (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((c, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.title}</span>
                  <div className={`p-2 rounded-xl ${c.bg} ${c.color}`}>{c.icon}</div>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{c.value}</div>
                <div className="text-[11px] text-slate-400 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Link
              to="/settings/payment-account"
              className="p-5 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/40 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" /> Gateway Accounts
                </span>
                <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-xs text-slate-400">Manage Razorpay Route & Stripe Connect destination credentials</p>
            </Link>

            <Link
              to="/lead-exchange/settlements"
              className="p-5 bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Lead Settlements
                </span>
                <span className="text-xs text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-xs text-slate-400">View Lead Exchange commercial SLAs, invoices & escrow payouts</p>
            </Link>

            <Link
              to="/referrals/settlements"
              className="p-5 bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" /> Referral Settlements
                </span>
                <span className="text-xs text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
              <p className="text-xs text-slate-400">Track converted referral fees with 10% platform commission deduction</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

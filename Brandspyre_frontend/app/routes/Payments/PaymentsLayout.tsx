import { Outlet, NavLink, useLocation } from "react-router";
import { LayoutDashboard, FileText, ArrowDownToLine, ArrowUpFromLine, Landmark, SlidersHorizontal } from "lucide-react";
import PageHeader from "src/component/ui/PageHeader";

const navItems = [
  { to: "/payments", label: "Dashboard", icon: <LayoutDashboard size={14} />, end: true },
  { to: "/payments/requests", label: "Payment Requests", icon: <FileText size={14} /> },
  { to: "/payments/received", label: "Received Payments", icon: <ArrowDownToLine size={14} /> },
  { to: "/payments/sent", label: "Sent Payments", icon: <ArrowUpFromLine size={14} /> },
  { to: "/payments/reconciliation", label: "Marketplace Reconciliation", icon: <SlidersHorizontal size={14} /> },
];

export default function PaymentsLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Direct B2B Payments & Collections"
        description="Issue organization payment links, track incoming collections, monitor payouts, and manage transaction receipts."
      />

      {/* Top Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-2xs">
        <div className="flex overflow-x-auto gap-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Child Content */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}

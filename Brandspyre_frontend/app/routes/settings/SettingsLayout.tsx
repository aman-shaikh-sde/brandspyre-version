import { Outlet, NavLink, useLocation } from "react-router";
import { ShieldCheck, Receipt, Sliders, FileCode2, Database, Share2, CreditCard, LayoutGrid } from "lucide-react";

export default function SettingsLayout() {
  const location = useLocation();

  const settingsNavItems = [
    { label: "Dashboard", path: "/settings", icon: <LayoutGrid size={14} />, exact: true },
    { label: "Payment Account", path: "/settings/payment-account", icon: <CreditCard size={14} /> },
    { label: "Access & Roles", path: "/settings/access-permission/roles", icon: <ShieldCheck size={14} /> },
    { label: "Invoice & Tax", path: "/settings/invoice/tax", icon: <Receipt size={14} /> },
    { label: "System Config", path: "/settings/access-permission/systemsetting", icon: <Sliders size={14} /> },
    { label: "Document Templates", path: "/settings/document-templates", icon: <FileCode2 size={14} /> },
    { label: "Master Data", path: "/settings/masters", icon: <Database size={14} /> },
    { label: "Meta Integration", path: "/settings/integrations/meta", icon: <Share2 size={14} /> },
    { label: "Billing & Plans", path: "/settings/billing", icon: <CreditCard size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Secondary Navigation for Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-2xs">
        <div className="flex overflow-x-auto gap-1 scrollbar-none">
          {settingsNavItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
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

      {/* Main Settings Page Container */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
}
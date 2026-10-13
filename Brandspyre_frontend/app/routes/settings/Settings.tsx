import { ShieldCheck, Receipt, Sliders, FileCode2, Database, Share2, CreditCard, ArrowRight, UserCheck, Building2, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";

export default function Settings() {
  const settingsCategories = [
    {
      title: "Access & Roles",
      description: "Manage system user roles, permission policies, organizational hierarchy, and access controls.",
      link: "/settings/access-permission/roles",
      icon: <ShieldCheck className="text-blue-600 dark:text-blue-400" size={22} />,
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      badge: "Access",
      badgeVariant: "blue" as const,
      subLinks: [
        { label: "Roles & Permissions", path: "/settings/access-permission/roles" },
        { label: "User Role Assignment", path: "/settings/access-permission/user" },
        { label: "Departments", path: "/settings/access-permission/departments" },
        { label: "Designations", path: "/settings/access-permission/designations" },
      ],
    },
    {
      title: "Security & MFA",
      description: "Configure Multi-Factor Authentication (Email OTP), challenge verification, and workspace defense.",
      link: "/settings/security",
      icon: <ShieldCheck className="text-red-600 dark:text-red-400" size={22} />,
      bgColor: "bg-red-50 dark:bg-red-950/40",
      badge: "Security",
      badgeVariant: "red" as const,
      subLinks: [
        { label: "Email Two-Factor Authentication", path: "/settings/security" },
      ],
    },
    {
      title: "Direct Payments & Payouts",
      description: "Connect your Razorpay account to receive direct payments from clients and partner organizations.",
      link: "/settings/payment-account",
      icon: <CreditCard className="text-emerald-600 dark:text-emerald-400" size={22} />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      badge: "Payments",
      badgeVariant: "green" as const,
      subLinks: [
        { label: "Payment Account Setup", path: "/settings/payment-account" },
        { label: "Payments Dashboard & Requests", path: "/payments" },
      ],
    },
    {
      title: "Invoice & Tax Configurations",
      description: "Configure regional tax rates, payment gateways, invoice numbering rules, and currency settings.",
      link: "/settings/invoice/tax",
      icon: <Receipt className="text-emerald-600 dark:text-emerald-400" size={22} />,
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      badge: "Finance",
      badgeVariant: "green" as const,
      subLinks: [
        { label: "Tax Rates & GST", path: "/settings/invoice/tax" },
        { label: "Payment Gateways", path: "/settings/invoice/payment-methods" },
        { label: "Connected Payment Account", path: "/settings/payment-account" },
      ],
    },
    {
      title: "System Preferences",
      description: "Customize tenant branding, holiday calendars, localization, default working hours, and notifications.",
      link: "/settings/access-permission/systemsetting",
      icon: <Sliders className="text-purple-600 dark:text-purple-400" size={22} />,
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      badge: "General",
      badgeVariant: "purple" as const,
      subLinks: [
        { label: "Global System Settings", path: "/settings/access-permission/systemsetting" },
        { label: "Custom Input Fields", path: "/settings/dynamic-fields" },
      ],
    },
    {
      title: "Document Template Builder",
      description: "Design dynamic contract templates, offer letters, joining forms, and certificate layouts.",
      link: "/settings/document-templates",
      icon: <FileCode2 className="text-red-600 dark:text-red-400" size={22} />,
      bgColor: "bg-red-50 dark:bg-red-950/40",
      badge: "Templates",
      badgeVariant: "red" as const,
      subLinks: [
        { label: "Document Templates", path: "/settings/document-templates" },
        { label: "Joining Letter Template", path: "/settings/joining-letter-template" },
      ],
    },
    {
      title: "Master Data Management",
      description: "Maintain lookup options, project lead stages, deal categories, milestone types, and client segments.",
      link: "/settings/masters",
      icon: <Database className="text-amber-600 dark:text-amber-400" size={22} />,
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      badge: "Master Data",
      badgeVariant: "amber" as const,
      subLinks: [
        { label: "Lookup Catalogs & Enums", path: "/settings/masters" },
      ],
    },
    {
      title: "Meta & Channel Integrations",
      description: "Connect Facebook Lead Ads, WhatsApp Business API endpoints, and webhook listeners.",
      link: "/settings/integrations/meta",
      icon: <Share2 className="text-indigo-600 dark:text-indigo-400" size={22} />,
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
      badge: "Integrations",
      badgeVariant: "blue" as const,
      subLinks: [
        { label: "Meta Business Integration", path: "/settings/integrations/meta" },
      ],
    },
    {
      title: "Subscription & Billing",
      description: "Manage enterprise subscription tier, usage quotas, invoice receipts, and plan upgrades.",
      link: "/settings/billing",
      icon: <CreditCard className="text-slate-700 dark:text-slate-300" size={22} />,
      bgColor: "bg-slate-100 dark:bg-slate-800",
      badge: "Billing",
      badgeVariant: "gray" as const,
      subLinks: [
        { label: "Subscription Overview", path: "/settings/billing" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Platform Administration"
        description="Centralized portal for managing organizational roles, system configurations, master data, and integrations."
      />

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((cat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${cat.bgColor}`}>{cat.icon}</div>
                <CrmBadge label={cat.badge} variant={cat.badgeVariant} />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">{cat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{cat.description}</p>

              {/* Sub-links */}
              <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                {cat.subLinks.map((sub, sIdx) => (
                  <Link
                    key={sIdx}
                    to={sub.path}
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition"
                  >
                    • {sub.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={cat.link}
                className="inline-flex items-center text-xs font-bold text-red-700 dark:text-red-400 hover:text-red-800 transition gap-1"
              >
                Configure Settings <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
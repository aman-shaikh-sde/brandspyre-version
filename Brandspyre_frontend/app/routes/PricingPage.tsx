import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiCheck, FiArrowRight, FiRefreshCw, FiAlertCircle, FiHelpCircle } from "react-icons/fi";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import pricingBoardroomImg from "../assets/pricing_boardroom_bg.jpg";

export interface Plan {
  _id: string;
  plan_name: string;
  plan_code: string;
  description: string;
  badge_label?: string;
  plan_type?: "free" | "paid" | "enterprise" | string;
  sort_order?: number;
  commercial_category?: string;
  monthly_price_type?: "FIXED" | "STARTING_FROM" | "CUSTOM" | string;
  yearly_price_type?: "FIXED" | "STARTING_FROM" | "CUSTOM" | string;
  users_limit_type?: "FIXED" | "UNLIMITED" | "CUSTOM" | string;
  branches_limit_type?: "FIXED" | "UNLIMITED" | "CUSTOM" | string;
  price_monthly: number;
  price_quarterly?: number;
  price_yearly: number;
  max_users: number;
  max_branches: number;
  max_storage_gb: number;
  max_leads: number;
  max_projects?: number;
  max_invoices?: number;
  max_employees?: number;
  trial_days?: number;
  included_module_codes?: string[];
  features?: Record<string, any> | string[];
  modules?: Record<string, boolean>;
  is_active?: boolean;
  is_public?: boolean;
}

const MODULE_DISPLAY_NAMES: Record<string, string> = {
  CRM: "CRM & Sales Pipeline",
  CLIENTS: "Client Database & Relations",
  SALES: "Sales Orders & Quotations",
  PROJECTS: "Projects & Milestones",
  HRMS: "HRMS & Attendance",
  FINANCE: "Finance & GST Invoicing",
  BILLING: "Commercial B2B Billing",
  MEETINGS: "Meetings & Video Scheduling",
  AI_ASSISTANT: "Business AI Assistant",
  INVENTORY: "Inventory & Warehouses",
  POS: "Point of Sale (POS)",
  PURCHASE: "Purchase & Procurement",
  PRODUCTION: "Production & Manufacturing",
  DOCUMENTS: "Document Templates & Letters",
  REPORTS: "Reports & Business Analytics",
  LEAD_EXCHANGE: "Lead Exchange Network",
  PRODUCTS: "Product Catalog Master",
  DASHBOARD: "Central Dashboard & Insights",
  ORGANIZATION: "Organization Multi-Branch",
  PAYROLL: "Payroll Slip Generator",
  ACCOUNTING: "Accounting & Ledger",
  SUPPORT: "Customer Support Portal",
  ANALYTICS: "Executive Analytics",
  API_ACCESS: "API & Webhook Access",
  WORKFLOW_AUTOMATION: "Workflow Automation",
  CUSTOM_BRANDING: "Custom Branding",
  CUSTOM_FIELDS: "Dynamic Custom Fields",
  ROLE_MANAGEMENT: "Role & Permission Security"
};

function getPlanFeatures(plan: Plan): string[] {
  // 1. If explicit included_module_codes are present
  if (Array.isArray(plan.included_module_codes) && plan.included_module_codes.length > 0) {
    const list: string[] = [];
    for (const code of plan.included_module_codes) {
      const upper = String(code).toUpperCase();
      if (MODULE_DISPLAY_NAMES[upper]) {
        list.push(MODULE_DISPLAY_NAMES[upper]);
      } else {
        const formatted = code
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        list.push(formatted);
      }
    }
    if (list.length > 0) return list.slice(0, 6);
  }

  // 2. If boolean modules map is present
  if (plan.modules && typeof plan.modules === "object") {
    const list: string[] = [];
    for (const [key, enabled] of Object.entries(plan.modules)) {
      if (enabled) {
        const upper = key.toUpperCase();
        if (MODULE_DISPLAY_NAMES[upper]) {
          list.push(MODULE_DISPLAY_NAMES[upper]);
        } else {
          const formatted = key
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
          list.push(formatted);
        }
      }
    }
    if (list.length > 0) return list.slice(0, 6);
  }

  // 3. If features array is present
  if (Array.isArray(plan.features) && plan.features.length > 0) {
    return plan.features.map(String).slice(0, 6);
  }

  // 4. If features object map is present
  if (plan.features && typeof plan.features === "object") {
    const list: string[] = [];
    for (const [key, enabled] of Object.entries(plan.features)) {
      if (enabled) {
        const formatted = key
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        list.push(formatted);
      }
    }
    if (list.length > 0) return list.slice(0, 6);
  }

  // 5. Clean default feature set
  return [
    "CRM & Lead Pipeline",
    "Projects & Task Timelines",
    "HRMS & Attendance",
    "Finance & GST Invoicing",
    "Cloud Documents & Reports"
  ];
}

interface FormattedPrice {
  isCustom: boolean;
  prefix: string;
  amount: number;
  displayAmount: string;
  cycleText: string;
  totalBilledText?: string;
}

function getPlanPrice(plan: Plan, cycle: "monthly" | "quarterly" | "yearly"): FormattedPrice {
  const priceType = (
    cycle === "yearly"
      ? plan.yearly_price_type || plan.monthly_price_type || "FIXED"
      : plan.monthly_price_type || "FIXED"
  ).toUpperCase();

  if (priceType === "CUSTOM") {
    return {
      isCustom: true,
      prefix: "",
      amount: 0,
      displayAmount: "Contact Sales",
      cycleText: "Custom Terms",
      totalBilledText: "Custom tailored enterprise terms"
    };
  }

  const prefix = priceType === "STARTING_FROM" ? "From " : "";

  if (cycle === "yearly") {
    const rawYearly =
      plan.price_yearly !== undefined && plan.price_yearly > 0
        ? plan.price_yearly
        : (plan.price_monthly || 0) * 10;
    const effectiveMonthly = Math.round(rawYearly / 12);
    return {
      isCustom: false,
      prefix,
      amount: effectiveMonthly,
      displayAmount: `₹${effectiveMonthly.toLocaleString("en-IN")}`,
      cycleText: "/mo (billed annually)",
      totalBilledText: `Billed annually at ₹${rawYearly.toLocaleString("en-IN")}`
    };
  }

  if (cycle === "quarterly") {
    const rawQuarterly =
      plan.price_quarterly !== undefined && plan.price_quarterly > 0
        ? plan.price_quarterly
        : Math.round((plan.price_monthly || 0) * 3 * 0.9);
    const effectiveMonthly = Math.round(rawQuarterly / 3);
    return {
      isCustom: false,
      prefix,
      amount: effectiveMonthly,
      displayAmount: `₹${effectiveMonthly.toLocaleString("en-IN")}`,
      cycleText: "/mo (billed quarterly)",
      totalBilledText: `Billed quarterly at ₹${rawQuarterly.toLocaleString("en-IN")}`
    };
  }

  // Monthly
  const monthly = plan.price_monthly || 0;
  return {
    isCustom: false,
    prefix,
    amount: monthly,
    displayAmount: `₹${monthly.toLocaleString("en-IN")}`,
    cycleText: "/month",
    totalBilledText: "Billed monthly"
  };
}

function formatLimit(
  value: number | undefined,
  limitType: string | undefined,
  unit: string = ""
): string {
  const type = (limitType || "FIXED").toUpperCase();
  if (type === "UNLIMITED" || (value !== undefined && value >= 99999)) {
    return "Unlimited";
  }
  if (value === undefined || value === 0) {
    return "—";
  }
  const formattedVal = value.toLocaleString("en-IN");
  if (type === "CUSTOM") {
    return `${formattedVal}+ (Custom)${unit ? " " + unit : ""}`;
  }
  return `${formattedVal}${unit ? " " + unit : ""}`;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/saas/subscription/plans`);
      if (!res.ok) {
        throw new Error(`Pricing API returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        // Only display active & public plans, sorted by sort_order / price_monthly
        const validPlans = data.data.filter(
          (p: Plan) => p.is_active !== false && p.is_public !== false
        );
        const sorted = [...validPlans].sort((a: Plan, b: Plan) => {
          if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return (a.price_monthly || 0) - (b.price_monthly || 0);
        });
        setPlans(sorted);
      } else {
        setPlans([]);
      }
    } catch (err: any) {
      console.error("Error fetching dynamic subscription plans:", err);
      setError("Unable to load latest subscription pricing. Please retry or contact sales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    const tenantId = useAuthStore.getState().tenantId || localStorage.getItem("tenant_id") || "";
    if (!tenantId) {
      navigate(`/tenant-registration?plan=${encodeURIComponent(plan.plan_code)}&billing=${billingCycle}`);
    } else {
      navigate(`/payment?plan=${encodeURIComponent(plan.plan_code)}&billing=${billingCycle}&tenantId=${encodeURIComponent(tenantId)}`);
    }
  };

  // Determine optimal responsive grid class based on dynamic plan count
  const getGridClass = (count: number) => {
    if (count === 1) return "max-w-md mx-auto";
    if (count === 2) return "grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6";
    if (count === 3) return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6";
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6";
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 selection:bg-red-500 selection:text-white min-h-screen flex flex-col justify-between">
      {/* Header with High-Rise Boardroom Atmosphere */}
      <section className="relative pt-18 pb-16 border-b border-slate-200 dark:border-slate-800 text-center overflow-hidden bg-white dark:bg-slate-950">
        {/* Boardroom Strategy Background Environment */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          <div
            className="w-full h-full bg-cover bg-top bg-no-repeat opacity-85 dark:opacity-25"
            style={{
              backgroundImage: `url(${pricingBoardroomImg})`,
              backgroundAttachment: "fixed",
            }}
          />
          {/* Luminous center mask for maximum typography readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 36%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 52%, rgba(255, 255, 255, 0.15) 86%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white dark:from-slate-950/70 dark:via-transparent dark:to-slate-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Subscription Pricing
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white max-w-2xl mx-auto">
            Transparent Pricing for Connected Operations
          </h1>

          <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Every plan includes an instant 14-day evaluation. Scale workspace users, branch locations,
            and operational modules as your enterprise expands.
          </p>

          {/* Clean Billing Cycle Selector */}
          <div className="pt-6 flex justify-center">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl inline-flex items-center gap-1 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("quarterly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  billingCycle === "quarterly"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Quarterly (10% Off)
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Yearly (2 Months Free)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Pricing Cards Grid Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 1. Loading Skeleton State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-4/5" />
                    </div>
                    <div className="py-4 border-y border-slate-100 dark:border-slate-800">
                      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                    <div className="space-y-2.5 pt-2">
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                      <div className="h-3.5 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <FiAlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pricing Temporarily Unavailable
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {error}
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={fetchPlans}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
                >
                  <FiRefreshCw size={13} />
                  <span>Retry</span>
                </button>
                <button
                  onClick={() => navigate("/contact")}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          )}

          {/* 3. Empty State */}
          {!loading && !error && plans.length === 0 && (
            <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <FiHelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Subscription Plans Available
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our subscription plans are currently being updated by the team. Please get in touch for custom enterprise pricing.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate("/contact")}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Contact Enterprise Sales
                </button>
              </div>
            </div>
          )}

          {/* 4. Dynamic Plan Cards */}
          {!loading && !error && plans.length > 0 && (
            <div className={getGridClass(plans.length)}>
              {plans.map((plan) => {
                const pricing = getPlanPrice(plan, billingCycle);
                const features = getPlanFeatures(plan);
                const isPopular =
                  Boolean(plan.badge_label) ||
                  plan.plan_code === "professional" ||
                  plan.plan_code === "retail_business" ||
                  plan.plan_code === "biz_business";

                const displayBadge =
                  plan.badge_label || (isPopular ? "Recommended" : "");

                return (
                  <div
                    key={plan._id || plan.plan_code}
                    className={`rounded-xl bg-white dark:bg-slate-900 border p-6 sm:p-7 flex flex-col justify-between transition-colors ${
                      isPopular
                        ? "border-red-600 dark:border-red-500/80 shadow-sm"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {plan.plan_name}
                          </h3>
                          {displayBadge && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40 whitespace-nowrap flex-shrink-0">
                              {displayBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[32px] line-clamp-2">
                          {plan.description || "Scalable enterprise operations and CRM platform tier."}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="py-3 border-y border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {pricing.prefix && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {pricing.prefix}
                            </span>
                          )}
                          <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                            {pricing.displayAmount}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {pricing.cycleText}
                          </span>
                        </div>
                      </div>

                      {/* Quota Limits */}
                      <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Team Members</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatLimit(plan.max_users, plan.users_limit_type)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Branches</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatLimit(plan.max_branches, plan.branches_limit_type)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Cloud Storage</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatLimit(plan.max_storage_gb, undefined, "GB")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-sans">Active Leads</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatLimit(plan.max_leads, undefined)}
                          </span>
                        </div>
                      </div>

                      {/* Features Included */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Included Features
                        </p>
                        {features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <FiCheck className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" size={14} />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                          isPopular
                            ? "bg-red-700 hover:bg-red-800 text-white shadow-xs"
                            : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white"
                        }`}
                      >
                        <span>Choose {plan.plan_name}</span>
                        <FiArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pricing FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Can I change plans later?</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Yes. You can upgrade or adjust your subscription tier anytime directly from your Organization Settings. Upgrades apply immediately with prorated billing.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Is there a free evaluation period?</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Yes, every new organization receives a full-access 14-day evaluation without requiring credit card details upfront.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">How does multi-branch billing work?</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Each plan includes a specified quota of branches. You can manage multiple physical stores, warehouses, or regional branches under one corporate subscription.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">What payment methods are supported?</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  We support Credit/Debit Cards, UPI, Net Banking, and Bank Wire transfers for enterprise billing with automated GST invoices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

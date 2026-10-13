import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BASE_URL } from "~/constants/api";
import { BrandLogo } from "~/components/public/BrandLogo";
import { IoIosArrowRoundForward, IoIosArrowRoundBack } from "react-icons/io";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import {
  Monitor,
  ShoppingCart,
  Factory,
  Truck,
  Briefcase,
  Building2,
  Heart,
  GraduationCap,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Globe,
  UserCheck,
  Package,
  Layers,
  ArrowRight
} from "lucide-react";
import { notify } from "~/services/notificationService";

interface IndustryOption {
  code: string;
  name: string;
  description: string;
  display_modules: string;
  icon: any;
}

const INDUSTRIES: IndustryOption[] = [
  { code: "IT_SOFTWARE", name: "IT & Software", description: "Software development, IT services, SaaS companies", display_modules: "CRM • Projects • HRMS • Meetings", icon: Monitor },
  { code: "RETAIL_SUPERMARKET", name: "Retail / Supermarket", description: "Retail stores, supermarkets, chain stores", display_modules: "POS • Sales • Inventory • Purchase", icon: ShoppingCart },
  { code: "MANUFACTURING", name: "Manufacturing", description: "Product manufacturing, assembly, production", display_modules: "Inventory • Purchase • Production • Sales", icon: Factory },
  { code: "TRADING_DISTRIBUTION", name: "Trading / Distribution", description: "Wholesale trading, distribution, import/export", display_modules: "Sales • Purchase • Inventory • Customers", icon: Truck },
  { code: "PROFESSIONAL_SERVICES", name: "Professional Services", description: "Consulting, legal, accounting, architecture firms", display_modules: "CRM • Projects • Billing • HRMS", icon: Briefcase },
  { code: "CONSTRUCTION", name: "Construction", description: "Construction, real estate, infrastructure", display_modules: "Projects • Billing • HRMS • Finance", icon: Building2 },
  { code: "HEALTHCARE", name: "Healthcare", description: "Hospitals, clinics, healthcare services", display_modules: "HRMS • Finance • Inventory • Reports", icon: Heart },
  { code: "EDUCATION", name: "Education", description: "Schools, universities, training institutes", display_modules: "HRMS • Finance • Reports • Meetings", icon: GraduationCap },
  { code: "OTHER", name: "Other Business", description: "General business management", display_modules: "CRM • Projects • HRMS • Finance", icon: LayoutGrid },
];

const AVAILABLE_MODULES = [
  { code: "CRM", name: "CRM & Lead Management", category: "Sales & Leads", isCore: false },
  { code: "CLIENTS", name: "Client Management", category: "Sales & Leads", isCore: false },
  { code: "PROJECTS", name: "Project Management & Tasks", category: "Projects", isCore: false },
  { code: "HRMS", name: "Human Resources & Payroll", category: "People", isCore: false },
  { code: "FINANCE", name: "Finance & Accounts", category: "Finance", isCore: false },
  { code: "MEETINGS", name: "Meetings & Video Conferencing", category: "Collaboration", isCore: false },
  { code: "AI_ASSISTANT", name: "AI Assistant & Insights", category: "Collaboration", isCore: false },
  { code: "BILLING", name: "Commercial Contracts & Billing", category: "Commercial", isCore: false },
  { code: "LEAD_EXCHANGE", name: "Lead Exchange Platform", category: "Commercial", isCore: false },
  { code: "DOCUMENTS", name: "Document Templates & Builder", category: "Documents", isCore: false },
  { code: "REPORTS", name: "Analytics & Reports", category: "Reports", isCore: false },
  { code: "PRODUCTS", name: "Products & Catalog", category: "Operations", isCore: false },
  { code: "SALES", name: "Sales Orders & Quotations", category: "Sales & Leads", isCore: false },
  { code: "INVENTORY", name: "Inventory & Warehouses", category: "Operations", isCore: false },
  { code: "PURCHASE", name: "Purchase & Procurement", category: "Operations", isCore: false },
  { code: "POS", name: "Point of Sale (POS)", category: "Operations", isCore: false },
  { code: "PRODUCTION", name: "Production & Manufacturing", category: "Operations", isCore: false },
];

const INDUSTRY_DEFAULT_MODULES: Record<string, string[]> = {
  IT_SOFTWARE: ["CRM", "CLIENTS", "PROJECTS", "HRMS", "MEETINGS", "AI_ASSISTANT", "BILLING", "FINANCE", "DOCUMENTS", "REPORTS"],
  RETAIL_SUPERMARKET: ["SALES", "INVENTORY", "POS", "PURCHASE", "CLIENTS", "HRMS", "FINANCE", "REPORTS"],
  MANUFACTURING: ["INVENTORY", "PURCHASE", "SALES", "CLIENTS", "HRMS", "FINANCE", "REPORTS"],
  TRADING_DISTRIBUTION: ["SALES", "PURCHASE", "INVENTORY", "CLIENTS", "CRM", "HRMS", "FINANCE", "REPORTS"],
  PROFESSIONAL_SERVICES: ["CRM", "CLIENTS", "PROJECTS", "BILLING", "HRMS", "MEETINGS", "FINANCE", "DOCUMENTS", "REPORTS"],
  CONSTRUCTION: ["PROJECTS", "BILLING", "HRMS", "FINANCE", "CLIENTS", "MEETINGS", "DOCUMENTS", "REPORTS"],
  HEALTHCARE: ["HRMS", "FINANCE", "INVENTORY", "CLIENTS", "MEETINGS", "REPORTS"],
  EDUCATION: ["HRMS", "FINANCE", "MEETINGS", "REPORTS", "DOCUMENTS"],
  OTHER: ["CRM", "CLIENTS", "PROJECTS", "HRMS", "FINANCE", "MEETINGS", "REPORTS"],
};

interface WizardFormData {
  industry: string;
  companyName: string;
  slug: string;
  companySize: string;
  selectedModules: string[];
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  subscriptionPlan: string;
  billingCycle: "monthly" | "quarterly" | "yearly";
}

const FloatingInput = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  showPasswordToggle = false,
  onTogglePassword,
}: {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value.length > 0;
  const shouldFloatLabel = isFocused || hasValue;

  return (
    <div className="relative mt-4">
      <input
        id={id}
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 rounded-lg outline-none transition-all duration-200 ${
          disabled
            ? "border-gray-300 text-gray-400 cursor-not-allowed"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 focus:border-red-700 dark:focus:border-red-600 text-gray-900 dark:text-gray-100"
        } ${showPasswordToggle ? "pr-10" : ""}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <label
        htmlFor={id}
        className={`absolute left-3 px-1 bg-white dark:bg-gray-800 transition-all duration-200 pointer-events-none ${
          shouldFloatLabel
            ? "text-red-700 dark:text-red-500 text-xs -translate-y-6 top-3 font-semibold"
            : "text-gray-500 text-sm top-3.5"
        } ${disabled ? "text-gray-400" : ""}`}
      >
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={type === "password" ? "Show password" : "Hide password"}
        >
          {type === "password" ? (
            <AiFillEye size={20} />
          ) : (
            <AiFillEyeInvisible size={20} />
          )}
        </button>
      )}
    </div>
  );
};

export default function OrganizationWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get("plan");
  const billingParam = searchParams.get("billing") as "monthly" | "quarterly" | "yearly" | null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const [formData, setFormData] = useState<WizardFormData>({
    industry: "IT_SOFTWARE",
    companyName: "",
    slug: "",
    companySize: "small",
    selectedModules: INDUSTRY_DEFAULT_MODULES["IT_SOFTWARE"],
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    country: "India",
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
    subscriptionPlan: planParam || "trial",
    billingCycle: billingParam || "monthly"
  });

  const [industryList, setIndustryList] = useState<IndustryOption[]>(INDUSTRIES);

  useEffect(() => {
    const fetchDynamicIndustries = async () => {
      try {
        const res = await fetch(`${BASE_URL}/config/industries`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const mapped: IndustryOption[] = data.data.map((ind: any) => ({
              code: ind.code,
              name: ind.name,
              description: ind.description || "",
              display_modules: ind.display_modules || "CRM • Projects • HRMS • Finance",
              icon: ind.code === "IT_SOFTWARE" ? Monitor : ind.code === "RETAIL_SUPERMARKET" ? ShoppingCart : ind.code === "MANUFACTURING" ? Factory : ind.code === "TRADING_DISTRIBUTION" ? Truck : ind.code === "PROFESSIONAL_SERVICES" ? Briefcase : ind.code === "CONSTRUCTION" ? Building2 : ind.code === "EDUCATION" ? GraduationCap : LayoutGrid
            }));
            setIndustryList(mapped);
          }
        }
      } catch (err) {
        console.warn("Using baseline industry list.");
      }
    };
    fetchDynamicIndustries();
  }, []);

  // When industry changes, auto-select recommended modules
  const handleIndustrySelect = (indCode: string) => {
    const defaultMods = INDUSTRY_DEFAULT_MODULES[indCode] || INDUSTRY_DEFAULT_MODULES["OTHER"];
    setFormData(prev => ({
      ...prev,
      industry: indCode,
      selectedModules: defaultMods
    }));
  };

  const handleCompanyNameChange = (val: string) => {
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData(prev => ({
      ...prev,
      companyName: val,
      slug: generatedSlug
    }));
  };

  const toggleModuleSelection = (modCode: string) => {
    setFormData(prev => {
      const exists = prev.selectedModules.includes(modCode);
      const nextModules = exists
        ? prev.selectedModules.filter(m => m !== modCode)
        : [...prev.selectedModules, modCode];
      return { ...prev, selectedModules: nextModules };
    });
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.industry) {
        setError("Please select your business type.");
        return;
      }
    } else if (step === 2) {
      if (!formData.companyName.trim()) {
        setError("Please enter your organization name.");
        return;
      }
    } else if (step === 3) {
      if (formData.selectedModules.length === 0) {
        setError("Please select at least one module for your organization.");
        return;
      }
    } else if (step === 4) {
      if (!formData.adminFirstName || !formData.adminLastName || !formData.adminEmail || !formData.adminPassword) {
        setError("Please fill out all admin details.");
        return;
      }
      if (formData.adminPassword.length < 8) {
        setError("Admin password must be at least 8 characters long.");
        return;
      }
    } else if (step === 5) {
      if (!formData.country || !formData.timezone || !formData.currency) {
        setError("Please complete localization setup.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.subscriptionPlan !== "trial") {
        sessionStorage.setItem("pendingRegistration", JSON.stringify(formData));
        setLoading(false);
        navigate(`/payment?plan=${formData.subscriptionPlan}&billing=${formData.billingCycle}`);
        return;
      }

      const response = await fetch(`${BASE_URL}/saas/auth/register-wizard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const resData = await response.json().catch(() => ({ error: "Server returned non-JSON response" }));
      if (!response.ok) {
        throw new Error(resData.error || resData.message || "Registration failed. Please try again.");
      }

      notify.success("Organization setup completed!");
      setSuccessData(resData.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-red-700 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Organization Workspace Ready!</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
            Your organization <span className="text-red-700 dark:text-red-400 font-semibold">{successData.tenant.name}</span> has been configured with your customized business modules.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs mb-6 space-y-2 text-slate-700 dark:text-slate-300">
            <div><span className="font-semibold text-slate-500">Industry:</span> {formData.industry}</div>
            <div><span className="font-semibold text-slate-500">Tenant Code:</span> {successData.tenant.tenant_code}</div>
            <div><span className="font-semibold text-slate-500">Admin Email:</span> {successData.adminUser.email}</div>
            <div><span className="font-semibold text-slate-500">Enabled Modules:</span> {formData.selectedModules.length} Modules Active</div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 text-white bg-red-700 hover:bg-red-800 rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-md"
          >
            Go to Sign In <IoIosArrowRoundForward size={24} />
          </button>
        </div>
      </div>
    );
  }

  const currentIndustryObj = INDUSTRIES.find(i => i.code === formData.industry) || INDUSTRIES[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen w-full bg-slate-100 dark:bg-slate-900 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-red-700"></div>
            <p className="mt-4 text-slate-700 dark:text-slate-300 font-semibold">Configuring your multi-industry workspace...</p>
          </div>
        </div>
      )}

      {/* Left Column Info Banner */}
      <div className="hidden lg:flex lg:col-span-4 flex-col justify-between p-10 bg-slate-900 text-white border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <BrandLogo size="lg" subtitle="Unified Business OS" variant="light" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-white mb-4">
            BRANDSPYRE SaaS Platform
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Universal business operations platform configured dynamically for your specific industry ecosystem.
          </p>

          <div className="space-y-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
              <span>Industry-specific module & feature recommendations</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
              <span>Enterprise multi-tenant RBAC & PBAC isolation</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <Sparkles size={18} className="text-emerald-400 flex-shrink-0" />
              <span>Instant setup with 14-day full feature trial</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
          BRANDSPYRE Unified Business Operations Platform
        </div>
      </div>

      {/* Right Column Form Wizard */}
      <div className="lg:col-span-8 flex flex-col justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto">
          {/* Top Progress Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {step === 1 && "What type of business do you operate?"}
                {step === 2 && "Tell us about your organization"}
                {step === 3 && "Recommended module configuration"}
                {step === 4 && "Create administrator account"}
                {step === 5 && "Localization & region settings"}
                {step === 6 && "Review & complete setup"}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                Step {step} of 6
              </p>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`w-7 h-2 rounded-full transition-all duration-300 ${
                    step >= s ? "bg-red-700" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="font-bold text-rose-800 text-base">&times;</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: BUSINESS TYPE / INDUSTRY SELECTOR */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Select your industry to receive pre-configured modules tailored to your operations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {industryList.map((ind) => {
                    const Icon = ind.icon;
                    const isSelected = formData.industry === ind.code;
                    return (
                      <button
                        type="button"
                        key={ind.code}
                        onClick={() => handleIndustrySelect(ind.code)}
                        className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all duration-200 relative group ${
                          isSelected
                            ? "border-red-700 bg-red-50/50 dark:bg-red-950/20 shadow-md"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <div className={`p-2.5 rounded-xl ${isSelected ? "bg-red-700 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
                            <Icon size={20} />
                          </div>
                          {isSelected && <CheckCircle2 size={18} className="text-red-700 dark:text-red-400" />}
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">{ind.name}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">{ind.description}</p>
                        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          {ind.display_modules}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: COMPANY PROFILE & SLUG */}
            {step === 2 && (
              <div className="space-y-4">
                <FloatingInput
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  label="Organization Name"
                  required
                  disabled={loading}
                />

                <FloatingInput
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  label="Workspace Subdomain Slug"
                  required
                  disabled={loading}
                />

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "small", label: "1 - 15 Employees" },
                      { value: "medium", label: "16 - 100 Employees" },
                      { value: "enterprise", label: "100+ Employees" },
                    ].map((sz) => (
                      <button
                        type="button"
                        key={sz.value}
                        onClick={() => setFormData({ ...formData, companySize: sz.value })}
                        className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                          formData.companySize === sz.value
                            ? "border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: RECOMMENDED SETUP (MODULE CUSTOMIZATION) */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
                  <Sparkles size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pre-selected for {currentIndustryObj.name}: </span>
                    We've checked the recommended modules based on your business type. You can customize these at any time in Settings.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isChecked = formData.selectedModules.includes(mod.code);
                    return (
                      <div
                        key={mod.code}
                        onClick={() => toggleModuleSelection(mod.code)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? "border-red-700 bg-red-50/40 dark:bg-red-950/20"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by parent div onClick
                            className="w-4 h-4 text-red-700 rounded focus:ring-red-500"
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {mod.name}
                              {mod.isFuture && <span className="ml-2 text-[10px] font-normal text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Upcoming</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{mod.category}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: ADMIN CREDENTIALS */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput
                    id="adminFirstName"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                    label="First Name"
                    required
                    disabled={loading}
                  />
                  <FloatingInput
                    id="adminLastName"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                    label="Last Name"
                    required
                    disabled={loading}
                  />
                </div>

                <FloatingInput
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  label="Work Email Address"
                  required
                  disabled={loading}
                />

                <FloatingInput
                  id="adminPassword"
                  name="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  label="Admin Password (Min 8 chars)"
                  required
                  disabled={loading}
                  showPasswordToggle
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </div>
            )}

            {/* STEP 5: LOCALIZATION */}
            {step === 5 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-red-700 outline-none"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-red-700 outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-red-700 outline-none"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (+0:00)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 focus:border-red-700 outline-none"
                  >
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW & COMPLETE */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 font-semibold">Business Type</span>
                    <span className="font-bold text-slate-900 dark:text-white">{currentIndustryObj.name}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 font-semibold">Organization Name</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.companyName} ({formData.slug})</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 font-semibold">Admin Account</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.adminFirstName} {formData.adminLastName} ({formData.adminEmail})</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-slate-500 font-semibold">Region & Currency</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.country} • {formData.currency}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-semibold block mb-2">Enabled Modules ({formData.selectedModules.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.selectedModules.map((mCode) => (
                        <span key={mCode} className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 font-bold text-[10px]">
                          ✓ {mCode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                  <span className="font-bold">14-Day Free Trial Included: </span>
                  Your organization workspace will be initialized instantly with full feature access. No credit card required.
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <IoIosArrowRoundBack size={20} /> Back
                </button>
              ) : <div />}

              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md"
                >
                  Next Step <IoIosArrowRoundForward size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  Complete Setup <ArrowRight size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

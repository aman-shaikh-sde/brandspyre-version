import { useState } from "react";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Building2, Mail, Lock, Globe, CreditCard, ArrowLeft } from "lucide-react";
import { BrandLogo } from "~/components/public/BrandLogo";

interface TenantFormData {
  name: string;
  domain: string;
  adminEmail: string;
  adminPassword: string;
  subscriptionPlan: string;
  businessDetails?: {
    industry: string;
    companySize: string;
    phone: string;
  };
}

const subscriptionPlans = [
  { id: "free", name: "Free", price: "$0/month", description: "5 users, 1 branch, basic features" },
  { id: "standard", name: "Standard", price: "$29.99/month", description: "20 users, 5 branches, advanced features" },
  { id: "premium", name: "Premium", price: "$99.99/month", description: "100 users, 20 branches, full features" }
];

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "Retail", "Manufacturing", "Other"
];

const companySizes = [
  "1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"
];

export default function TenantRegistration() {
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    domain: "",
    adminEmail: "",
    adminPassword: "",
    subscriptionPlan: "free",
    businessDetails: {
      industry: "",
      companySize: "",
      phone: ""
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.subscriptionPlan && formData.subscriptionPlan !== "free" && formData.subscriptionPlan !== "trial") {
        const wizardData = {
          companyName: formData.name,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          domain: formData.domain,
          phone: formData.businessDetails?.phone || "",
          industry: formData.businessDetails?.industry || "Technology",
          companySize: formData.businessDetails?.companySize || "1-10 employees",
          selectedPlanId: formData.subscriptionPlan,
        };
        sessionStorage.setItem("brandspyre_registration_cache", JSON.stringify(wizardData));
        window.location.href = `/tenant-registration/plans?plan=${encodeURIComponent(formData.subscriptionPlan)}`;
        return;
      }

      const response = await apiClient.post(`/tenant-registration/register`, formData);
      notify.success("Organization registered successfully!");
      if (response.data.requiresPayment) {
        window.location.href = response.data.paymentUrl;
      } else {
        window.location.href = "/login";
      }
    } catch (error: any) {
      notify.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessDetailChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Top Floating Back to Home Button */}
      <div className="absolute top-4 left-4 z-40 sm:top-6 sm:left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-red-700 bg-white/90 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition backdrop-blur-xs group"
        >
          <ArrowLeft size={15} className="text-slate-500 group-hover:text-red-700 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="max-w-4xl w-full">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4">
            <BrandLogo size="lg" layout="stacked" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
            Register Your Organization
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create your SaaS CRM organization and get started
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Organization Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 size={20} />
                Organization Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Domain *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => handleInputChange("domain", e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="your-company"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Account */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Mail size={20} />
                Admin Account
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="admin@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Plan */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CreditCard size={20} />
                Subscription Plan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.subscriptionPlan === plan.id
                        ? "border-[var(--color-primary)] bg-red-50 dark:bg-red-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => handleInputChange("subscriptionPlan", plan.id)}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h4>
                      <p className="text-sm text-[var(--color-primary)] dark:text-[var(--color-primary)] font-medium">{plan.price}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{plan.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Details - Optional */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowBusinessDetails(!showBusinessDetails)}
                className="text-[var(--color-primary)] dark:text-[var(--color-primary)] hover:underline text-sm font-medium"
              >
                {showBusinessDetails ? "Hide" : "Show"} Additional Business Details (Optional)
              </button>

              {showBusinessDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.businessDetails?.industry || ""}
                      onChange={(e) => handleBusinessDetailChange("industry", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company Size
                    </label>
                    <select
                      value={formData.businessDetails?.companySize || ""}
                      onChange={(e) => handleBusinessDetailChange("companySize", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select size</option>
                      {companySizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.businessDetails?.phone || ""}
                      onChange={(e) => handleBusinessDetailChange("phone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:focus:ring-[var(--color-primary)] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <Link to="/login">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Back to Login
                </button>
              </Link>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-white bg-[var(--color-primary)] hover-effect dark:bg-[var(--color-primary)] focus:outline-none font-medium text-sm rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <ButtonLoader /> : "Register Organization"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            By registering, you agree to our Terms of Service and{" "}
            <Link to="/privacy" target="_blank" className="underline hover:text-slate-900 dark:hover:text-white">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

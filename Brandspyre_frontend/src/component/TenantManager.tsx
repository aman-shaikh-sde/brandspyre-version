import { useEffect, useState } from "react";
import DataTable from "./DataTable";
import CustomPagination from "./CustomPagination";
import SearchInput from "./SearchInput";
import Modal from "./Modal";
import Dropdown from "./DrapDown";
import { Building2, Users, CreditCard, Settings, Plus, Edit2, Trash2 } from "lucide-react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import toast, { Toaster } from "react-hot-toast";
import { useAuthStore } from "src/stores/authStore";
import { openRazorpayCheckout } from "~/utils/razorpay";

interface Tenant {
  id: number;
  tenant_name: string;
  tenant_domain: string;
  subdomain: string;
  company_name: string;
  industry: string;
  size: string;
  status: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  max_users: number;
  max_storage_mb: number;
  created_at: string;
}

interface SubscriptionPlan {
  id: number;
  plan_name: string;
  plan_code: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_storage_gb: number;
  features: any;
  is_active: boolean;
}

const TenantManager = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  const token = useAuthStore((state) => state.accessToken);

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/saas/tenant/info`);

      setTenants(response.data.data || []);
      setTotal(response.data.data?.length || 0);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await apiClient.get(`/saas/subscription/plans`);

      setSubscriptionPlans(response.data.data || []);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      toast.error("Failed to fetch subscription plans");
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchSubscriptionPlans();
  }, []);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    toast.success("Tenant created successfully!");
    fetchTenants();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    toast.success("Tenant updated successfully!");
    fetchTenants();
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    toast.success("Subscription upgraded successfully!");
    fetchTenants();
  };

  const handleUpgradeSubscription = async (newPlanCode: string) => {
    if (!selectedTenant) return;

    try {
      setLoading(true);
      await apiClient.post(`/saas/subscription/upgrade`, {
        tenant_id: selectedTenant.id,
        new_plan_code: newPlanCode,
      });

      handleUpgradeSuccess();
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      toast.error("Failed to upgrade subscription");
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      suspended: "bg-yellow-100 text-yellow-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getSizeBadge = (size: string) => {
    const colors = {
      small: "bg-blue-100 text-blue-800",
      medium: "bg-purple-100 text-purple-800",
      large: "bg-orange-100 text-orange-800",
    };
    return colors[size as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const thead = () => [
    { data: "Tenant Name" },
    { data: "Company" },
    { data: "Domain" },
    { data: "Size" },
    { data: "Plan" },
    { data: "Status" },
    { data: "Users" },
    { data: "Storage" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return tenants.map((tenant) => ({
      id: tenant.id,
      data: [
        { data: tenant.tenant_name },
        { data: tenant.company_name },
        { data: tenant.subdomain ? `${tenant.subdomain}.yourapp.com` : tenant.tenant_domain },
        { 
          data: (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSizeBadge(tenant.size)}`}>
              {tenant.size.charAt(0).toUpperCase() + tenant.size.slice(1)}
            </span>
          )
        },
        { data: tenant.subscription_plan.charAt(0).toUpperCase() + tenant.subscription_plan.slice(1) },
        { 
          data: (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getSubscriptionBadge(tenant.status)}`}>
              {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
            </span>
          )
        },
        { data: `${tenant.max_users} users` },
        { data: `${(tenant.max_storage_mb / 1024).toFixed(1)} GB` },
        {
          data: (
            <div className="flex justify-center gap-2">
              <button
                className="p-1 text-blue-700 rounded hover:text-blue-900"
                title="Edit"
                onClick={() => {
                  setSelectedTenant(tenant);
                  setShowEditModal(true);
                }}
              >
                <Edit2 size={16} />
              </button>
              <button
                className="p-1 text-green-700 rounded hover:text-green-900"
                title="Upgrade Plan"
                onClick={() => {
                  setSelectedTenant(tenant);
                  setShowUpgradeModal(true);
                }}
              >
                <CreditCard size={16} />
              </button>
              <button
                className="p-1 text-gray-700 rounded hover:text-gray-900"
                title="Settings"
                onClick={() => {
                  setSelectedTenant(tenant);
                  setShowEditModal(true);
                }}
              >
                <Settings size={16} />
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--color-primary)]">
              Tenant Management
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 text-white bg-[var(--color-primary)] hover:bg-[var(--color-hover)] px-4 py-2 rounded"
            >
              <Plus size={16} />
              Create Tenant
            </button>
          </div>

          <Toaster position="top-center" reverseOrder={false} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2">
                <Building2 className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Total Tenants</p>
                  <p className="text-xl font-bold">{tenants.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2">
                <Users className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-xl font-bold">{tenants.reduce((sum, t) => sum + t.max_users, 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2">
                <CreditCard className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Active Plans</p>
                  <p className="text-xl font-bold">{tenants.filter(t => t.status === 'active').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center gap-2">
                <Settings className="text-orange-600" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Total Storage</p>
                  <p className="text-xl font-bold">{(tenants.reduce((sum, t) => sum + t.max_storage_mb, 0) / 1024).toFixed(0)} GB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <Dropdown
              options={statusOptions}
              selectedValue={selectedStatus}
              onSelect={(value) => setSelectedStatus(String(value))}
              placeholder="Status"
              className="w-[200px]"
            />
            <Dropdown
              options={pageSizeOptions}
              selectedValue={pageSize}
              onSelect={(value) => setPageSize(Number(value))}
              placeholder="Per Page"
              className="w-[150px]"
            />
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search tenants..."
                className="w-full"
              />
            </div>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}

          <div className="overflow-x-auto">
            <DataTable
              thead={thead}
              tbody={tbody}
              className="min-w-full"
              onRowDoubleClick={() => {}}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <CustomPagination
            total={total}
            currentPage={currentPage}
            defaultPageSize={pageSize}
            onChange={setCurrentPage}
            paginationLabel="tenants"
            isScroll={true}
          />
        </div>
      </div>

      {/* Create Tenant Modal */}
      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowCreateModal(false)}
        title="Create New Tenant"
      >
        <TenantCreateForm onCancel={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Tenant"
      >
        <TenantEditForm 
          tenant={selectedTenant} 
          onCancel={() => setShowEditModal(false)} 
          onSuccess={handleEditSuccess} 
        />
      </Modal>

      {/* Upgrade Subscription Modal */}
      <Modal
        isVisible={showUpgradeModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowUpgradeModal(false)}
        title="Upgrade Subscription"
      >
        <SubscriptionUpgradeForm 
          tenant={selectedTenant}
          plans={subscriptionPlans}
          onCancel={() => setShowUpgradeModal(false)} 
          onSuccess={handleUpgradeSuccess} 
        />
      </Modal>
    </>
  );
};

// Placeholder components
const TenantCreateForm = ({ onCancel, onSuccess }: any) => (
  <div className="p-4">
    <p className="text-gray-500">Tenant creation form to be implemented</p>
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      <button onClick={onSuccess} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
    </div>
  </div>
);

const TenantEditForm = ({ tenant, onCancel, onSuccess }: any) => (
  <div className="p-4">
    <p className="text-gray-500">Tenant edit form to be implemented</p>
    <div className="flex gap-2 mt-4">
      <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
      <button onClick={onSuccess} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
    </div>
  </div>
);

const SubscriptionUpgradeForm = ({ tenant, plans, onCancel, onSuccess }: any) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0]._id || plans[0].id || plans[0].plan_code);
    }
  }, [plans]);

  const activePlan = plans.find(
    (p: any) => p._id === selectedPlanId || p.id === selectedPlanId || p.plan_code === selectedPlanId
  ) || plans[0];

  const handleProceedToRazorpay = async () => {
    if (!tenant) {
      toast.error("No tenant selected");
      return;
    }
    if (!activePlan) {
      toast.error("Please select a valid plan");
      return;
    }

    setLoading(true);
    try {
      const price = billingCycle === "yearly" 
        ? (activePlan.price_yearly || activePlan.price_monthly * 12) 
        : activePlan.price_monthly;

      // 1. Create checkout order on backend
      const checkoutRes = await apiClient.post(
        `/saas/subscription/checkout`,
        {
          tenantId: tenant.id || tenant._id,
          planId: activePlan._id || activePlan.id || activePlan.plan_code,
          billingCycle,
          amount: price,
        }
      );

      const { order_id, key_id, amount, currency } = checkoutRes.data.data;

      const razorpayKey = key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Razorpay key is not configured. Please contact administrator.");
      }

      // 2. Launch Razorpay popup
      await openRazorpayCheckout({
        key: razorpayKey,
        amount: Math.round(amount * 100),
        currency: currency || "INR",
        name: "Brandspyre CRM",
        description: `${activePlan.plan_name || activePlan.name} Subscription Upgrade`,
        order_id,
        prefill: {
          name: tenant.company_name || tenant.name,
        },
        theme: {
          color: "#dc2626",
        },
        handler: async (response) => {
          try {
            setLoading(true);
            await apiClient.post(
              `/saas/subscription/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tenantId: tenant.id || tenant._id,
                planId: activePlan._id || activePlan.id || activePlan.plan_code,
                billingCycle,
                amount: price,
              }
            );

            toast.success("Subscription upgraded successfully with Razorpay!");
            onSuccess();
          } catch (err: any) {
            toast.error(err.response?.data?.error || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment modal cancelled");
          },
        },
      });
    } catch (err: any) {
      console.error("Upgrade error:", err);
      toast.error(err.response?.data?.error || "Failed to initialize payment");
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-800 text-sm">
        <p className="font-medium text-red-900 dark:text-red-300">
          Upgrading Organization: <span className="font-bold">{tenant?.company_name || tenant?.name}</span>
        </p>
        <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
          Current Plan: <span className="capitalize">{tenant?.subscription_plan || "Free"}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Select Subscription Plan
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map((p: any) => {
            const pId = p._id || p.id || p.plan_code;
            const isSelected = selectedPlanId === pId;
            return (
              <div
                key={pId}
                onClick={() => setSelectedPlanId(pId)}
                className={`cursor-pointer p-3 rounded-xl border transition-all text-center ${
                  isSelected
                    ? "border-red-600 bg-red-50/50 dark:bg-red-900/20 ring-2 ring-red-500"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{p.plan_name}</p>
                <p className="text-red-600 dark:text-red-400 font-bold text-lg mt-1">
                  ₹{billingCycle === "yearly" ? (p.price_yearly || p.price_monthly * 10) : p.price_monthly}
                </p>
                <p className="text-xs text-gray-500">{billingCycle === "yearly" ? "/year" : "/month"}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-xl">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Interval</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              billingCycle === "monthly"
                ? "bg-red-600 text-white shadow"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              billingCycle === "yearly"
                ? "bg-red-600 text-white shadow"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            Yearly (Save ~20%)
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleProceedToRazorpay}
          disabled={loading}
          className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Opening Razorpay...
            </span>
          ) : (
            "Pay with Razorpay"
          )}
        </button>
      </div>
    </div>
  );
};

export default TenantManager;

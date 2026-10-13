import React, { useEffect, useState } from 'react';
import { apiClient } from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import FormModal from 'src/component/ui/FormModal';
import { Plus, Edit, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'RETAIL_PACKAGE' | 'BUSINESS_SERVICES_PACKAGE'>('ALL');



  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/v1/platform-admin/plans`);
      if (res.data?.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (plan: any) => {
    setEditingPlan({
      ...plan,
      commercial_category: plan.commercial_category || 'RETAIL_PACKAGE',
      monthly_price_type: plan.monthly_price_type || 'FIXED',
      yearly_price_type: plan.yearly_price_type || 'FIXED',
      users_limit_type: plan.users_limit_type || 'FIXED',
      branches_limit_type: plan.branches_limit_type || 'FIXED',
      is_active: plan.is_active !== undefined ? plan.is_active : true,
      is_public: plan.is_public !== undefined ? plan.is_public : true,
      description: plan.description || '',
      badge_label: plan.badge_label || '',
      sort_order: plan.sort_order !== undefined ? plan.sort_order : 0,
      price_quarterly: plan.price_quarterly || 0,
      max_storage_gb: plan.max_storage_gb || 5,
      max_leads: plan.max_leads || 1000
    });
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      if (editingPlan._id) {
        await apiClient.put(`/v1/platform-admin/plans/${editingPlan._id}`, editingPlan);
      } else {
        await apiClient.post(`/v1/platform-admin/plans`, editingPlan);
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err) {
      alert('Failed to save subscription plan.');
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (activeCategory === 'ALL') return true;
    return p.commercial_category === activeCategory;
  });

  const retailPlans = filteredPlans.filter(p => (p.commercial_category || 'RETAIL_PACKAGE') === 'RETAIL_PACKAGE');
  const bizServicesPlans = filteredPlans.filter(p => p.commercial_category === 'BUSINESS_SERVICES_PACKAGE');

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Commercial Subscription Plans...</div>;
  }

  const renderPlanCard = (p: any, isBiz: boolean = false) => (
    <div
      key={p._id || p.plan_code}
      className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border ${
        p.is_public === false
          ? 'border-dashed border-amber-300 dark:border-amber-800'
          : 'border-slate-200 dark:border-slate-800'
      } shadow-sm space-y-4 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={`font-mono text-[11px] font-bold ${isBiz ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'} uppercase truncate`}>
            {p.plan_code}
          </span>
          <div className="flex items-center gap-1">
            {p.is_public === false ? (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                <EyeOff className="w-2.5 h-2.5" /> PRIVATE
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                <Eye className="w-2.5 h-2.5" /> PUBLIC
              </span>
            )}
            <CrmBadge label={p.is_active ? 'ACTIVE' : 'DISABLED'} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">{p.plan_name}</h3>
          {p.badge_label && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded">
              {p.badge_label}
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-500 mt-1 min-h-[32px] line-clamp-2">
          {p.description || (isBiz ? 'Corporate & B2B service tier.' : 'Commercial retail store tier.')}
        </p>

        <div className="mt-3">
          <span className="text-xs text-slate-500 mr-1">{p.monthly_price_type === 'STARTING_FROM' ? 'From ' : ''}</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹{(p.price_monthly || 0).toLocaleString('en-IN')}</span>
          <span className="text-xs text-slate-500"> / month</span>
        </div>
        <div className="text-[11px] text-slate-500 font-semibold mt-1">
          Yearly: {p.yearly_price_type === 'STARTING_FROM' ? 'From ' : ''}₹{(p.price_yearly || 0).toLocaleString('en-IN')}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <div>• Staff Users: <span className="font-bold text-slate-900 dark:text-white">{p.users_limit_type === 'CUSTOM' ? `${p.max_users}+ (Custom)` : p.users_limit_type === 'UNLIMITED' ? 'Unlimited' : p.max_users}</span></div>
          <div>• Branch Limit: <span className="font-bold text-slate-900 dark:text-white">{p.branches_limit_type === 'CUSTOM' ? 'Custom' : p.branches_limit_type === 'UNLIMITED' ? 'Unlimited' : p.max_branches}</span></div>
          <div>• Storage: <span className="font-bold text-slate-900 dark:text-white">{p.max_storage_gb || 5} GB</span></div>
          <div>• Active Leads: <span className="font-bold text-slate-900 dark:text-white">{(p.max_leads || 0).toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      <button
        onClick={() => handleOpenEdit(p)}
        className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition mt-4"
      >
        <Edit className="w-3.5 h-3.5" /> Edit Plan
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100">
      {/* Standard Page Header */}
      <PageHeader
        title="Subscription Tier & Industry Plans"
        description="Configure Retail and Business & Services commercial base plans, prices, limits, and public marketing visibility."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPlans}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Plans
            </button>
            <button
              onClick={() => {
                setEditingPlan({
                  plan_code: 'custom_tier',
                  plan_name: 'Custom Tier',
                  commercial_category: 'RETAIL_PACKAGE',
                  monthly_price_type: 'FIXED',
                  yearly_price_type: 'FIXED',
                  users_limit_type: 'FIXED',
                  branches_limit_type: 'FIXED',
                  price_monthly: 999,
                  price_quarterly: 2697,
                  price_yearly: 9990,
                  max_users: 10,
                  max_branches: 2,
                  max_storage_gb: 10,
                  max_leads: 2000,
                  description: 'Comprehensive business tier for expanding teams.',
                  badge_label: '',
                  sort_order: 50,
                  is_active: true,
                  is_public: true
                });
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Create Commercial Plan
            </button>
          </div>
        }
      />

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
        {[
          { key: 'ALL', label: 'All Packages' },
          { key: 'RETAIL_PACKAGE', label: 'Retail Package' },
          { key: 'BUSINESS_SERVICES_PACKAGE', label: 'Business & Services Package' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key as any)}
            className={`pb-3 px-1 border-b-2 transition ${
              activeCategory === tab.key
                ? 'border-red-600 text-red-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RETAIL PACKAGE SECTION */}
      {(activeCategory === 'ALL' || activeCategory === 'RETAIL_PACKAGE') && retailPlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Retail Package Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {retailPlans.map((p) => renderPlanCard(p, false))}
          </div>
        </div>
      )}

      {/* BUSINESS & SERVICES PACKAGE SECTION */}
      {(activeCategory === 'ALL' || activeCategory === 'BUSINESS_SERVICES_PACKAGE') && bizServicesPlans.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Business & Services Package Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {bizServicesPlans.map((p) => renderPlanCard(p, true))}
          </div>
        </div>
      )}

      {/* Plan Edit Modal */}
      {modalOpen && editingPlan && (
        <FormModal
          isVisible={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingPlan._id ? "Edit Commercial Subscription Plan" : "Create Commercial Subscription Plan"}
          subtitle="Set package category, pricing rates, quota limits, and public marketing visibility."
          onSubmit={handleSavePlan}
          submitLabel="Save Plan"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Commercial Package & Code */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Commercial Package</label>
                <select
                  value={editingPlan.commercial_category}
                  onChange={(e) => setEditingPlan({ ...editingPlan, commercial_category: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                >
                  <option value="RETAIL_PACKAGE">Retail Package</option>
                  <option value="BUSINESS_SERVICES_PACKAGE">Business & Services Package</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Code (Unique)</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingPlan._id)}
                  value={editingPlan.plan_code}
                  onChange={(e) => setEditingPlan({ ...editingPlan, plan_code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600 disabled:opacity-60"
                  placeholder="e.g. premium_plus"
                />
              </div>
            </div>

            {/* Name, Badge, Sort Order */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editingPlan.plan_name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, plan_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                  placeholder="e.g. Professional"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Badge Label</label>
                <input
                  type="text"
                  value={editingPlan.badge_label || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, badge_label: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                  placeholder="e.g. Popular, Best Value"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={editingPlan.sort_order || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan, sort_order: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Marketing Description</label>
              <textarea
                rows={2}
                value={editingPlan.description || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                placeholder="Brief summary of who this plan is designed for."
              />
            </div>

            {/* Pricing Controls (Monthly, Quarterly, Yearly) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Price (₹)</label>
                <div className="space-y-1.5">
                  <input
                    type="number"
                    required
                    value={editingPlan.price_monthly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-900 dark:text-white outline-none focus:border-red-600"
                  />
                  <select
                    value={editingPlan.monthly_price_type}
                    onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price_type: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white outline-none"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="STARTING_FROM">Starting From</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Quarterly Price (₹)</label>
                <div className="space-y-1.5">
                  <input
                    type="number"
                    value={editingPlan.price_quarterly || 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_quarterly: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-900 dark:text-white outline-none focus:border-red-600"
                  />
                  <div className="text-[10px] text-slate-400 py-1 text-center">Billed every 3 months</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Yearly Price (₹)</label>
                <div className="space-y-1.5">
                  <input
                    type="number"
                    required
                    value={editingPlan.price_yearly}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_yearly: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-extrabold text-slate-900 dark:text-white outline-none focus:border-red-600"
                  />
                  <select
                    value={editingPlan.yearly_price_type}
                    onChange={(e) => setEditingPlan({ ...editingPlan, yearly_price_type: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white outline-none"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="STARTING_FROM">Starting From</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quota Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Users Quota & Type</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingPlan.max_users}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_users: Number(e.target.value) })}
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                  />
                  <select
                    value={editingPlan.users_limit_type}
                    onChange={(e) => setEditingPlan({ ...editingPlan, users_limit_type: e.target.value })}
                    className="w-28 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="CUSTOM">Custom (+)</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branches Quota & Type</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingPlan.max_branches}
                    onChange={(e) => setEditingPlan({ ...editingPlan, max_branches: Number(e.target.value) })}
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                  />
                  <select
                    value={editingPlan.branches_limit_type}
                    onChange={(e) => setEditingPlan({ ...editingPlan, branches_limit_type: e.target.value })}
                    className="w-28 px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="CUSTOM">Custom</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Storage & Leads */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cloud Storage (GB)</label>
                <input
                  type="number"
                  value={editingPlan.max_storage_gb || 5}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_storage_gb: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Active Leads Allowance</label>
                <input
                  type="number"
                  value={editingPlan.max_leads || 1000}
                  onChange={(e) => setEditingPlan({ ...editingPlan, max_leads: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-red-600"
                />
              </div>
            </div>

            {/* Visibility & Active Toggles */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingPlan.is_public !== false}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_public: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Show on Public Pricing (/pricing)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingPlan.is_active !== false}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Active Plan Status
                </span>
              </label>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}

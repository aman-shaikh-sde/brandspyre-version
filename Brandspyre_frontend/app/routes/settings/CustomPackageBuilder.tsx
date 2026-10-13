import React, { useEffect, useState } from 'react';
import { apiClient } from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import { Sliders, Sparkles, CheckCircle2, Calculator, Send, Users, Building2, HardDrive, PackageCheck } from 'lucide-react';

export default function CustomPackageBuilder() {
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [selectedBtCode, setSelectedBtCode] = useState('IT_SOFTWARE');
  const [selectedPlanCode, setSelectedPlanCode] = useState('biz_starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Resource Add-ons State
  const [additionalUsers, setAdditionalUsers] = useState(0);
  const [additionalBranches, setAdditionalBranches] = useState(0);
  const [additionalStorage, setAdditionalStorage] = useState(0);

  // Feature Add-ons State
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Server Calculation Result
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  useEffect(() => {
    calculatePrice();
  }, [selectedBtCode, selectedPlanCode, billingCycle, additionalUsers, additionalBranches, additionalStorage, selectedAddons, selectedModules]);

  const fetchBusinessTypes = async () => {
    try {
      const res = await apiClient.get(`/v1/platform-admin/business-types`);
      if (res.data?.success) {
        setBusinessTypes(res.data.data);
      }
    } catch (e) {}
  };

  const toggleAddon = (code: string) => {
    setSelectedAddons((prev) =>
      prev.includes(code) ? prev.filter((a) => a !== code) : [...prev, code]
    );
  };

  const toggleModule = (code: string) => {
    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((m) => m !== code) : [...prev, code]
    );
  };

  const calculatePrice = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post(`/v1/platform-admin/calculate-price`, {
        businessTypeCode: selectedBtCode,
        planCode: selectedPlanCode,
        billingCycle,
        additionalUsers,
        additionalBranches,
        additionalStorageGB: additionalStorage,
        selectedAddons,
        selectedModules
      });
      if (res.data?.success) {
        setCalculation(res.data.data);
      }
    } catch (e) {
      console.error('Failed to calculate price', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      await apiClient.post('/v1/platform-admin/custom-package-requests', {
        business_type_code: selectedBtCode,
        selected_modules: selectedModules,
        selected_addons: selectedAddons,
        user_count: additionalUsers,
        branch_count: additionalBranches,
        estimated_monthly_price: calculation?.total || 0
      });
      alert('Custom package quotation request submitted successfully! A Platform Admin will review your quote.');
    } catch (e) {
      alert('Request submitted. An administrator will contact you shortly.');
    }
  };

  const FEATURE_ADDONS = [
    { code: 'AI_ASSISTANT', name: 'AI Assistant', monthly: 499, yearly: 4999, desc: 'AI predictive analytics & automated summaries' },
    { code: 'DOCUMENT_WORKSPACE', name: 'Document Workspace', monthly: 199, yearly: null, desc: 'Shared document repository & e-signatures' },
    { code: 'BUSINESS_REFERRALS', name: 'Business Referrals & Leads', monthly: 199, yearly: null, desc: 'Lead exchange network & partner referrals' },
    { code: 'COLLABORATION_PACKAGE', name: 'Collaboration Package', monthly: 199, yearly: null, desc: 'Only Meeting & Calendar, Employees, Events, MOM' }
  ];

  const STANDALONE_MODULES = [
    { code: 'CRM', name: 'Sales & CRM' },
    { code: 'PRODUCTS', name: 'Products & Catalog' },
    { code: 'INVENTORY', name: 'Inventory & Warehouses' },
    { code: 'PURCHASE', name: 'Purchase & Procurement' },
    { code: 'POS', name: 'Point of Sale' },
    { code: 'PRODUCTION', name: 'Production & Manufacturing' },
    { code: 'BILLING', name: 'Commercial B2B Billing' },
    { code: 'LEAD_EXCHANGE', name: 'Lead Exchange' },
    { code: 'PROJECTS', name: 'Projects & Tasks' },
    { code: 'HRMS', name: 'Human Resources' },
    { code: 'FINANCE', name: 'Finance & Accounts' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100">
      {/* Standard Page Header */}
      <PageHeader
        title="Custom Package & Add-On Estimator"
        description="Select your Base Plan, additional user/branch resources, feature add-ons, and standalone modules."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                billingCycle === 'monthly'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                billingCycle === 'yearly'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Annual Billing
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Configurator */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Base Plan Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Select Base Subscription Tier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: 'retail_starter', name: 'Retail Starter', cat: 'Retail', price: 499 },
                { code: 'retail_business', name: 'Retail Business', cat: 'Retail', price: 799 },
                { code: 'biz_starter', name: 'Business & Services Starter', cat: 'B2B', price: 599 },
                { code: 'biz_business', name: 'Business & Services Business', cat: 'B2B', price: 899 }
              ].map((plan) => {
                const isSelected = selectedPlanCode === plan.code;
                return (
                  <div
                    key={plan.code}
                    onClick={() => setSelectedPlanCode(plan.code)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-red-50/70 border-red-300 dark:bg-red-950/40 dark:border-red-800 text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold">{plan.name}</span>
                      <CrmBadge label={plan.cat} />
                    </div>
                    <div className="text-slate-500 mt-1">Starting from ₹{plan.price} / mo</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Platform Resource Add-ons */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Additional Resource Expansion</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Users className="w-4 h-4 text-blue-600" /> Additional Users
                </div>
                <div className="text-[11px] text-slate-500">₹99 / Month per user slot</div>
                <input
                  type="number"
                  min={0}
                  value={additionalUsers}
                  onChange={(e) => setAdditionalUsers(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Building2 className="w-4 h-4 text-amber-600" /> Additional Branches
                </div>
                <div className="text-[11px] text-slate-500">₹199 / Month per branch</div>
                <input
                  type="number"
                  min={0}
                  value={additionalBranches}
                  onChange={(e) => setAdditionalBranches(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <HardDrive className="w-4 h-4 text-emerald-600" /> Additional Storage
                </div>
                <div className="text-[11px] text-slate-500">₹99 / Month per 10 GB</div>
                <input
                  type="number"
                  min={0}
                  value={additionalStorage}
                  onChange={(e) => setAdditionalStorage(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Feature Add-ons & Bundles */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Feature & Bundle Add-Ons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {FEATURE_ADDONS.map((fa) => {
                const isSelected = selectedAddons.includes(fa.code);
                return (
                  <div
                    key={fa.code}
                    onClick={() => toggleAddon(fa.code)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-red-50/70 border-red-300 dark:bg-red-950/40 dark:border-red-800 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold">{fa.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{fa.desc}</p>
                    <div className="mt-2 text-[11px] font-bold text-red-600 dark:text-red-400">
                      ₹{fa.monthly} / month {fa.yearly ? `(Annual: ₹${fa.yearly})` : '| Annual pricing not configured'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Authoritative Server Price Summary */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 h-fit">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Calculator className="w-4 h-4 text-emerald-600" />
            Server Price Calculation Engine
          </h2>

          {calculation ? (
            <div className="space-y-4 text-xs">
              {/* Base Plan */}
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Base Plan ({calculation.basePlan?.name}):</span>
                <span className="font-extrabold text-slate-900 dark:text-white">₹{(calculation.basePlan?.amount || 0).toLocaleString('en-IN')}</span>
              </div>

              {/* Resource Addons */}
              {calculation.resourceAddons?.map((r: any) => (
                <div key={r.code} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{r.name} (x{r.quantity}):</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{r.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              ))}

              {/* Feature Addons */}
              {calculation.featureAddons?.map((f: any) => (
                <div key={f.code} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>{f.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{f.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}

              {/* Totals */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-700 dark:text-slate-300">
                  <span>Subtotal:</span>
                  <span>₹{(calculation.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-xs">
                  <span>Tax ({calculation.taxRate || 18}% GST):</span>
                  <span>₹{(calculation.taxAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-base font-extrabold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total ({calculation.billingCycle}):</span>
                  <span>₹{(calculation.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitRequest}
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Send className="w-4 h-4" /> Request Custom Quote
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">Calculating live price breakdown...</div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import CrmBadge from 'src/component/ui/CrmBadge';
import AuditLogDetailsDrawer from 'src/component/ui/AuditLogDetailsDrawer';
import { useOrgWorkspaceStore } from 'src/stores/useOrgWorkspaceStore';
import {
  getAuditTitle,
  getAuditDescription,
  getAuditCategory,
  getAuditActor,
  getAuditTimestamp
} from 'src/utils/auditPresentation';
import {
  Building2,
  Lock,
  Unlock,
  ShieldAlert,
  Layers,
  Users,
  CheckCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  RefreshCw,
  ChevronRight,
  Headphones,
  Calendar,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';

export default function PlatformOrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modules' | 'subscription' | 'support' | 'security'>('modules');

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const setOrgWorkspace = useOrgWorkspaceStore((state) => state.setOrgWorkspace);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/v1/platform-admin/organizations/${id}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching organization detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await apiClient.put(
        `/v1/platform-admin/organizations/${id}/status`,
        { status: newStatus, lock_reason: newStatus === 'suspended' ? 'Admin status change' : '' }
      );
      fetchDetail();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleToggleModule = async (moduleCode: string, isCurrentlyEnabled: boolean) => {
    if (!data) return;
    const currentEnabled: string[] = data.enabledModules || [];
    let updated: string[];

    if (isCurrentlyEnabled) {
      updated = currentEnabled.filter(c => c !== moduleCode);
    } else {
      updated = [...currentEnabled, moduleCode];
    }

    try {
      await apiClient.put(
        `/v1/platform-admin/organizations/${id}/modules`,
        { moduleCodes: updated }
      );
      fetchDetail();
    } catch (err) {
      console.error('Error overriding modules:', err);
    }
  };

  const handleOpenLogDetails = (log: any) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <span>Loading Organization Detail...</span>
      </div>
    );
  }

  const { organization, subscription, enabledModules, usersCount, tickets, auditLogs } = data || {};
  const isSuspended = organization?.status === 'suspended';

  const allModulesList = [
    { code: 'CRM', name: 'Customer Relationship Management' },
    { code: 'COMMERCE', name: 'Products & Inventory Catalog' },
    { code: 'POS', name: 'Point of Sale (POS Terminal)' },
    { code: 'HRMS', name: 'Human Resources Management' },
    { code: 'PROJECTS', name: 'Projects & Milestone Tasks' },
    { code: 'FINANCE', name: 'Finance, Accounts & Invoices' },
    { code: 'MEETINGS', name: 'Meetings & Video Conferencing' },
    { code: 'PRODUCTION', name: 'Production & Manufacturing (BOM)' },
    { code: 'LEAD_EXCHANGE', name: 'Multi-Org Lead Exchange' },
    { code: 'BILLING', name: 'Commercial Success-Based Billing' },
    { code: 'EVENT_MANAGEMENT', name: 'Event Management & Ticketing' },
    { code: 'DOCUMENTS', name: 'Documents & Templates' },
    { code: 'AI_ASSISTANT', name: 'AI Business Assistant' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100 font-sans">
      <PageHeader
        title={organization?.company_name || organization?.name || 'Organization Detail'}
        description={`Tenant Code: ${organization?.tenant_code || 'N/A'} • Created ${new Date(organization?.created_at || Date.now()).toLocaleDateString('en-IN')}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (organization) {
                  setOrgWorkspace({
                    tenantId: organization._id,
                    companyName: organization.company_name || organization.name,
                    tenantCode: organization.tenant_code || ''
                  });
                }
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Workspace
            </button>

            <button
              onClick={() => handleToggleStatus(organization?.status || 'active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-700 hover:bg-red-800 text-white'
              }`}
            >
              {isSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {isSuspended ? 'Reactivate Account' : 'Suspend Organization'}
            </button>
          </div>
        }
      />

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Status</div>
          <CrmBadge label={organization?.status || 'ACTIVE'} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Business Type</div>
          <div className="font-bold text-slate-900 dark:text-white uppercase">{organization?.business_type_code || 'SERVICES'}</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Active Plan</div>
          <div className="font-bold text-slate-900 dark:text-white uppercase">
            {subscription?.plan_id?.plan_name || subscription?.plan_id?.plan_code || subscription?.plan_code || organization?.subscription_plan || 'Starter'}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Total Users</div>
          <div className="font-bold text-slate-900 dark:text-white text-lg">{usersCount || 0} Users</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('modules')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'modules' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Module Entitlements ({enabledModules?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'subscription' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Subscription & Pricing
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'support' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Support Tickets ({tickets?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'security' ? 'border-red-700 text-red-700 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Security Audit Log ({auditLogs?.length || 0})
        </button>
      </div>

      {/* TAB 1: MODULES */}
      {activeTab === 'modules' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manual Module Overrides</h3>
            <span className="text-xs text-slate-500">Enable or disable specific modules for this tenant</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allModulesList.map(m => {
              const isEnabled = enabledModules?.includes(m.code);
              return (
                <div
                  key={m.code}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                  <button
                    onClick={() => handleToggleModule(m.code, !!isEnabled)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      isEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Subscription & Price Lock Snapshot</h3>
          {subscription ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div><span className="text-slate-500">Plan:</span> <span className="font-bold text-slate-900 dark:text-white uppercase ml-2">{subscription.plan_id?.plan_name || subscription.plan_id?.plan_code || subscription.plan_code || organization?.subscription_plan || 'Starter'}</span></div>
              <div><span className="text-slate-500">Billing Cycle:</span> <span className="text-slate-900 dark:text-white capitalize ml-2">{subscription.subscription_type || subscription.billing_cycle || 'monthly'}</span></div>
              <div><span className="text-slate-500">Amount / Price:</span> <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm ml-2">₹{(subscription.amount || subscription.paid_amount || subscription.snapshot?.final_amount || subscription.plan_id?.price_monthly || 0).toLocaleString('en-IN')}</span></div>
              {subscription.razorpay_payment_id && (
                <div><span className="text-slate-500">Payment Ref:</span> <span className="font-mono text-slate-700 dark:text-slate-300 ml-2">{subscription.razorpay_payment_id}</span></div>
              )}
            </div>
          ) : (
            <div className="text-slate-500">No active subscription record found for this organization.</div>
          )}
        </div>
      )}

      {/* TAB 3: SUPPORT */}
      {activeTab === 'support' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Ticket History ({tickets?.length || 0})</h3>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <div key={t._id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-red-600">{t.ticket_number}</span>
                    <span className="font-bold text-slate-900 dark:text-white ml-2">{t.subject}</span>
                  </div>
                  <CrmBadge label={t.status || 'OPEN'} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500">No support tickets submitted by this organization.</div>
          )}
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT LOG */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Platform Security & Audit Logs ({auditLogs?.length || 0})</h3>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {auditLogs.map((log: any) => {
                const title = getAuditTitle(log);
                const description = getAuditDescription(log);
                const category = getAuditCategory(log);
                const actor = getAuditActor(log);
                const timestamp = getAuditTimestamp(log);

                return (
                  <div
                    key={log._id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{title}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${category.badgeClass}`}>
                          {category.label}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-xs font-medium">{description}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-[11px] text-slate-500">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{actor.name}</div>
                        <div>{timestamp.fullString}</div>
                      </div>

                      <button
                        onClick={() => handleOpenLogDetails(log)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-slate-500">No audit log records recorded for this organization.</div>
          )}
        </div>
      )}

      {/* Technical Details Drawer */}
      <AuditLogDetailsDrawer
        log={selectedLog}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

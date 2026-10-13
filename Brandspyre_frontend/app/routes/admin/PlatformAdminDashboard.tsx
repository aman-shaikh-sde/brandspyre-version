import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
import KPICard from 'src/component/ui/KPICard';
import CrmBadge from 'src/component/ui/CrmBadge';
import AuditLogDetailsDrawer from 'src/component/ui/AuditLogDetailsDrawer';
import {
  getAuditTitle,
  getAuditDescription,
  getAuditCategory,
  getAuditActor,
  getAuditEntity,
  getAuditTimestamp
} from 'src/utils/auditPresentation';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Headphones,
  Sliders,
  Layers,
  ShieldCheck,
  Users,
  Activity,
  ArrowUpRight,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export default function PlatformAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/platform-admin/dashboard-stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogDetails = (log: any) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <span>Loading Executive Platform Telemetry...</span>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const orgs = stats?.organizations || {};
  const subs = stats?.subscriptions || {};
  const openTickets = stats?.openSupportTickets ?? stats?.support?.open ?? 0;
  const recentOrgs = stats?.recentOrganizations || [];
  const logs = stats?.auditTrail || stats?.recentActivity || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100 font-sans">
      {/* Standard Page Header */}
      <PageHeader
        title="Platform Administration"
        description="Executive telemetry, multi-tenant monitoring, commercial pricing metrics, and security audit logs."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardStats}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <Link
              to="/admin/organizations"
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Manage Organizations
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Organizations"
          value={metrics.totalTenants ?? orgs.total ?? 0}
          subtext={`${metrics.activeTenants ?? orgs.active ?? 0} Active • ${metrics.trialTenants ?? orgs.trial ?? 0} Trial`}
          icon={<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        />

        <KPICard
          title="Monthly Revenue (MRR)"
          value={`₹${(metrics.mrr ?? subs.mrr ?? 0).toLocaleString('en-IN')}`}
          subtext={`ARR: ₹${(metrics.arr ?? subs.arr ?? 0).toLocaleString('en-IN')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />

        <KPICard
          title="Open Support Tickets"
          value={openTickets}
          subtext="Customer query queue"
          icon={<Headphones className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        />

        <KPICard
          title="Audit Trail Logs"
          value={logs.length}
          subtext="Security & platform events"
          icon={<ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        />
      </div>

      {/* Two-Column Grid: Recent Orgs & Security Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Organizations */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Recent Organizations
            </h3>
            <Link to="/admin/organizations" className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentOrgs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No recent organizations registered yet.</div>
            ) : (
              recentOrgs.map((org: any) => (
                <div
                  key={org._id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{org.name || org.company_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{org.tenant_code || org.slug || org._id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CrmBadge label={org.status || 'ACTIVE'} />
                    <Link to={`/admin/organizations/${org._id}`} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Platform Audit Trail Card (Redesigned Human Readable Layout) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Security & Audit Trail
            </h3>
            <Link to="/admin/audit-logs" className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1">
              Full Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">No platform audit logs recorded yet.</div>
            ) : (
              logs.map((log: any) => {
                const title = getAuditTitle(log);
                const description = getAuditDescription(log);
                const category = getAuditCategory(log);
                const actor = getAuditActor(log);
                const entity = getAuditEntity(log);
                const timestamp = getAuditTimestamp(log);

                return (
                  <div
                    key={log._id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Activity Header & Category Badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        {title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${category.badgeClass}`}>
                        {category.label}
                      </span>
                    </div>

                    {/* Organization / Entity Name & Human Description */}
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {entity.displayName}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        {description}
                      </div>
                    </div>

                    {/* Performed By, Timestamp & Action Link */}
                    <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 dark:border-slate-800/60 text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{actor.name}</span>
                        <span>{timestamp.timeString}</span>
                      </div>

                      <button
                        onClick={() => handleOpenLogDetails(log)}
                        className="font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        View Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Technical Details Drawer */}
      <AuditLogDetailsDrawer
        log={selectedLog}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}

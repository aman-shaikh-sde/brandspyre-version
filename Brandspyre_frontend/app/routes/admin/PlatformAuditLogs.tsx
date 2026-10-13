import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import PageHeader from 'src/component/ui/PageHeader';
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
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Building2,
  User,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function PlatformAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/platform-admin/dashboard-stats');
      if (res.data?.success) {
        setLogs(res.data.data?.auditTrail || res.data.data?.recentActivity || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogDetails = (log: any) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  // Filter logs by search query and category
  const filteredLogs = logs.filter((log: any) => {
    const title = getAuditTitle(log).toLowerCase();
    const desc = getAuditDescription(log).toLowerCase();
    const actor = getAuditActor(log).name.toLowerCase();
    const org = getAuditEntity(log).displayName.toLowerCase();
    const cat = getAuditCategory(log).category;

    const matchesSearch =
      !search ||
      title.includes(search.toLowerCase()) ||
      desc.includes(search.toLowerCase()) ||
      actor.includes(search.toLowerCase()) ||
      org.includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || cat === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-slate-900 dark:text-slate-100 font-sans">
      {/* Standard Page Header */}
      <PageHeader
        title="Security & Audit Logs"
        description="Comprehensive security audit trail, administrative activity, and multi-tenant access logs."
        actions={
          <button
            onClick={fetchAuditLogs}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by activity, organization, or user..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-red-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {['ALL', 'UPDATE', 'CREATE', 'DELETE', 'LOGIN', 'SECURITY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-red-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading Security & Audit Trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-slate-500 font-semibold text-xs">No matching audit logs found.</div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800 font-bold tracking-wider">
                <th className="p-4">Time</th>
                <th className="p-4">Activity</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Performed By</th>
                <th className="p-4">Category</th>
                <th className="p-4">Result</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map((log: any) => {
                const title = getAuditTitle(log);
                const category = getAuditCategory(log);
                const actor = getAuditActor(log);
                const entity = getAuditEntity(log);
                const timestamp = getAuditTimestamp(log);

                return (
                  <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    {/* Time */}
                    <td className="p-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{timestamp.timeString}</div>
                      <div className="text-[11px]">{timestamp.dateString}</div>
                    </td>

                    {/* Activity */}
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {title}
                    </td>

                    {/* Organization */}
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      {entity.displayName}
                    </td>

                    {/* Performed By */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{actor.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{actor.role}</div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${category.badgeClass}`}>
                        {category.label}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenLogDetails(log)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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

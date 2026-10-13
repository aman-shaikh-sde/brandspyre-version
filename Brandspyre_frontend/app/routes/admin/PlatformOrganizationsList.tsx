import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import apiClient from "src/services/apiClient";
import { useOrgWorkspaceStore } from 'src/stores/useOrgWorkspaceStore';
import {
  Search,
  Building2,
  Filter,
  Eye,
  Lock,
  Unlock,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function PlatformOrganizationsList() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const navigate = useNavigate();
  const enterWorkspace = useOrgWorkspaceStore((s) => s.enterWorkspace);

  useEffect(() => {
    fetchOrganizations();
  }, [page, statusFilter]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/v1/platform-admin/organizations', {
        params: { search, status: statusFilter, page, limit: 15 }
      });
      if (res.data?.success) {
        setOrganizations(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error loading organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrganizations();
  };

  const handleEnterWorkspace = (org: any) => {
    enterWorkspace({
      tenantId: org._id,
      companyName: org.company_name || org.name,
      slug: org.domain || org.slug
    });
    navigate('/');
  };

  const handleStatusChange = async (orgId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const reason = prompt(`Reason for setting status to '${newStatus}':`, 'Admin status change');
    if (reason === null) return;

    try {
      await apiClient.put(`/v1/platform-admin/organizations/${orgId}/status`, {
        status: newStatus,
        lock_reason: reason
      });
      fetchOrganizations();
    } catch (err) {
      alert('Failed to update organization status');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            SaaS Organization Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage all tenant organizations, subscriptions, module overrides, and account statuses.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-600 w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow-sm"
          >
            Search
          </button>
        </form>
      </div>

      {/* Organizations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                <th className="p-4">Organization</th>
                <th className="p-4">Industry</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Users</th>
                <th className="p-4">Modules</th>
                <th className="p-4">MRR</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    Loading organizations...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No organizations found matching criteria.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => {
                  const status = org.subscriptionStatus || org.status;
                  return (
                    <tr key={org._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{org.company_name || org.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{org.domain || org.subdomain || org._id}</div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{org.industry || 'General'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                          {org.subscriptionPlanName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : status === 'trial'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-bold">{org.userCount || 0}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-bold">{org.moduleCount || 0}</td>
                      <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">₹{(org.mrr || 0).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEnterWorkspace(org)}
                            className="px-2.5 py-1.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100 transition"
                            title="Enter Organization Workspace"
                          >
                            <ExternalLink className="w-3 h-3" /> Workspace
                          </button>

                          <Link
                            to={`/admin/organizations/${org._id}`}
                            className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleStatusChange(org._id, org.status)}
                            className={`p-1.5 rounded border ${
                              org.status === 'suspended'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title={org.status === 'suspended' ? 'Activate Organization' : 'Suspend Organization'}
                          >
                            {org.status === 'suspended' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Page {page} of {pagination.pages} ({pagination.total} total)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

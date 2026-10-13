import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import { notify } from '~/services/notificationService';
import CreateReferralModal from '../Referrals/CreateReferralModal';
import {
  Building2,
  Plus,
  Search,
  Shield,
  TrendingUp,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Layers,
  FileText,
  User
} from 'lucide-react';

export default function PlatformReferrals() {
  const [activeTab, setActiveTab] = useState<'OPPORTUNITIES' | 'REQUESTS'>('OPPORTUNITIES');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const [refRes, anaRes, reqRes] = await Promise.all([
        apiClient.get('/referrals/marketplace'),
        apiClient.get('/referrals/analytics'),
        apiClient.get('/referrals/admin/all-requests')
      ]);

      if (refRes.data?.success) setReferrals(refRes.data.data);
      if (anaRes.data?.success) setAnalytics(anaRes.data.data);
      if (reqRes.data?.success) setAllRequests(reqRes.data.data);
    } catch (err) {
      console.error('Error fetching platform referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminApproveRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      await apiClient.post(`/referrals/requests/${requestId}/approve`, {});
      notify.success('Request approved successfully!');
      fetchPlatformData();
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      await apiClient.post(`/referrals/requests/${requestId}/reject`, {
        rejectionReason: 'Declined by Platform Admin override.'
      });
      notify.info('Request declined by Platform Admin.');
      fetchPlatformData();
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] uppercase tracking-wider">
            Platform SuperAdmin Oversight
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Global Referral Network Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor network opportunities, track user requests across organizations, and publish platform referrals
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Post Platform Referral</span>
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Opportunities</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {analytics.totalReferrals}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] text-amber-600 font-bold uppercase">Active Requests</div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {allRequests.length}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] text-emerald-600 font-bold uppercase">Conversions</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {analytics.converted}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Deal Value</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              ₹{(analytics.totalDealValue || 0).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('OPPORTUNITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'OPPORTUNITIES'
              ? 'bg-red-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Layers size={14} />
          <span>Global Opportunities ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'REQUESTS'
              ? 'bg-red-700 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <UserCheck size={14} />
          <span>Requested Users & Orgs ({allRequests.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Global Opportunities */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <th className="p-4">Referral Code</th>
                  <th className="p-4">Title & Source</th>
                  <th className="p-4">Industry & Location</th>
                  <th className="p-4">Deal Value</th>
                  <th className="p-4">Fee</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      Loading global marketplace referrals...
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      No marketplace referrals found.
                    </td>
                  </tr>
                ) : (
                  referrals.map((ref) => (
                    <tr key={ref._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                        {ref.referral_code}
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{ref.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          {ref.source_type === 'PLATFORM' ? (
                            <>
                              <Shield size={12} className="text-purple-600" />
                              <span className="font-semibold text-purple-700 dark:text-purple-400">Platform</span>
                            </>
                          ) : (
                            <>
                              <Building2 size={12} className="text-slate-400" />
                              <span>{ref.source_tenant_id?.name || 'Organization'}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{ref.industry}</div>
                        <div className="text-[11px] text-slate-400">{ref.location}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        ₹{(ref.estimated_deal_value || 0).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(ref.referral_fee || ref.commission_value || 0).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ref.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Requested Users & Organizations Table */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
              All User Referral Requests Across Organizations
            </h2>
            <p className="text-[11px] text-slate-500">
              Platform Admin master list of requesting users, organizations, request messages, and approval actions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <th className="p-4">Requesting User</th>
                  <th className="p-4">Requesting Organization</th>
                  <th className="p-4">Target Opportunity</th>
                  <th className="p-4">Proposal Message</th>
                  <th className="p-4">Request Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Admin Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      Loading user requests...
                    </td>
                  </tr>
                ) : allRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No referral requests submitted across the platform yet.
                    </td>
                  </tr>
                ) : (
                  allRequests.map((req) => {
                    const u = req.requesting_user_id || {};
                    const tenant = req.requesting_tenant_id || {};
                    const ref = req.referral_id || {};

                    return (
                      <tr key={req._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        {/* Requesting User Info */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <User size={13} className="text-purple-600 shrink-0" />
                            <span>{u.firstname || 'User'} {u.lastname || ''}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 pl-4.5">{u.email || 'N/A'}</div>
                          {u.phonenumber && <div className="text-[10px] text-slate-400 font-mono pl-4.5">{u.phonenumber}</div>}
                        </td>

                        {/* Requesting Tenant */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span>{tenant.name || tenant.company_name || 'Organization'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono pl-4.5">Code: {tenant.tenant_code || 'N/A'}</div>
                        </td>

                        {/* Target Opportunity */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">{ref.title || 'Opportunity'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Code: {ref.referral_code || 'N/A'}</div>
                        </td>

                        {/* Proposal Message */}
                        <td className="p-4 max-w-xs">
                          <div className="text-slate-600 dark:text-slate-300 text-xs italic line-clamp-2">
                            "{req.message || 'No message attached.'}"
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-slate-500 text-[11px]">
                          {req.requested_at ? new Date(req.requested_at).toLocaleDateString('en-IN') : 'Recently'}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                              req.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        {/* Admin Action */}
                        <td className="p-4 text-right">
                          {req.status === 'REQUESTED' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleAdminRejectRequest(req._id)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 text-[11px] cursor-pointer"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleAdminApproveRequest(req._id)}
                                disabled={actionLoading}
                                className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateReferralModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchPlatformData}
      />
    </div>
  );
}

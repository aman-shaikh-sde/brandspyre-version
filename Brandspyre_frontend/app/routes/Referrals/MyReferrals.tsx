import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import { notify } from '~/services/notificationService';
import CreateReferralModal from './CreateReferralModal';
import {
  Building2,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Send,
  Eye,
  UserCheck,
  DollarSign,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function MyReferrals() {
  const [myReferrals, setMyReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Selected Referral Requests Drawer / Modal State
  const [activeReferral, setActiveReferral] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMyReferrals();
  }, []);

  const fetchMyReferrals = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/referrals/my');
      if (res.data?.success) {
        setMyReferrals(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching my referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      await apiClient.post(`/referrals/requests/${requestId}/approve`, {});
      notify.success('Request approved! Contact details unlocked for partner organization.');
      fetchMyReferrals();
      setActiveReferral(null);
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setActionLoading(true);
      await apiClient.post(`/referrals/requests/${requestId}/reject`, {
        rejectionReason: 'Declined by opportunity owner.'
      });
      notify.info('Request declined.');
      fetchMyReferrals();
      setActiveReferral(null);
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePublish = async (referralId: string) => {
    try {
      await apiClient.patch(`/referrals/${referralId}/publish`, {});
      notify.success('Referral status updated!');
      fetchMyReferrals();
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to update referral status.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-extrabold text-[10px] uppercase tracking-wider">
            My Published Opportunities
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Referrals Published by My Organization
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your network opportunities, review partner requests, and unlock contact access
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Publish New Opportunity</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold">
                <th className="p-4">Opportunity</th>
                <th className="p-4">Industry & Location</th>
                <th className="p-4">Deal Value</th>
                <th className="p-4">Referral Fee</th>
                <th className="p-4">Status</th>
                <th className="p-4">Requests</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    Loading your published referrals...
                  </td>
                </tr>
              ) : myReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    You have not published any referral opportunities yet. Click <strong>Publish New Opportunity</strong> to post one!
                  </td>
                </tr>
              ) : (
                myReferrals.map((ref) => (
                  <tr key={ref._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">{ref.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{ref.referral_code}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{ref.industry}</div>
                      <div className="text-[11px] text-slate-500">{ref.location}</div>
                    </td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-white">
                      ₹{(ref.estimated_deal_value || 0).toLocaleString()}
                    </td>
                    <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{(ref.referral_fee || ref.commission_value || 0).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          ref.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : ref.status === 'CONVERTED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {ref.request_count > 0 ? (
                        <button
                          onClick={() => setActiveReferral(ref)}
                          className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 rounded-full font-extrabold text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck size={12} /> {ref.request_count} Request(s)
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">0 requests</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleTogglePublish(ref._id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        {ref.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </button>
                      {ref.request_count > 0 && (
                        <button
                          onClick={() => setActiveReferral(ref)}
                          className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold hover:bg-red-800 transition shadow-xs cursor-pointer"
                        >
                          Review Requests
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Requests Drawer / Modal */}
      {activeReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Review Incoming Partner Requests
                </h3>
                <p className="text-slate-500">{activeReferral.title} ({activeReferral.referral_code})</p>
              </div>
              <button onClick={() => setActiveReferral(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeReferral.requests?.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-medium">No pending requests for this referral.</div>
              ) : (
                activeReferral.requests?.map((req: any) => (
                  <div
                    key={req._id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span>{req.requesting_tenant_id?.name || req.requesting_tenant_id?.company_name || 'Partner Org'}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-xs italic">
                      "{req.message || 'Interested in this opportunity.'}"
                    </p>

                    <div className="text-[10px] text-slate-400">
                      Requested by: {req.requesting_user_id?.firstname} {req.requesting_user_id?.lastname} ({req.requesting_user_id?.email})
                    </div>

                    {req.status === 'REQUESTED' && (
                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req._id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle size={14} /> Approve & Unlock Contact
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Referral Modal */}
      <CreateReferralModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMyReferrals}
      />
    </div>
  );
}

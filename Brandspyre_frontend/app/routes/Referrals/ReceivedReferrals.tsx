import React, { useEffect, useState } from 'react';
import { apiClient } from "src/services/apiClient";
import { notify } from '~/services/notificationService';
import {
  Building2,
  Lock,
  Unlock,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export default function ReceivedReferrals() {
  const [receivedReferrals, setReceivedReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchReceivedReferrals();
  }, []);

  const fetchReceivedReferrals = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/referrals/received`);
      if (res.data?.success) {
        setReceivedReferrals(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching received referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (referralId: string, newStatus: string) => {
    try {
      setStatusUpdating(true);
      await apiClient.patch(
        `/referrals/${referralId}/status`,
        { status: newStatus }
      );

      notify.success(`Referral status updated to ${newStatus}!`);
      if (newStatus === 'CONVERTED') {
        notify.success('Referral Converted! B2B Settlement Transaction generated in Ledger.');
      }
      fetchReceivedReferrals();
      setSelectedItem(null);
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to update referral status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider">
          Received Opportunities & Pipeline
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
          Assigned & Approved Referrals
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Work on assigned referral opportunities, track pipeline stages, and view unlocked client contacts
        </p>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium text-xs">
          Loading assigned referrals...
        </div>
      ) : receivedReferrals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <Building2 size={40} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Received Opportunities</h3>
          <p className="text-xs text-slate-500">
            You do not have any approved or assigned referral opportunities yet. Browse the <strong>Marketplace</strong> to request new deals!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receivedReferrals.map((item) => {
            const ref = item.referral || {};
            const contact = ref.contact_info || {};
            const isUnlocked = item.contact_access;

            return (
              <div
                key={item.participant_id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-extrabold text-[10px] uppercase flex items-center gap-1">
                      <Building2 size={12} /> Provider: {ref.source_tenant_id?.name || 'Network Partner'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        ref.status === 'CONVERTED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {ref.status}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
                      {ref.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ref.description}
                    </p>
                  </div>

                  {/* Deal Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Deal</div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                        ₹{(ref.estimated_deal_value || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">Commission</div>
                      <div className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                        ₹{(ref.referral_fee || ref.commission_value || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Unlocked Contact Details Box */}
                  <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                        <Unlock size={14} /> Unlocked Client Contact
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 uppercase font-extrabold">Authorized</span>
                    </div>

                    <div className="space-y-1 pt-1 text-slate-800 dark:text-slate-200 font-medium text-xs">
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-emerald-600" />
                        <span className="font-extrabold">{contact.name || 'N/A'}</span>
                        {contact.company_name && <span className="text-slate-400">({contact.company_name})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-emerald-600" />
                        <a href={`tel:${contact.phone}`} className="hover:underline font-mono">{contact.phone || 'N/A'}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-emerald-600" />
                        <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email || 'N/A'}</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Controls Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Update Stage</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CONVERTED', 'LOST'].map((stg) => (
                      <button
                        key={stg}
                        disabled={ref.status === stg || statusUpdating}
                        onClick={() => handleUpdateStatus(ref._id, stg)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                          ref.status === stg
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {stg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import apiClient from "src/services/apiClient";
import { notify } from '~/services/notificationService';
import CreateReferralModal from './CreateReferralModal';
import {
  Building2,
  Search,
  Filter,
  DollarSign,
  MapPin,
  Lock,
  Plus,
  Send,
  CheckCircle,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  Shield,
  Zap
} from 'lucide-react';

export default function ReferralMarketplace() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [leadQuality, setLeadQuality] = useState('');
  const [sourceType, setSourceType] = useState('');

  // Request Modal State
  const [requestModalRef, setRequestModalRef] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchMarketplace();
  }, [search, industry, leadQuality, sourceType]);

  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (industry) params.industry = industry;
      if (leadQuality) params.leadQuality = leadQuality;
      if (sourceType) params.sourceType = sourceType;

      const res = await apiClient.get('/referrals/marketplace', { params });

      if (res.data?.success) {
        setReferrals(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching marketplace referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!requestModalRef) return;
    try {
      setRequesting(true);
      await apiClient.post(`/referrals/${requestModalRef._id}/requests`, {
        message: requestMessage
      });

      notify.success('Referral request submitted successfully!');
      setRequestModalRef(null);
      setRequestMessage('');
      fetchMarketplace();
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to submit request.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-extrabold text-[10px] uppercase tracking-wider">
              B2B Business Marketplace
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Referral Network & Opportunities
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover verified business opportunities shared across the BrandSpyre partner network
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Publish Opportunity</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search industry, location, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="">All Industries</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="SERVICES">Business Services</option>
            <option value="RETAIL">Retail & Commerce</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="REAL_ESTATE">Real Estate</option>
            <option value="IT_SOFTWARE">IT & Software</option>
          </select>

          <select
            value={leadQuality}
            onChange={(e) => setLeadQuality(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="">All Quality Types</option>
            <option value="HOT">High Priority (Hot)</option>
            <option value="WARM">Medium Priority (Warm)</option>
            <option value="COLD">Low Priority (Cold)</option>
          </select>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="">All Sources</option>
            <option value="PLATFORM">Platform Verified</option>
            <option value="ORGANIZATION">Organization Shared</option>
          </select>
        </div>
      </div>

      {/* Referral Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium text-xs">
          <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading marketplace opportunities...
        </div>
      ) : referrals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <Building2 size={40} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Opportunities Found</h3>
          <p className="text-xs text-slate-500">
            There are currently no active referral opportunities matching your filters. Try resetting your search or publish an opportunity.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referrals.map((ref) => {
            const isPlatform = ref.source_type === 'PLATFORM';
            const orgName = isPlatform ? 'BrandSpyre Platform' : ref.source_tenant_id?.name || ref.source_tenant_id?.company_name || 'Verified Partner';
            const dealValue = (ref.estimated_deal_value || 0).toLocaleString('en-IN');
            const feeValue = (ref.referral_fee || ref.commission_value || 0).toLocaleString('en-IN');

            return (
              <div
                key={ref._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Top Badge & Source */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${
                        isPlatform
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {isPlatform ? (
                        <>
                          <Shield size={12} /> Platform Verified
                        </>
                      ) : (
                        <>
                          <Building2 size={12} /> {orgName}
                        </>
                      )}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                        ref.lead_quality === 'HOT'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      }`}
                    >
                      {ref.lead_quality === 'HOT' ? (
                        <>
                          <Flame size={12} className="text-red-600" /> Hot Deal
                        </>
                      ) : (
                        <>
                          <Zap size={12} className="text-amber-600" /> Warm Opportunity
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
                      {ref.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ref.description}
                    </p>
                  </div>

                  {/* Key Metadata Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Deal</div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">₹{dealValue}</div>
                    </div>
                    <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Referral Fee</div>
                      <div className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">₹{feeValue}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" /> {ref.industry}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" /> {ref.location}
                    </span>
                  </div>

                  {/* Masked Contact Security Lock Banner */}
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                      <Lock size={13} className="text-amber-600" />
                      <span>{ref.contact_info?.company_name || 'Protected Contact'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Locked</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Code: {ref.referral_code}</span>

                  {ref.has_requested ? (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Clock size={14} /> Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => setRequestModalRef(ref)}
                      className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Request Opportunity</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {requestModalRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Request Opportunity
              </h3>
              <button onClick={() => setRequestModalRef(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm">{requestModalRef.title}</div>
              <div className="text-slate-500">Value: ₹{(requestModalRef.estimatedDealValue || 0).toLocaleString()} • Fee: ₹{(requestModalRef.referralFee || 0).toLocaleString()}</div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Message to Opportunity Owner <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe your capabilities, location coverage, and why your team is best suited..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setRequestModalRef(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={requesting}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{requesting ? 'Submitting...' : 'Submit Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Referral Modal */}
      <CreateReferralModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMarketplace}
      />
    </div>
  );
}

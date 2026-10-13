import React, { useEffect, useState } from 'react';
import { apiClient } from "src/services/apiClient";
import {
  Users,
  Building2,
  Share2,
  TrendingUp,
  Award,
  CheckCircle,
  MapPin,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function PartnerNetwork() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartnerNetwork();
  }, []);

  const fetchPartnerNetwork = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/referrals/partners`);
      if (res.data?.success) {
        setPartners(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching partner network:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-extrabold text-[10px] uppercase tracking-wider">
          Cross-Organization Collaboration
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
          Partner Network & B2B Ecosystem
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of organizations collaborating with your business on shared referral opportunities
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium text-xs">
          Loading partner network...
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <Users size={40} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Partners Yet</h3>
          <p className="text-xs text-slate-500">
            Publish or request referral opportunities in the <strong>Marketplace</strong> to establish your first cross-organization referral relationship!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((item, idx) => {
            const p = item.partner_tenant || {};
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-extrabold text-base">
                    {p.name?.[0] || 'P'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {p.name || p.company_name}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">Code: {p.tenant_code || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Shared</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">{item.referrals_shared}</div>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Received</div>
                    <div className="font-extrabold text-slate-900 dark:text-white">{item.referrals_received}</div>
                  </div>
                  <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <div className="text-[10px] text-emerald-600 font-bold uppercase">Active</div>
                    <div className="font-extrabold text-emerald-700 dark:text-emerald-400">{item.active_deals}</div>
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

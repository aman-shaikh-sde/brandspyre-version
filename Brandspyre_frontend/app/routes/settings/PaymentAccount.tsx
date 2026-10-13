import { useState, useEffect } from "react";
import PageHeader from "src/component/ui/PageHeader";
import Modal from "src/component/Modal";
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Unplug, 
  CreditCard, 
  ShieldCheck, 
  Landmark, 
  Send, 
  ArrowRight,
  ExternalLink,
  Zap,
  Check,
  Globe
} from "lucide-react";
import { notify } from "~/services/notificationService";
import { organizationPaymentApi } from "src/services/organizationPaymentService";
import { Link } from "react-router-dom";

interface ProviderAccountDetails {
  account_id?: string;
  status: string;
  kyc_status?: string;
  onboarding_status?: string;
  payments_enabled?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  capabilities?: {
    route?: boolean;
    payouts?: boolean;
    transfers?: boolean | string;
    card_payments?: string;
  };
  activated_at?: string;
  onboarding_url?: string;
}

interface PaymentAccountData {
  _id?: string;
  default_provider: 'razorpay' | 'stripe';
  provider: 'razorpay' | 'stripe';
  account_status: string;
  business_name: string;
  business_type: string;
  legal_name?: string;
  email: string;
  phone?: string;
  bank_details?: {
    bank_name?: string;
    account_number_masked?: string;
    ifsc_code?: string;
    beneficiary_name?: string;
  };
  gstin?: string;
  pan?: string;
  payments_enabled: boolean;
  payouts_enabled: boolean;
  provider_account_id?: string;
  activated_at?: string;
  razorpay?: ProviderAccountDetails;
  stripe?: ProviderAccountDetails;
}

export default function PaymentAccount() {
  const [account, setAccount] = useState<PaymentAccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [onboardingProvider, setOnboardingProvider] = useState<'razorpay' | 'stripe' | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<'razorpay' | 'stripe' | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);

  const [form, setForm] = useState({
    business_name: "",
    business_type: "private_limited",
    legal_name: "",
    email: "",
    phone: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    beneficiary_name: "",
    gstin: "",
    pan: ""
  });

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const res = await organizationPaymentApi.getPaymentAccount();
      setAccount(res.data?.data || null);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAccount(); 
  }, []);

  const handleRazorpayOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.email) {
      notify.error("Business name and email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await organizationPaymentApi.onboardPaymentAccount({
        ...form,
        provider: 'razorpay'
      });
      setAccount(res.data?.data || null);
      notify.success("Razorpay Route account connected successfully!");
      setOnboardingProvider(null);
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Failed to connect Razorpay account.");
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    setSaving(true);
    try {
      const returnUrl = `${window.location.origin}/settings/payment-account?provider=stripe&status=success`;
      const refreshUrl = `${window.location.origin}/settings/payment-account?provider=stripe&status=refresh`;

      const res = await organizationPaymentApi.createOnboardingLink({
        provider: 'stripe',
        return_url: returnUrl,
        refresh_url: refreshUrl
      });

      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        window.open(url, '_blank');
        notify.success("Stripe Connect onboarding opened in a new tab.");
      } else {
        // Fallback: onboard basic Stripe profile
        const onboardRes = await organizationPaymentApi.onboardPaymentAccount({
          provider: 'stripe',
          business_name: account?.business_name || 'My Organization',
          email: account?.email || 'admin@organization.com'
        });
        setAccount(onboardRes.data?.data || null);
        notify.success("Stripe account initialized.");
      }
      setOnboardingProvider(null);
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Failed to start Stripe Connect onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async (provider?: 'razorpay' | 'stripe') => {
    try {
      const res = await organizationPaymentApi.refreshPaymentAccount(provider);
      setAccount(res.data?.data || null);
      notify.success(`${provider ? provider.toUpperCase() : 'Account'} status refreshed.`);
    } catch {
      notify.error("Failed to refresh.");
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectingProvider) return;
    try {
      const res = await organizationPaymentApi.disconnectPaymentAccount(disconnectingProvider);
      setAccount(res.data?.data || null);
      notify.success(`${disconnectingProvider.toUpperCase()} account disconnected.`);
      setDisconnectingProvider(null);
    } catch {
      notify.error("Failed to disconnect.");
    }
  };

  const handleSetDefault = async (provider: 'razorpay' | 'stripe') => {
    setSettingDefault(true);
    try {
      const res = await organizationPaymentApi.setDefaultProvider(provider);
      setAccount(res.data?.data || null);
      notify.success(`Default marketplace provider updated to ${provider === 'stripe' ? 'Stripe' : 'Razorpay'}.`);
    } catch (err: any) {
      notify.error(err.response?.data?.error || "Failed to update default provider.");
    } finally {
      setSettingDefault(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Connected Payment Accounts" description="Manage multi-provider settlement gateways (Razorpay Route & Stripe Connect)" />
        <div className="flex justify-center items-center py-16 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} /> Loading payment accounts...
        </div>
      </div>
    );
  }

  const razorpayDetails = account?.razorpay;
  const isRazorpayActive = (razorpayDetails?.status === 'ACTIVE' || (account?.provider === 'razorpay' && account?.account_status === 'ACTIVE')) && (razorpayDetails?.payouts_enabled || account?.payouts_enabled);

  const stripeDetails = account?.stripe;
  const isStripeActive = (stripeDetails?.status === 'ACTIVE' || (account?.provider === 'stripe' && account?.account_status === 'ACTIVE')) && stripeDetails?.payouts_enabled;

  const currentDefault = account?.default_provider || 'razorpay';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connected Payment Accounts"
        description="Configure and manage bilateral settlement gateways (Razorpay Route & Stripe Connect) to receive automated marketplace payouts."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/payments" className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-2xs">
              Payments Workspace <ArrowRight size={14} />
            </Link>
            <button onClick={() => handleRefresh()} className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-2xs">
              <RefreshCw size={14} /> Refresh All
            </button>
          </div>
        }
      />

      {/* Default Gateway Selector Banner */}
      {(isRazorpayActive || isStripeActive) && (
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Default Receiving Gateway</h4>
              <p className="text-xs text-slate-400">
                Payer checkout requests will prioritize this provider unless the payer chooses an alternative.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSetDefault('razorpay')}
              disabled={settingDefault || currentDefault === 'razorpay' || !isRazorpayActive}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentDefault === 'razorpay'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 disabled:opacity-40'
              }`}
            >
              {currentDefault === 'razorpay' && <Check size={13} />} Razorpay Route
            </button>
            <button
              onClick={() => handleSetDefault('stripe')}
              disabled={settingDefault || currentDefault === 'stripe' || !isStripeActive}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                currentDefault === 'stripe'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 disabled:opacity-40'
              }`}
            >
              {currentDefault === 'stripe' && <Check size={13} />} Stripe Connect
            </button>
          </div>
        </div>
      )}

      {/* Dual Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* 1. RAZORPAY ROUTE CARD */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-lg">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Razorpay Route</h3>
                    {currentDefault === 'razorpay' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Domestic UPI, NetBanking & Split Route Transfers</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                isRazorpayActive 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                  : (razorpayDetails?.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')
              }`}>
                {isRazorpayActive ? '● ACTIVE' : (razorpayDetails?.status || 'NOT CONNECTED')}
              </span>
            </div>

            {isRazorpayActive ? (
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Account ID</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {razorpayDetails?.account_id || account?.provider_account_id || 'acc_linked'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Settlement Bank</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {account?.bank_details?.bank_name || 'Bank Linked'} ({account?.bank_details?.account_number_masked || '****'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">IFSC Code</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {account?.bank_details?.ifsc_code || '–'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">KYC Status</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Verified
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-[11px] font-bold text-emerald-400">✓ Route Split Enabled</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-[11px] font-bold text-emerald-400">✓ Instant Payouts</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 my-4">
                Connect your organization's bank details to receive automated Route split settlements directly into your account.
              </div>
            )}
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {isRazorpayActive ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <button
                  onClick={() => handleRefresh('razorpay')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
                <button
                  onClick={() => setDisconnectingProvider('razorpay')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 flex items-center gap-1.5"
                >
                  <Unplug size={13} /> Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setOnboardingProvider('razorpay')}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <CreditCard size={15} /> Connect Razorpay Route
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. STRIPE CONNECT CARD */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 font-bold text-lg">
                  <Globe size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Stripe Connect</h3>
                    {currentDefault === 'stripe' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cards, Global Currencies & Direct Destination Payouts</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                isStripeActive 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                  : (stripeDetails?.status === 'ONBOARDING' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')
              }`}>
                {isStripeActive ? '● ACTIVE' : (stripeDetails?.status || 'NOT CONNECTED')}
              </span>
            </div>

            {isStripeActive ? (
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Stripe Account ID</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {stripeDetails?.account_id || 'acct_linked'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Charges Capability</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Active
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Destination Payouts</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Active
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Card Processing</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Ready
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="text-[11px] font-bold text-purple-400">✓ Destination Charges</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                    <div className="text-[11px] font-bold text-purple-400">✓ Global Currencies</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 my-4">
                Connect via Stripe Express to enable destination charges with automatic commission deduction and direct bank payouts.
              </div>
            )}
          </div>

          <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {isStripeActive ? (
              <div className="flex items-center gap-2 w-full justify-between">
                <button
                  onClick={() => handleRefresh('stripe')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
                <button
                  onClick={() => setDisconnectingProvider('stripe')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 flex items-center gap-1.5"
                >
                  <Unplug size={13} /> Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleStripeConnect}
                disabled={saving}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={15} /> : <ExternalLink size={15} />}
                Connect with Stripe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay Onboarding Modal */}
      <Modal isVisible={onboardingProvider === 'razorpay'} onClose={() => setOnboardingProvider(null)} title="Connect Razorpay Route Account" maxWidth="2xl">
        <form onSubmit={handleRazorpayOnboard} className="space-y-4 p-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Business Name *</label>
              <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))} required />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Business Type</label>
              <select className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.business_type} onChange={e => setForm(p => ({ ...p, business_type: e.target.value }))}>
                <option value="individual">Individual</option><option value="proprietorship">Proprietorship</option><option value="partnership">Partnership</option><option value="private_limited">Private Limited</option><option value="public_limited">Public Limited</option><option value="llp">LLP</option><option value="trust">Trust</option><option value="society">Society</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Legal Entity Name</label>
              <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.legal_name} onChange={e => setForm(p => ({ ...p, legal_name: e.target.value }))} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Billing Email *</label>
              <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">GSTIN</label>
              <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">PAN</label>
              <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.pan} onChange={e => setForm(p => ({ ...p, pan: e.target.value }))} />
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
              <Landmark size={14} /> Settlement Bank Account
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Bank Name</label>
                <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Account Number</label>
                <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono" value={form.account_number} onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">IFSC Code</label>
                <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono" value={form.ifsc_code} onChange={e => setForm(p => ({ ...p, ifsc_code: e.target.value }))} />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Beneficiary Name</label>
                <input className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" value={form.beneficiary_name} onChange={e => setForm(p => ({ ...p, beneficiary_name: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50" onClick={() => setOnboardingProvider(null)}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-2xs" disabled={saving}>
              {saving ? <><Loader2 className="animate-spin" size={14} /> Connecting...</> : <><Send size={14} /> Connect Razorpay Route</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Disconnect Modal */}
      <Modal isVisible={disconnectingProvider !== null} onClose={() => setDisconnectingProvider(null)} title="Disconnect Settlement Gateway" maxWidth="md">
        <div className="space-y-4 p-2 text-xs text-slate-600 dark:text-slate-400">
          <p>
            Are you sure you want to disconnect <strong>{disconnectingProvider?.toUpperCase()}</strong>? Direct marketplace payouts routed to this account will be paused.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50" onClick={() => setDisconnectingProvider(null)}>Cancel</button>
            <button className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1.5" onClick={handleDisconnect}>
              <Unplug size={14} /> Disconnect {disconnectingProvider?.toUpperCase()}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

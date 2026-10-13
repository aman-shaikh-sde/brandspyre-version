import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiCreditCard, FiPackage, FiFileText, FiRefreshCw, FiClock, FiCheckCircle, FiAlertCircle, FiSave, FiPrinter } from "react-icons/fi";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";
import DataTable from "src/component/DataTable";

export default function BillingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "billing-info">("overview");

  const [billingForm, setBillingForm] = useState({
    billing_name: "",
    billing_email: "",
    gst_number: "",
    pan_number: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, invRes, txRes] = await Promise.all([
        apiClient.get(`/saas/subscription/current`).then((r) => r.data).catch(() => ({})),
        apiClient.get(`/saas/subscription/usage`).then((r) => r.data).catch(() => ({})),
        apiClient.get(`/saas/subscription/invoices`).then((r) => r.data).catch(() => ({})),
        apiClient.get(`/saas/subscription/payment-history`).then((r) => r.data).catch(() => ({})),
      ]);

      if (subRes.data) {
        setSubData(subRes.data);
        const t = subRes.data.tenant || {};
        const b = t.billing_address || {};
        setBillingForm({
          billing_name: t.billing_name || t.name || "",
          billing_email: t.billing_email || "",
          gst_number: t.gst_number || "",
          pan_number: t.pan_number || "",
          line1: b.line1 || "",
          line2: b.line2 || "",
          city: b.city || "",
          state: b.state || "",
          postal_code: b.postal_code || "",
          country: b.country || "India",
        });
      }

      if (usageRes.usage) setUsageData(usageRes.usage);
      if (invRes.data) setInvoices(invRes.data);
      if (txRes.data) setTransactions(txRes.data);
    } catch (err) {
      console.error("Error fetching billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBillingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.put(`/saas/subscription/billing-info`, {
        billing_name: billingForm.billing_name,
        billing_email: billingForm.billing_email,
        gst_number: billingForm.gst_number,
        pan_number: billingForm.pan_number,
        billing_address: {
          line1: billingForm.line1,
          line2: billingForm.line2,
          city: billingForm.city,
          state: billingForm.state,
          postal_code: billingForm.postal_code,
          country: billingForm.country,
        },
      });

      if (res.status === 200) {
        notify.success("Billing and GST details saved successfully!");
      } else {
        notify.error(res.data?.error || "Failed to save billing information.");
      }
    } catch (err) {
      notify.error("Error saving billing details.");
    }
  };

  const sub = subData?.subscription;
  const plan = subData?.plan;

  const invoiceThead = () => [
    { data: "Invoice #" },
    { data: "Invoice Date" },
    { data: "Billing Period" },
    { data: "Total Amount" },
    { data: "Status" },
    { data: "Action", className: "text-right" },
  ];

  const invoiceTbody = () => {
    if (!invoices || invoices.length === 0) return [];
    return invoices.map((inv: any) => ({
      id: inv._id,
      data: [
        { data: <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{inv.invoice_number}</span> },
        { data: <span className="text-xs text-slate-600 font-mono">{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</span> },
        {
          data: (
            <span className="text-xs text-slate-500 font-mono">
              {inv.billing_period_start ? new Date(inv.billing_period_start).toLocaleDateString("en-IN") : "—"} to{" "}
              {inv.billing_period_end ? new Date(inv.billing_period_end).toLocaleDateString("en-IN") : "—"}
            </span>
          ),
        },
        { data: <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">₹{inv.total_amount}</span> },
        { data: <CrmBadge label={inv.status || "paid"} variant="green" /> },
        {
          data: (
            <div className="flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1"
              >
                <FiPrinter size={14} /> Download PDF
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing Center"
        description="Manage workspace subscription tier, quotas, usage meters, tax invoices, and payment details."
        primaryAction={{
          label: "Upgrade / Renew Plan",
          onClick: () => navigate("/pricing"),
          icon: <FiRefreshCw size={14} />,
        }}
      />

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === "overview"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 shadow-2xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Plan & Usage Overview
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === "invoices"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 shadow-2xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Invoices & Transactions ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab("billing-info")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
            activeTab === "billing-info"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 shadow-2xs"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          GST & Billing Address
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active Subscription Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Subscription Tier</p>
                <h2 className="text-2xl font-black text-white mt-1">{plan?.plan_name || "Free Trial"} Plan</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Billing Frequency: <span className="text-slate-200 font-semibold capitalize">{sub?.subscription_type || "Monthly"}</span>
                </p>
              </div>

              <CrmBadge
                label={sub?.status || "trial"}
                variant={sub?.status === "active" ? "green" : "amber"}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 text-xs">
              <div>
                <p className="text-slate-400">Subscription Price</p>
                <p className="text-xl font-mono font-bold text-white mt-1">₹{sub?.amount || plan?.price_monthly || 0}</p>
              </div>
              <div>
                <p className="text-slate-400">Current Period Start</p>
                <p className="text-sm font-mono font-semibold text-slate-200 mt-1">
                  {sub?.start_date ? new Date(sub.start_date).toLocaleDateString("en-IN") : "10/8/2026"}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Renewal / Expiry Date</p>
                <p className="text-sm font-mono font-semibold text-slate-200 mt-1">
                  {sub?.end_date ? new Date(sub.end_date).toLocaleDateString("en-IN") : "24/8/2026"}
                </p>
              </div>
            </div>
          </div>

          {/* Quotas & Usage Meters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Resource & Feature Quotas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usageData &&
                Object.entries(usageData).map(([metric, val]: [string, any]) => {
                  const current = val.current || 0;
                  const max = val.max || 1;
                  const pct = Math.min(100, Math.round((current / max) * 100));

                  return (
                    <div key={metric} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{metric.replace("_", " ")}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {current} / {max >= 99999 ? "∞" : max}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct > 90 ? "bg-red-600" : pct > 75 ? "bg-amber-500" : "bg-emerald-600"
                          }`}
                          style={{ width: `${max >= 99999 ? 8 : Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <DataTable
            thead={invoiceThead}
            tbody={invoiceTbody}
            isLoading={loading}
            noDataText="No platform billing invoices generated yet"
          />
        </div>
      )}

      {activeTab === "billing-info" && (
        <form onSubmit={handleSaveBillingInfo} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-6 max-w-3xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">Tax & GST Billing Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Billing Name</label>
              <input
                type="text"
                value={billingForm.billing_name}
                onChange={(e) => setBillingForm({ ...billingForm, billing_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Email Address</label>
              <input
                type="email"
                value={billingForm.billing_email}
                onChange={(e) => setBillingForm({ ...billingForm, billing_email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number (Optional)</label>
              <input
                type="text"
                value={billingForm.gst_number}
                onChange={(e) => setBillingForm({ ...billingForm, gst_number: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PAN Number (Optional)</label>
              <input
                type="text"
                value={billingForm.pan_number}
                onChange={(e) => setBillingForm({ ...billingForm, pan_number: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Registered Office Address</h4>
            <input
              type="text"
              placeholder="Address Line 1"
              value={billingForm.line1}
              onChange={(e) => setBillingForm({ ...billingForm, line1: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="City"
                value={billingForm.city}
                onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="State"
                value={billingForm.state}
                onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={billingForm.postal_code}
                onChange={(e) => setBillingForm({ ...billingForm, postal_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-2"
            >
              <FiSave size={14} /> Save Billing Details
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

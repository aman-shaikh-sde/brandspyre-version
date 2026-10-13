import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { notify } from "~/services/notificationService";
import { openRazorpayCheckout } from "~/utils/razorpay";
import { FiLock, FiCheckCircle, FiShield, FiArrowLeft, FiCheck } from "react-icons/fi";
import { BrandLogo } from "~/components/public/BrandLogo";
import { apiClient } from "src/services/apiClient";

import { BASE_URL as API_BASE_URL } from "~/constants/api";

const BASE_URL = `${API_BASE_URL}/saas`;

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawPlanId = (searchParams.get("plan") || "professional").toLowerCase();
  const billingCycle = (searchParams.get("billing") || "monthly") as "monthly" | "quarterly" | "yearly";

  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/subscription/plans`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          setDbPlans(data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch database subscription plans:", err);
      })
      .finally(() => setLoadingPlans(false));
  }, []);

  const matchedDbPlan = dbPlans.find(
    (p) => p.plan_code?.toLowerCase() === rawPlanId || p._id === rawPlanId
  );

  const planName = matchedDbPlan?.plan_name || rawPlanId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const planCode = matchedDbPlan?.plan_code || rawPlanId;
  const priceMonthly = matchedDbPlan?.price_monthly || 999;
  const priceQuarterly = matchedDbPlan?.price_quarterly || Math.round(priceMonthly * 3 * 0.9);
  const priceYearly = matchedDbPlan?.price_yearly || Math.round(priceMonthly * 10);

  const price = billingCycle === "yearly" ? priceYearly : billingCycle === "quarterly" ? priceQuarterly : priceMonthly;

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRazorpayPayment = async () => {
    setProcessing(true);

    try {
      let tenantId: string | null = searchParams.get("tenantId") || searchParams.get("tenant") || null;
      let registeredUser: any = null;

      const regDataRaw = sessionStorage.getItem("pendingRegistration");

      if (regDataRaw) {
        const regData = JSON.parse(regDataRaw);
        const regRes = await fetch(`${BASE_URL}/auth/register-wizard`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...regData,
            subscriptionPlan: planCode,
            billingCycle,
          }),
        });

        const regResult = await regRes.json();
        if (!regRes.ok) {
          throw new Error(regResult.error || "Organization registration failed");
        }

        tenantId = regResult.data?.tenant?._id || regResult.data?.tenant?.id || (typeof regResult.data?.tenant === "string" ? regResult.data.tenant : null);
        registeredUser = regResult.data?.adminUser || regResult.data?.user;
        sessionStorage.removeItem("pendingRegistration");
      }

      if (!tenantId) {
        try {
          const subRes = await apiClient.get(`/saas/subscription/current`);
          const subData = subRes.data;
          tenantId = subData.data?.tenant?.id || subData.data?.tenant?._id || null;
          registeredUser = {
            name: subData.data?.tenant?.billing_name || subData.data?.tenant?.name,
            email: subData.data?.tenant?.billing_email
          };
        } catch (err) {
          // Unauthenticated or no workspace
        }
      }

      if (!tenantId) {
        notify.error("No active workspace found. Please register your organization first.");
        navigate(`/tenant-registration?plan=${encodeURIComponent(planCode)}&billing=${billingCycle}`);
        setProcessing(false);
        return;
      }

      const resolvedPlanId = matchedDbPlan?._id || planCode;

      const checkoutRes = await fetch(`${BASE_URL}/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          planId: resolvedPlanId,
          billingCycle,
          amount: price,
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Failed to initialize payment checkout order");
      }

      const { order_id, key_id, amount, currency } = checkoutData.data;

      const razorpayKey = key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error("Payment gateway key missing. Please contact platform support.");
      }

      await openRazorpayCheckout({
        key: razorpayKey,
        amount: Math.round((amount || price) * 100),
        currency: currency || "INR",
        name: "Brandspyre CRM",
        description: `${planName} Subscription (${billingCycle})`,
        order_id,
        prefill: {
          name: registeredUser?.name || "Subscriber",
          email: registeredUser?.email || "",
        },
        theme: {
          color: "#dc2626",
        },
        handler: async (response) => {
          try {
            setProcessing(true);
            const verifyRes = await fetch(`${BASE_URL}/subscription/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tenantId,
                planId: resolvedPlanId,
                billingCycle,
                amount: price,
              }),
            });

            const verifyResult = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyResult.error || "Payment verification failed");
            }

            setSuccess(true);
            notify.success(`${planName} plan activated! Your workspace is ready.`);
            setTimeout(() => navigate("/login"), 2000);
          } catch (err: any) {
            notify.error(err.message || "Payment verification failed");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            notify.error("Payment checkout canceled.");
          },
        },
      });

    } catch (err: any) {
      console.error("Payment error:", err);
      notify.error(err.message || "Payment process failed.");
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <FiCheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-600 text-sm mb-4">
            Your <span className="font-bold text-red-700">{planName}</span> plan is now active.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
          >
            Go to Login & Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <button
          onClick={() => navigate("/pricing")}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition cursor-pointer"
        >
          <FiArrowLeft size={16} /> Back to Plans
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <BrandLogo size="md" />
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Checkout & Payment</h1>
            <p className="text-xs text-slate-500">Secure subscription checkout via Razorpay</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold self-start sm:self-auto">
            <FiShield size={14} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* 2-Column Split Checkout Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Order Summary Column */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900">Order Summary</h2>

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{planName} Subscription</h3>
                  <p className="text-xs text-slate-500 capitalize">{billingCycle} Billing Cycle</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-slate-900">₹{price.toLocaleString("en-IN")}</p>
                  <p className="text-[11px] text-slate-500">
                    {billingCycle === "yearly" ? "/year" : billingCycle === "quarterly" ? "/quarter" : "/month"}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax (Included / Applicable)</span>
                  <span className="font-semibold text-slate-900">₹0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount Due</span>
                  <span className="text-red-700">₹{price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Key Features Included */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-bold text-slate-900">What's included in your subscription:</p>
                {["Full CRM & Pipeline Management", "Automated Attendance & Leave Requests", "Invoice & Payroll Master", "Instant Feature Access & Upgrade", "Cancel or Modify Anytime"].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700 font-medium">
                    <FiCheck className="text-emerald-600" size={14} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Action Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900">Payment Details</h2>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
                <p className="text-xs text-slate-500">Pay securely with</p>
                <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-700">
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded">UPI</span>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded">Cards</span>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded">NetBanking</span>
                </div>
              </div>

              <button
                onClick={handleRazorpayPayment}
                disabled={processing || loadingPlans}
                className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FiLock size={16} /> Pay ₹{price.toLocaleString("en-IN")} with Razorpay
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-400 leading-relaxed">
                By clicking pay, you agree to our terms of service and subscription renewal policies.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FiAlertTriangle, FiRefreshCw, FiClock, FiShieldOff, FiHelpCircle } from "react-icons/fi";

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "Your subscription or free trial period has ended.";
  const isTrial = searchParams.get("type") === "trial" || reason.toLowerCase().includes("trial");

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-8 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <FiShieldOff size={160} />
          </div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg">
            <FiAlertTriangle size={32} className="text-amber-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isTrial ? "Free Trial Expired" : "Subscription Expired"}
          </h1>
          <p className="text-rose-100 text-sm mt-1">
            Access to your organization workspace is currently restricted.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 flex items-start gap-3">
            <FiClock className="text-rose-400 mt-1 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-slate-200">Why am I seeing this?</p>
              <p className="text-slate-400 mt-1">{reason}</p>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-700 text-sm space-y-3">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              What happens next?
            </h3>
            <ul className="text-slate-400 space-y-2 text-xs list-disc list-inside">
              <li>Your company data and configurations remain completely safe and intact.</li>
              <li>Renewing your subscription or choosing a plan will instantly restore full team access.</li>
              <li>You can download past invoices or manage payment options anytime.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-red-900/40 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FiRefreshCw size={18} />
              Renew Subscription & Restore Access
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all text-sm"
            >
              Back to Login
            </button>
          </div>

          {/* Support Link */}
          <div className="text-center pt-2 border-t border-slate-700/60">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <FiHelpCircle size={14} />
              Need assistance? Contact support at{" "}
              <a href="mailto:support@nxtaspect.com" className="text-rose-400 hover:underline">
                support@nxtaspect.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

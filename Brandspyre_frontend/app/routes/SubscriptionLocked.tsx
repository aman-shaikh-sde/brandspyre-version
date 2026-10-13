import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FiLock, FiAlertOctagon, FiRefreshCw, FiHelpCircle } from "react-icons/fi";

export default function SubscriptionLocked() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason") || "Your organization account has been locked due to expired subscription and grace period.";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-red-900/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 via-rose-900 to-red-950 p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-red-950/60 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-red-700/50 shadow-inner">
            <FiLock size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Organization Account Locked
          </h1>
          <p className="text-rose-200 text-sm mt-1">
            Subscription and grace period have expired
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-start gap-3">
            <FiAlertOctagon className="text-red-400 mt-1 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-red-200">Account Lock Notice</p>
              <p className="text-slate-400 mt-1">{reason}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/60 text-sm space-y-2">
            <p className="text-slate-300 font-medium">To unlock your organization workspace:</p>
            <ol className="text-slate-400 text-xs list-decimal list-inside space-y-1.5 pl-1">
              <li>Click <strong className="text-rose-400">Pay & Unlock Account</strong> below.</li>
              <li>Select your preferred subscription plan (Starter, Professional, Business, Enterprise).</li>
              <li>Complete secure payment via Razorpay.</li>
              <li>Your account will be instantly reactivated with all historical CRM data intact.</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full py-3.5 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-semibold shadow-lg shadow-red-950/80 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FiRefreshCw size={18} />
              Pay & Unlock Account Now
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-all text-sm"
            >
              Back to Login
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <FiHelpCircle size={14} />
              Need billing assistance? Contact{" "}
              <a href="mailto:billing@nxtaspect.com" className="text-rose-400 hover:underline">
                billing@nxtaspect.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

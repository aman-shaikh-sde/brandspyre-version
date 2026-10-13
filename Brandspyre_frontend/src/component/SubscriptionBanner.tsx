import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FiAlertTriangle, FiClock, FiArrowRight, FiX } from "react-icons/fi";
import { apiClient } from "src/services/apiClient";

export default function SubscriptionBanner() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<{ show: boolean; type: "trial" | "grace"; message: string; daysLeft: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    apiClient.get("/saas/subscription/current")
      .then((res) => {
        const sub = res.data?.data?.subscription;
        if (!sub) return;

        const now = new Date();

        if (sub.status === "trial" && sub.trial_end_date) {
          const endDate = new Date(sub.trial_end_date);
          const diffMs = endDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (daysLeft <= 5) {
            setBanner({
              show: true,
              type: "trial",
              daysLeft: Math.max(0, daysLeft),
              message: daysLeft <= 1 
                ? "Your 14-day free trial ends tomorrow!" 
                : `Your free trial ends in ${daysLeft} days.`
            });
          }
        } else if (sub.status === "grace" && sub.grace_end_date) {
          const graceEnd = new Date(sub.grace_end_date);
          const diffMs = graceEnd.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          setBanner({
            show: true,
            type: "grace",
            daysLeft: Math.max(0, daysLeft),
            message: `Warning: Your subscription has expired. You are in a ${Math.max(0, daysLeft)}-day grace period.`
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!banner || !banner.show || dismissed) return null;

  const isGrace = banner.type === "grace";

  return (
    <div className={`w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
      isGrace 
        ? "bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white" 
        : "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white"
    }`}>
      <div className="flex items-center gap-2 max-w-4xl">
        {isGrace ? <FiAlertTriangle size={16} className="text-amber-300 animate-pulse" /> : <FiClock size={16} />}
        <span>{banner.message} Renew now to prevent organization lockout and data restriction.</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/pricing")}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-md transition-all flex items-center gap-1 font-bold"
        >
          Renew Now <FiArrowRight size={14} />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white transition-all p-1"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}

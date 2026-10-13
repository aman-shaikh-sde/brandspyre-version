import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Trophy, ArrowRight, ShieldCheck, Mail, Building, Users, CreditCard } from "lucide-react";
import { apiClient } from "src/services/apiClient";

interface OnboardingProgressData {
  email_verified: boolean;
  company_setup: boolean;
  branch_created: boolean;
  team_invited: boolean;
  payment_completed: boolean;
  completion_percentage: number;
}

export default function OnboardingWidget({ tenantId }: { tenantId: string }) {
  const [progress, setProgress] = useState<OnboardingProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboardingStatus();
  }, [tenantId]);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await apiClient.get(`/saas/onboarding/status`, {
        params: { tenantId }
      });
      if (response.data?.success && response.data.data) {
        setProgress(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch onboarding status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = async (stepKey: keyof OnboardingProgressData) => {
    if (!progress) return;
    const newValue = !progress[stepKey];

    try {
      const response = await apiClient.put('/saas/onboarding/step', {
        tenantId,
        [stepKey]: newValue
      });
      if (response.data?.success && response.data.data) {
        setProgress(response.data.data);
      }
    } catch (err) {
      console.error("Failed to update onboarding step:", err);
    }
  };

  if (loading || !progress) return null;
  if (progress.completion_percentage >= 100) return null;

  const steps = [
    { key: 'company_setup' as const, label: 'Company Profile Configured', icon: Building },
    { key: 'branch_created' as const, label: 'Headquarters Branch Setup', icon: ShieldCheck },
    { key: 'email_verified' as const, label: 'Admin Email Verified', icon: Mail },
    { key: 'team_invited' as const, label: 'Invite Team Members', icon: Users },
    { key: 'payment_completed' as const, label: 'Subscription Plan Active', icon: CreditCard },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Getting Started Checklist</h3>
            <p className="text-xs text-slate-400">Complete setup to unlock full performance</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-extrabold text-indigo-400">{progress.completion_percentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mb-4 border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress.completion_percentage}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map(s => {
          const completed = progress[s.key];
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => handleStepClick(s.key)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs text-left transition ${
                completed
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
              <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

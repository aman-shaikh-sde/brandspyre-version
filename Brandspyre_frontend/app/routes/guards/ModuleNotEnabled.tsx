import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Settings, ShieldAlert, Sparkles, PackageX } from "lucide-react";
import { useAuthStore } from "src/stores/authStore";
import { isPlatformAdminRole, isTenantAdminRole } from "src/utils/roleUtils";

interface ModuleNotEnabledProps {
  moduleCode: string;
  moduleName?: string;
}

export const ModuleNotEnabled: React.FC<ModuleNotEnabledProps> = ({
  moduleCode,
  moduleName
}) => {
  const navigate = useNavigate();
  const userRole = useAuthStore((state) => state.role);
  const isAdmin = isPlatformAdminRole(userRole) || isTenantAdminRole(userRole);

  const codeDisplay = moduleCode ? moduleCode.toUpperCase() : "REQUESTED_MODULE";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl text-center relative overflow-hidden">
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-red-500 to-rose-600" />

        {/* Icon Circle */}
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mb-6 shadow-sm">
          <PackageX className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 mb-4">
          <Lock size={12} />
          MODULE DISABLED
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          {moduleName || codeDisplay} Module Not Enabled
        </h2>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          The <span className="font-semibold text-slate-800 dark:text-slate-200">{codeDisplay}</span> module is currently not enabled on your organization's BRANDSPYRE workspace subscription plan.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isAdmin ? (
            <Link
              to="/settings/modules"
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <Settings size={16} />
              Enable Module in Settings
            </Link>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400 mb-2">
              Please contact your organization administrator to request access to this module.
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleNotEnabled;

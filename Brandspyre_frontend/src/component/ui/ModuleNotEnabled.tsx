import React from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export interface ModuleNotEnabledProps {
  moduleName?: string;
}

export const ModuleNotEnabled: React.FC<ModuleNotEnabledProps> = ({
  moduleName = "Module",
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-sm">
        <Lock size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {moduleName} Not Enabled
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        This module is not currently included in your organization's subscription plan or has been turned off in settings.
      </p>
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="crm-btn-primary">
          <ArrowLeft size={16} />
          Go to Dashboard
        </Link>
        <Link to="/settings/modules" className="crm-btn-secondary">
          Module Settings
        </Link>
      </div>
    </div>
  );
};

export default ModuleNotEnabled;

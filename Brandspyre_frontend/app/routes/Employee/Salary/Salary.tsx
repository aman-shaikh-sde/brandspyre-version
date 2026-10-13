import { useState } from "react";
import SalaryList from "./SalaryList";
import SalaryRevisionTracker from "./SalaryRevision";
import { Banknote, TrendingUp } from "lucide-react";

const EmployeeSalary = () => {
  const [activeTab, setActiveTab] = useState<"salaryList" | "revisionTracking">("salaryList");

  const tabs = [
    { id: "salaryList", label: "Salary List", icon: Banknote },
    { id: "revisionTracking", label: "Revision & Increment Tracking", icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === "salaryList" ? (
          <SalaryList />
        ) : (
          <SalaryRevisionTracker />
        )}
      </div>
    </div>
  );
};

export default EmployeeSalary;
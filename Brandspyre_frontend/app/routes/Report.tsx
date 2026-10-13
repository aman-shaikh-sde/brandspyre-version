import { useState } from "react";
import ProjectOverviewReport from "./Report&anaysis/timesheet/ProjectOverviewReport";
import UserSummaryReport from "./Report&anaysis/timesheet/UserSummaryReport";
import EmployeePaymentsPage from "./Project/emp_payment_report";
import PageHeader from "src/component/ui/PageHeader";

const Report = () => {
  const [activeTab, setActiveTab] = useState("projectwisereport");

  const tabs = [
    { id: "projectwisereport", label: "Project Summary" },
    { id: "paymentinsight", label: "Payment Summary" },
    { id: "employeereport", label: "Employee Work Summary" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics Dashboard"
        description="Comprehensive analytics on project milestones, employee work hours, and payment ledgers."
      />

      {/* Modern Sub-Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-red-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === "projectwisereport" && <ProjectOverviewReport />}
        {activeTab === "paymentinsight" && <EmployeePaymentsPage />}
        {activeTab === "employeereport" && <UserSummaryReport />}
      </div>
    </div>
  );
};

export default Report;
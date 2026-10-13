import { Calendar, User2, Eye } from "lucide-react";
import React, { useState, useEffect } from "react";
import MilestoneRemindar from "./Notification/MilestoneRemindar";
import TaskRemindar from "./Notification/TaskRemindar";
import PaymentRemaindar from "./Notification/PaymentRemaindar";
import FollowupRemindar from "./Notification/FollowupRemindar";
import NotificationNew from "./Notification/NewProjectRemainder";
import PastMilestoneRemindar from "./Notification/Pastmilestone";
import PartialMilestoneRemindar from "./Notification/Partialmilestones";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import { Link } from "react-router";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";
import EmptyState from "src/component/ui/EmptyState";
import { TableSkeleton } from "src/component/ui/SkeletonLoader";

interface Project {
  project_code: string;
  title: string;
  priority: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  handler_by: string;
}

function Notification() {
  const [activeTab, setActiveTab] = useState("projectover");
  const [overdueProjects, setOverdueProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const token = useAuthStore((state) => state.accessToken);

  const tabs = [
    { id: "projectover", label: "Overdue Projects" },
    { id: "projectini", label: "New Projects" },
    { id: "milestone", label: "Milestones" },
    { id: "milestonecomplete", label: "Completed Milestones" },
    { id: "milestonepartial", label: "Partial Payments" },
    { id: "task", label: "Tasks" },
    { id: "payment", label: "Payments" },
    { id: "followup", label: "Followups" },
  ];

  useEffect(() => {
    fetchOverdueProjects();
  }, [selectedDate]);

  const fetchOverdueProjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/project/overview/read?overdue=${selectedDate}`
      );
      if (response.data?.data) {
        setOverdueProjects(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching overdue projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Activity Reminders"
        description="Monitor project deadlines, milestone completion targets, and pending follow-ups."
      />

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 gap-2 pb-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "projectover" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Overdue Projects Review</h3>
            <div className="flex items-center gap-2">
              <Calendar className="text-slate-400" size={16} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={4} cols={5} />
          ) : overdueProjects.length === 0 ? (
            <EmptyState
              title="No overdue projects found"
              description={`Zero project deadlines flagged for ${new Date(selectedDate).toDateString()}`}
            />
          ) : (
            <div className="space-y-4">
              {overdueProjects.map((project) => (
                <div
                  key={project.project_code}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs hover:shadow-xs transition border-l-4 border-l-red-600"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-slate-500">{project.project_code}</span>
                        <CrmBadge label={project.status || "overdue"} variant="red" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{project.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Handler: <strong className="text-slate-700 dark:text-slate-300">{project.handler_by || "Unassigned"}</strong> • Priority: <span className="capitalize">{project.priority || "normal"}</span>
                      </p>
                    </div>

                    <Link
                      to={`/project/${encodeURIComponent(project.project_code)}`}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition flex items-center gap-1.5"
                    >
                      <Eye size={14} />
                      View Detail
                    </Link>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Start: {formatDate(project.start_date)}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">Due: {formatDate(project.end_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "projectini" && <NotificationNew />}
      {activeTab === "milestone" && <MilestoneRemindar />}
      {activeTab === "milestonecomplete" && <PastMilestoneRemindar />}
      {activeTab === "milestonepartial" && <PartialMilestoneRemindar />}
      {activeTab === "task" && <TaskRemindar />}
      {activeTab === "payment" && <PaymentRemaindar />}
      {activeTab === "followup" && <FollowupRemindar />}
    </div>
  );
}

export default Notification;
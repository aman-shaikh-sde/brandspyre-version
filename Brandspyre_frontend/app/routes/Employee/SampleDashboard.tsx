import React, { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Layers } from "lucide-react";
import useBranchStore from "src/stores/useBranchStore";
import Dropdown from "src/component/DrapDown";
import { PageHeader } from "src/component/ui/PageHeader";
import { Skeleton, CardSkeleton } from "src/component/ui/SkeletonLoader";
import { EmptyState } from "src/component/ui/EmptyState";
import { isPlatformAdminRole, isTenantAdminRole } from "src/utils/roleUtils";
// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ChartItem {
  label?: string;
  status?: string;
  count: number;
  percentage?: number;
}

interface ProjectStats {
  projects: { total: number };
  tasks: {
    total: number;
    completed: number;
    incomplete: number;
    pending: number;
    overdue: number;
  };
  charts: {
    pie: ChartItem[];
    bar: ChartItem[];
  };
}

const COLORS1 = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
const COLORS2 = ["#8B5CF6", "#06B6D4", "#F43F5E", "#10B981"];

const SampleDashboard = () => {
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userBranchCode = useAuthStore((state) => state.branchcode);

  const isPrivileged = isPlatformAdminRole(userRole) || isTenantAdminRole(userRole);
  const isPlatformAdmin = isPlatformAdminRole(userRole);

  const [branchCode, setBranchCode] = useState(
    isPrivileged ? "" : userBranchCode
  );

  const { branchCodeOptions, fetchBranches } = useBranchStore();

  useEffect(() => {
    if (isPrivileged) {
      fetchBranches(token);
    }
  }, [token, isPrivileged, fetchBranches]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        let teamId: string | undefined = undefined;

        if (staff_id && !isPlatformAdmin) {
          try {
            const teamRes = await apiClient.get<{ team_id: string }>(
              `/getteamid`,
              { params: { staff_id } }
            );
            teamId = teamRes.data?.team_id;
          } catch (teamErr) {
            console.warn("Could not retrieve teamId for staff, proceeding with general stats", teamErr);
          }
        }

        const effectiveBranchCode =
          isPrivileged ? branchCode : userBranchCode;

        const res = await apiClient.get<ProjectStats>(
          `/getdashboard`,
          {
            params: {
              userRole,
              branchCode: effectiveBranchCode,
              ...(teamId && { teamId }),
              ...(staff_id && { staff_id }),
            },
          }
        );

        setProjectStats({
          projects: res.data?.projects || { total: 0 },
          tasks: res.data?.tasks || {
            total: 0,
            completed: 0,
            incomplete: 0,
            pending: 0,
            overdue: 0,
          },
          charts: {
            pie: Array.isArray(res.data?.charts?.pie) ? res.data.charts.pie : [],
            bar: Array.isArray(res.data?.charts?.bar) ? res.data.charts.bar : [],
          },
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setProjectStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [userRole, branchCode, staff_id, userBranchCode, isPrivileged, isPlatformAdmin]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics Dashboard" description="Overview of projects, tasks, and operational performance metrics." />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!projectStats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics Dashboard" description="Overview of projects, tasks, and operational performance metrics." />
        <EmptyState title="Unable to retrieve dashboard data" description="Please verify your branch filters or network connection." />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Projects",
      value: projectStats.projects.total,
      icon: <FolderKanban size={20} className="text-blue-600 dark:text-blue-400" />,
      badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/30",
    },
    {
      title: "Total Tasks",
      value: projectStats.tasks.total,
      icon: <Layers size={20} className="text-purple-600 dark:text-purple-400" />,
      badgeBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/30",
    },
    {
      title: "Completed Tasks",
      value: projectStats.tasks.completed,
      icon: <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />,
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/30",
    },
    {
      title: "Pending Tasks",
      value: projectStats.tasks.pending,
      icon: <Clock size={20} className="text-amber-600 dark:text-amber-400" />,
      badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30",
    },
    {
      title: "Overdue Tasks",
      value: projectStats.tasks.overdue,
      icon: <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />,
      badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/30",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Comprehensive overview of active projects, task allocations, and execution status."
      >
        {isPrivileged && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Branch Filter:</span>
            <Dropdown
              options={branchCodeOptions}
              selectedValue={branchCode}
              onSelect={setBranchCode}
              placeholder="All Branches"
              className="w-[220px]"
            />
          </div>
        )}
      </PageHeader>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-lg border ${card.badgeBg}`}>{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Task Status Distribution</h3>
          {projectStats.charts.pie.length > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStats.charts.pie}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {projectStats.charts.pie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS1[index % COLORS1.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      borderRadius: "8px",
                      color: "#F8FAFC",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No chart distribution available" description="Task status metrics will appear once active tasks are assigned." />
          )}
        </div>

        {/* Project Workload Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Project Workload Analysis</h3>
          {projectStats.charts.bar.length > 0 ? (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectStats.charts.bar}>
                  <XAxis dataKey="status" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "none",
                      borderRadius: "8px",
                      color: "#F8FAFC",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No workload breakdown available" description="Workload data will be populated automatically as project progress updates." />
          )}
        </div>
      </div>
    </div>
  );
};

export default SampleDashboard;

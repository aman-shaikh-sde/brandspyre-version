import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import {
  Users,
  CheckCircle,
  XCircle,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import DynamicDoughnutChart from "./DynamicDoughnutChart";
import KPIBarChart from "./KPIBarChart";
import { useAuthStore } from "src/stores/authStore";

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
  charts: { "Task Completion": ChartItem[]; Performance: ChartItem[] };
}

const EmpDashboard = () => {
  const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AuthStore values
  const userRole = useAuthStore((state) => state.role);
  const branchCode = useAuthStore((state) => state.branchcode);
  const staffId = useAuthStore((state) => state.staff_id);

  useEffect(() => {
    if (!staffId) {
      setError("Staff ID not found in auth");
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // 1️⃣ Get team ID using staff_id
        let teamId: string | undefined = undefined;
        try {
          const teamRes = await apiClient.get<{ team_id: string }>(
            `/getteamid`,
            { params: { staff_id: staffId } }
          );
          teamId = teamRes.data?.team_id;
        } catch (teamErr) {
          console.warn("Could not retrieve teamId, continuing with general stats", teamErr);
        }

        // 2️⃣ Fetch dashboard stats
        const res = await apiClient.get<ProjectStats>(
          `/getdashboard`,
          {
            params: {
              userRole,
              branchcode: branchCode,
              ...(teamId && { teamId }),
              staff_id: staffId,
            },
          }
        );
        setProjectStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [staffId, userRole, branchCode]);

  if (loading)
    return <p className="text-center py-10 text-gray-500">Loading dashboard...</p>;

  if (error)
    return <p className="text-center py-10 text-red-500">{error}</p>;

  if (!projectStats)
    return <p className="text-center py-10 text-gray-500">No data available</p>;

  return (
    <div className="p-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* Total Projects */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Project</p>
              <p className="text-2xl font-bold">{projectStats.projects.total}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-green-600">
                {projectStats.tasks.total}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Completed tasks</p>
              <p className="text-2xl font-bold text-red-600">
                {projectStats.tasks.completed}
              </p>
            </div>
            <XCircle className="text-red-500" size={24} />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {projectStats.tasks.incomplete}
              </p>
            </div>
            <BookOpen className="text-blue-500" size={24} />
          </div>
        </div>

        {/* To Do */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">To Do</p>
              <p className="text-2xl font-bold text-yellow-600">
                {projectStats.tasks.pending}
              </p>
            </div>
            <AlertCircle className="text-yellow-500" size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  {projectStats.charts.pie.length > 0 && (
    <div className="dark:bg-gray-800 p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-200">
        Task Distribution
      </h2>
      <DynamicDoughnutChart
        data={projectStats.charts.pie}
        className="h-[400px] w-full"
      />
    </div>
  )}

  {projectStats.charts.bar.length > 0 && (
    <div className="dark:bg-gray-800 p-4 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-200">
        Task Status Overview
      </h2>
      <KPIBarChart
        data={projectStats.charts.bar}
        title="Task Status Overview"
        stacked={true}
      />
    </div>
  )}
</div>

    </div>
  );
}

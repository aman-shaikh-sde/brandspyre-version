import { useEffect, useState } from "react";
import { useAuthStore } from "src/stores/authStore";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import Dropdown from "src/component/DrapDown";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  FolderKanban,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";
import useBranchStore from "src/stores/useBranchStore";
import { notify } from "~/services/notificationService";
import PageHeader from "src/component/ui/PageHeader";
import CrmBadge from "src/component/ui/CrmBadge";
import DataTable from "src/component/DataTable";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

const ATTENDANCE_COLORS = ["#10B981", "#EF4444", "#3B82F6", "#F59E0B"];
const LEAVE_COLORS = ["#3B82F6", "#8B5CF6", "#EC4899"];

export default function HrGraphs() {
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const userBranchCode = useAuthStore((state) => state.branchcode);

  const [branchCode, setBranchCode] = useState(
    userRole === "superadmin" ? "" : userBranchCode
  );

  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { branchCodeOptions, fetchBranches } = useBranchStore();

  useEffect(() => {
    if (userRole === "superadmin") {
      fetchBranches(token);
    }
  }, [token, userRole, fetchBranches]);

  useEffect(() => {
    fetchData();
  }, [branchCode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const attendanceRes = await apiClient.get(
        `/report/attendancesummary/read`,
        {
          params: { branchcode: branchCode || undefined },
        }
      );
      setAttendanceData(attendanceRes.data?.data || null);

      const leaveRes = await apiClient.get(`/users/leavereq/read`, {
        params: { branchcode: branchCode || undefined },
      });
      setLeaveData(Array.isArray(leaveRes.data?.data) ? leaveRes.data.data : []);
    } catch (err) {
      console.error("Dashboard analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = attendanceData?.attendance_summary ?? {
    present_count: 0,
    absent_count: 0,
    approved_leave_count: 0,
    waitingforlogin_count: 0,
    half_day_leave_count: 0,
    hourly_leave_count: 0,
  };

  const attendancePieData = [
    { name: "Present", value: summary.present_count, color: "#10B981" },
    { name: "Absent", value: summary.absent_count, color: "#EF4444" },
    { name: "On Leave", value: summary.approved_leave_count, color: "#3B82F6" },
    { name: "Waiting Login", value: summary.waitingforlogin_count, color: "#F59E0B" },
  ];

  const leavePieData = [
    {
      name: "Full Day",
      value: Math.max(
        0,
        summary.approved_leave_count -
          (summary.half_day_leave_count + summary.hourly_leave_count)
      ),
      color: "#3B82F6",
    },
    { name: "Half Day", value: summary.half_day_leave_count, color: "#8B5CF6" },
    { name: "Hourly", value: summary.hourly_leave_count, color: "#EC4899" },
  ];

  const deptBarData =
    attendanceData?.department_counts?.map((d: any) => ({
      department: d.department || "General",
      Present: d.present_count ?? 0,
      Absent: d.absent_count ?? 0,
      Leave: d.approved_leave_count ?? 0,
    })) || [];

  const kpiCards = [
    {
      title: "Total Workforce",
      value: attendanceData?.total_employees ?? 0,
      icon: <Users size={20} className="text-blue-600 dark:text-blue-400" />,
      badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/30",
    },
    {
      title: "Present Today",
      value: summary.present_count,
      icon: <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />,
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/30",
    },
    {
      title: "Absent Today",
      value: summary.absent_count,
      icon: <XCircle size={20} className="text-red-600 dark:text-red-400" />,
      badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/30",
    },
    {
      title: "On Approved Leave",
      value: summary.approved_leave_count,
      icon: <BookOpen size={20} className="text-purple-600 dark:text-purple-400" />,
      badgeBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/30",
    },
    {
      title: "Pending Login",
      value: summary.waitingforlogin_count,
      icon: <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />,
      badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30",
    },
  ];

  const recentLeaveThead = () => [
    { data: "Employee" },
    { data: "Leave Type" },
    { data: "Duration" },
    { data: "Status" },
    { data: "Approver" },
  ];

  const recentLeaveTbody = () => {
    if (!leaveData || leaveData.length === 0) return [];
    return leaveData.slice(0, 5).map((leave: any, idx: number) => ({
      id: leave.req_id || idx,
      data: [
        {
          data: (
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{leave.staff_name || "Employee"}</p>
              <p className="font-mono text-[11px] text-slate-500">{leave.staff_id}</p>
            </div>
          ),
        },
        { data: <span className="capitalize text-xs font-semibold text-slate-700 dark:text-slate-300">{leave.leave_type}</span> },
        {
          data: (
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
            </span>
          ),
        },
        {
          data: (
            <CrmBadge
              label={leave.status || "pending"}
              variant={
                leave.status === "approved"
                  ? "green"
                  : leave.status === "rejected"
                  ? "red"
                  : "amber"
              }
            />
          ),
        },
        { data: <span className="text-xs text-slate-600 dark:text-slate-400">{leave.approved_by_name || "—"}</span> },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Operations Dashboard"
        description="Real-time performance analytics across workforce presence, branch operations, and department productivity."
      >
        {userRole === "superadmin" && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Branch:</span>
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

      {/* KPI Cards Grid */}
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

      {/* Analytics Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Workforce Attendance</h3>
            <CrmBadge label="Today" variant="blue" />
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "none",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {attendancePieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {item.name}: <strong>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Type Breakdown Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Approved Leave Breakdown</h3>
            <CrmBadge label="Category" variant="purple" />
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leavePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {leavePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    border: "none",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {leavePieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {item.name}: <strong>{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Attendance Bar Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Department Presence</h3>
            <CrmBadge label="By Dept" variant="green" />
          </div>

          {deptBarData.length > 0 ? (
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="department" stroke="#94A3B8" fontSize={10} />
                  <YAxis stroke="#94A3B8" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "none",
                      borderRadius: "8px",
                      color: "#F8FAFC",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Present" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Absent" fill="#EF4444" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Leave" fill="#3B82F6" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">No departmental breakdown data recorded.</div>
          )}
        </div>
      </div>

      {/* Recent Leave Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Employee Leave Applications</h3>
          <CrmBadge label="Workflow" variant="blue" />
        </div>

        <DataTable
          thead={recentLeaveThead}
          tbody={recentLeaveTbody}
          isLoading={loading}
          noDataText="No recent leave requests found for this branch"
        />
      </div>
    </div>
  );
}

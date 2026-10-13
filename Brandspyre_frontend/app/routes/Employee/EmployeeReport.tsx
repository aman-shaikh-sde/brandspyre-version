import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import { FileDown, Hourglass, Clock, Bookmark, List, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import EmptyState from "src/component/ui/EmptyState";
import { TableSkeleton } from "src/component/ui/SkeletonLoader";

const EmployeeReport = () => {
  const [loading, setLoading] = useState(false);
  const [userSummaryData, setUserSummaryData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffOptions, setStaffOptions] = useState<any[]>([]);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const staff_id = useAuthStore((state) => state.staff_id);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
  const role = (Array.isArray(permission) && permission.length > 0 ? permission[0]?.role : null) || userStoreRole || "employee";

  const [hydrated, setHydrated] = useState(false);
  const token = accesstoken;

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
      } else {
        const unsub = useAuthStore.persist.onHydrate(() => setHydrated(true));
        return () => unsub();
      }
    }
  }, []);

  useEffect(() => {
    const fetchStaff = async () => {
      if (role === "superadmin" || role === "hr" || role === "admin") {
        try {
          const response = await apiClient.get(`/users/read`);
          if (response.data && response.data.data) {
            const options = response.data.data.map((u: any) => ({
              value: u.staff_id,
              label: `${u.firstname || ""} ${u.lastname || ""} (${u.staff_id})`.trim(),
            }));
            setStaffOptions(options);
            if (options.length > 0) {
              setSelectedStaffId(options[0].value);
            }
          }
        } catch (error) {
          console.error("Error fetching staff list for report", error);
        }
      } else {
        setSelectedStaffId(staff_id || "");
      }
    };
    if (hydrated && token) {
      fetchStaff();
    }
  }, [hydrated, token, role, staff_id]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchUserSummaryData = async () => {
    const staffToQuery = selectedStaffId || staff_id;
    if (!staffToQuery || !startDate || !endDate) {
      notify.error("Please select a valid date range first.");
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      const url = `/report/usersummary/read?staff_id=${encodeURIComponent(staffToQuery)}&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;

      const response = await apiClient.get(url);
      if (response.data) {
        setUserSummaryData(response.data);
      }
    } catch (error) {
      console.error("Error fetching user summary data", error);
      notify.error("Failed to fetch user work summary");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    if (!userSummaryData?.data?.projectsummary || userSummaryData.data.projectsummary.length === 0) {
      notify.error("No data to export");
      return;
    }
    const dataToExport = userSummaryData.data.projectsummary.flatMap((project: any) =>
      project.milestones_summary.flatMap((milestone: any) =>
        milestone.taskparticipantsummary.map((participant: any) => ({
          project_code: project.project_code,
          milestone_code: milestone.milestone_code,
          staff_id: participant.staff_id,
          staff_name: `${participant.firstname} ${participant.lastname}`,
          total_tasks: participant.total_tasks,
          total_duration_minutes: participant.total_duration_minutes,
          total_working_hours: (participant.total_duration_minutes / 60).toFixed(2),
          status: project.status,
        }))
      )
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "WorkSummary");
    XLSX.writeFile(wb, "Employee_Work_Summary.xlsx");
  };

  const formatDuration = (minutes: number) => {
    if (isNaN(minutes)) return "0 mins";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (hours > 0 && remainingMinutes > 0) return `${hours} hrs ${remainingMinutes} mins`;
    if (hours > 0) return `${hours} hrs`;
    return `${remainingMinutes} mins`;
  };

  const projectSummaryThead = () => [
    { data: "Project Code" },
    { data: "Status" },
    { data: "Total Tasks" },
    { data: "Total Duration" },
  ];

  const projectSummaryTbody = () => {
    if (!userSummaryData?.data?.projectsummary) return [];
    return userSummaryData.data.projectsummary.map((project: any, index: number) => ({
      id: project.project_code || index,
      data: [
        { data: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{project.project_code}</span> },
        { data: <CrmBadge label={project.status || "active"} variant={project.status === "completed" ? "green" : "blue"} /> },
        { data: project.total_tasks },
        { data: <span className="font-mono font-semibold">{formatDuration(project.total_duration_minutes)}</span> },
      ],
    }));
  };

  const milestoneSummaryThead = () => [
    { data: "Milestone Code" },
    { data: "Total Tasks" },
    { data: "In Progress" },
    { data: "Completed" },
    { data: "Total Duration" },
  ];

  const milestoneSummaryTbody = () => {
    if (!userSummaryData?.data?.projectsummary) return [];
    const allMilestones = userSummaryData.data.projectsummary.flatMap((project: any) =>
      project.milestones_summary.map((milestone: any) => ({
        ...milestone,
        project_code: project.project_code,
      }))
    );

    return allMilestones.map((milestone: any, index: number) => ({
      id: milestone.milestone_code || index,
      data: [
        { data: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{milestone.milestone_code}</span> },
        { data: milestone.total_tasks },
        { data: <CrmBadge label={`${milestone.total_inprogress} active`} variant="amber" /> },
        { data: <CrmBadge label={`${milestone.total_verified_closed} closed`} variant="green" /> },
        { data: <span className="font-mono font-semibold">{formatDuration(milestone.overall_task_duration)}</span> },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Work Summary Report"
        description="Comprehensive summary of project task completions, milestone progress, and working hours."
        secondaryActions={[
          {
            label: "Export Excel",
            onClick: handleOnExport,
            icon: <FileDown size={14} />,
          },
        ]}
      />

      {/* Filter controls */}
      <FilterBar
        searchQuery=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        filters={[
          ...(role === "superadmin" || role === "hr" || role === "admin"
            ? [
                {
                  key: "staff_id",
                  label: "Staff Member",
                  options: staffOptions,
                  value: selectedStaffId,
                  onChange: (val: string) => setSelectedStaffId(val),
                },
              ]
            : []),
        ]}
        onClearAll={() => {
          setStartDate(null);
          setEndDate(null);
          setUserSummaryData(null);
        }}
      >
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(dates: [Date | null, Date | null]) => {
              const [start, end] = dates;
              setStartDate(start);
              setEndDate(end);
            }}
            placeholderText="Select date range"
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 w-[220px]"
            isClearable={true}
          />
          <button
            onClick={fetchUserSummaryData}
            disabled={!startDate || !endDate || loading}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs disabled:opacity-50 transition"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        </div>
      </FilterBar>

      {/* Summary KPI Cards */}
      {userSummaryData?.data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-xl">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Date Range</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {new Date(userSummaryData.data.start_date).toLocaleDateString()} - {new Date(userSummaryData.data.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl">
              <Hourglass size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Working Hours</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDuration(userSummaryData.data.total_duration_minutes)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Bookmark size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Projects Worked</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{userSummaryData.data.total_projects_worked} Projects</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-xl">
              <List size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Tasks Executed</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{userSummaryData.data.total_tasks} Tasks</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : userSummaryData?.data?.projectsummary ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bookmark size={16} className="text-red-700" /> Project Summary Breakdown
            </h3>
            <DataTable thead={projectSummaryThead} tbody={projectSummaryTbody} enableSorting={true} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <List size={16} className="text-red-700" /> Milestone Task Breakdown
            </h3>
            <DataTable thead={milestoneSummaryThead} tbody={milestoneSummaryTbody} enableSorting={true} />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No work summary generated"
          description="Select a date range and click 'Generate Summary' to pull employee project activity data."
        />
      )}
    </div>
  );
};

export default EmployeeReport;
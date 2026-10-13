import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import { FileDown, Calendar, SquareKanban, UserCheck, Hourglass } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ClientSummaryReport from "../ClientSummaryReport";
import BranchSummaryReport from "../BranchwiseReport";
import TeamProjectReport from "../TeamProjectReport;";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import EmptyState from "src/component/ui/EmptyState";
import { TableSkeleton } from "src/component/ui/SkeletonLoader";

const ProjectOverviewReport = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedProjectCode, setSelectedProjectCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [projectOptions, setProjectOptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("projectOoverviewreport");

  const token = useAuthStore((state) => state.accessToken);
  const { branchCodeOptions, fetchBranches } = useBranchStore();

  const tabs = [
    { id: "projectOoverviewreport", label: "Project Overview" },
    { id: "clientproject", label: "Client Project Report" },
    { id: "branchwiseproject", label: "Branchwise Project Report" },
    { id: "teamwiseproject", label: "Teamwise Project Report" },
  ];

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

  useEffect(() => {
    const getProjectOptions = async () => {
      if (!selectedBranchCode) {
        setProjectOptions([]);
        return;
      }
      setLoading(true);
      try {
        const url = `/project/overview/dropdown?branchcode=${selectedBranchCode}`;
        const response = await apiClient.get(url);
        if (response.data && response.data.data) {
          const options = response.data.data.map((project: any) => ({
            value: project.project_code,
            label: `${project.title} (${project.project_code})`,
          }));
          setProjectOptions(options);
        }
      } catch (error) {
        console.error("Error fetching project list", error);
      } finally {
        setLoading(false);
      }
    };
    getProjectOptions();
  }, [selectedBranchCode, token]);

  const fetchReportData = async () => {
    if (!selectedProjectCode) {
      notify.error("Please select a project first.");
      return;
    }
    setLoading(true);
    try {
      let url = `/report/projectoverview/read?project_code=${encodeURIComponent(selectedProjectCode)}`;
      if (startDate) {
        url += `&start_date=${startDate.toISOString().split("T")[0]}`;
      }
      if (endDate) {
        url += `&end_date=${endDate.toISOString().split("T")[0]}`;
      }
      const response = await apiClient.get(url);
      if (response.data) {
        setReportData(response.data);
        setTotalItem(response.data.data?.summary?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching project overview report", error);
      notify.error("Failed to fetch project report");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    if (!reportData?.data) {
      notify.error("No project report data to export");
      return;
    }
    const wb = XLSX.utils.book_new();
    const wsProject = XLSX.utils.json_to_sheet([
      {
        Project_Code: reportData.data.project_code,
        Title: reportData.data.project_details?.title,
        Status: reportData.data.project_details?.status,
        Start_Date: reportData.data.project_details?.start_date,
        End_Date: reportData.data.project_details?.end_date,
        Total_Duration_Minutes: reportData.data.project_details?.total_task_duration,
        Overall_Working_Hours: reportData.data.project_details?.overall_working_hours,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, wsProject, "Project Summary");
    XLSX.writeFile(wb, `${selectedProjectCode}_Overview_Report.xlsx`);
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0 mins";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} hrs ${mins} mins` : `${mins} mins`;
  };

  const thead = () => [
    { data: "Staff ID" },
    { data: "Name" },
    { data: "Tasks Assigned" },
    { data: "Duration" },
  ];

  const tbody = (participants: any[]) => {
    if (!participants) return [];
    return participants.map((p: any, idx: number) => ({
      id: p.staff_id || idx,
      data: [
        { data: <span className="font-mono text-xs font-semibold">{p.staff_id}</span> },
        { data: <span className="font-semibold">{p.firstname} {p.lastname}</span> },
        { data: p.total_tasks },
        { data: <span className="font-mono font-semibold">{formatDuration(p.total_duration_minutes)}</span> },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "projectOoverviewreport" && (
        <div className="space-y-6">
          <FilterBar
            searchQuery=""
            onSearchChange={() => {}}
            searchPlaceholder=""
            filters={[
              {
                key: "branchcode",
                label: "Branch",
                options: branchCodeOptions.map((b: any) => ({ label: b.label || b.value, value: b.value })),
                value: selectedBranchCode,
                onChange: (val) => {
                  setSelectedBranchCode(val);
                  setSelectedProjectCode("");
                },
              },
              {
                key: "project_code",
                label: "Project",
                options: projectOptions,
                value: selectedProjectCode,
                onChange: (val) => setSelectedProjectCode(val),
              },
            ]}
            onClearAll={() => {
              setSelectedBranchCode("");
              setSelectedProjectCode("");
              setStartDate(null);
              setEndDate(null);
              setReportData(null);
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
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 w-[200px]"
                isClearable={true}
              />
              <button
                onClick={fetchReportData}
                disabled={!selectedProjectCode || loading}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs disabled:opacity-50 transition"
              >
                {loading ? "Generating..." : "Generate Report"}
              </button>
              {reportData && (
                <button
                  onClick={handleOnExport}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <FileDown size={14} /> Export
                </button>
              )}
            </div>
          </FilterBar>

          {reportData?.data ? (
            <div className="space-y-6">
              {/* Project summary overview */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-500">{reportData.data.project_code}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{reportData.data.project_details?.title || "Project Overview"}</h3>
                  </div>
                  <CrmBadge label={reportData.data.project_details?.status || "active"} variant="green" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Start Date</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {reportData.data.project_details?.start_date ? new Date(reportData.data.project_details.start_date).toLocaleDateString() : "-"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <p className="text-xs text-slate-500 font-semibold uppercase">End Date</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {reportData.data.project_details?.end_date ? new Date(reportData.data.project_details.end_date).toLocaleDateString() : "-"}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Total Task Duration</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatDuration(reportData.data.project_details?.total_task_duration)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Overall Working Hours</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {reportData.data.project_details?.overall_working_hours?.toFixed(2) || 0} hrs
                    </p>
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Milestone Breakdown</h4>
                {reportData.data.milestones_summary?.map((m: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{m.milestone_code}</span>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>Total Tasks: <strong>{m.total_tasks}</strong></span>
                        <span>In Progress: <strong>{m.total_inprogress}</strong></span>
                        <span>Closed: <strong>{m.total_verified_closed}</strong></span>
                      </div>
                    </div>

                    <DataTable thead={thead} tbody={() => tbody(m.taskparticipantsummary)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No project overview report loaded"
              description="Select a branch and project from the dropdowns above to generate a comprehensive overview report."
            />
          )}
        </div>
      )}

      {activeTab === "clientproject" && <ClientSummaryReport />}
      {activeTab === "branchwiseproject" && <BranchSummaryReport />}
      {activeTab === "teamwiseproject" && <TeamProjectReport />}
    </div>
  );
};

export default ProjectOverviewReport;
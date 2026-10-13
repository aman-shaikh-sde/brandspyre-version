import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import { FileDown, Hourglass, Calendar, User, Search, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import moment from "moment";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import EmptyState from "src/component/ui/EmptyState";
import { TableSkeleton } from "src/component/ui/SkeletonLoader";

const EmployeeTimeSheet = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [checkInOutData, setCheckInOutData] = useState<any>(null);
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedendDate, setSelectedendDate] = useState("");

  const token = useAuthStore((state) => state.accessToken);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userBranchCode = useAuthStore((state) => state.branchcode);
  const [totalDuration, setTotalDuration] = useState(0);

  const role = (Array.isArray(permission) && permission.length > 0 ? permission[0]?.role : null) || userStoreRole || "employee";

  const { branchCodeOptions, fetchBranches } = useBranchStore();

  useEffect(() => {
    if (role === "superadmin" || role === "team-lead") {
      fetchBranches(token);
    }
  }, [token, role]);

  useEffect(() => {
    if (role === "team-lead") {
      setSelectedBranchCode(userBranchCode || "");
    }
  }, [role, userBranchCode]);

  useEffect(() => {
    if (role !== "team-lead" && role !== "superadmin") {
      setSelectedStaffId(staff_id || "");
    }
  }, [role, staff_id]);

  useEffect(() => {
    const getStaffOptions = async () => {
      if ((role === "superadmin" && !selectedBranchCode) || (role === "team-lead" && !userBranchCode)) {
        setStaffOptions([]);
        return;
      }
      try {
        const branchToUse = role === "team-lead" ? userBranchCode : selectedBranchCode;
        const url = `/users/read?branchcode=${branchToUse}`;
        const response = await apiClient.get(url);
        if (response.data && response.data.data) {
          const options = response.data.data.map((staff: any) => ({
            value: staff.staff_id,
            label: `${staff.firstname} ${staff.lastname} (${staff.staff_id})`,
          }));
          setStaffOptions(options);
        }
      } catch (error) {
        console.error("Error fetching staff list", error);
      }
    };
    if (role === "superadmin" || role === "team-lead") {
      getStaffOptions();
    }
  }, [selectedBranchCode, token, role, userBranchCode]);

  const fetchCheckInOutData = async () => {
    const staffIdToUse = role !== "team-lead" && role !== "superadmin" ? staff_id : selectedStaffId;
    if (!staffIdToUse) {
      notify.error("Please select a staff member first.");
      return;
    }

    setLoading(true);
    try {
      let url = `/project/task/checkinout/read?staff_id=${encodeURIComponent(staffIdToUse)}`;
      if (taskId) url += `&task_id=${taskId}`;
      if (sortOrder) url += `&dec=${sortOrder}`;
      if (selectedDate) url += `&start_date=${moment(selectedDate).format("YYYY-MM-DD")}`;
      if (selectedendDate) url += `&end_date=${moment(selectedendDate).format("YYYY-MM-DD")}`;

      const response = await apiClient.get(url);
      if (response.data) {
        setCheckInOutData(response.data);
        setTotalItem(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching check-in/out data", error);
      notify.error("Failed to fetch check-in/out data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "superadmin" && role !== "team-lead") {
      fetchCheckInOutData();
    }
  }, []);

  const calculateTotalDuration = () => {
    if (!checkInOutData?.data) return 0;
    return checkInOutData.data.reduce((total: number, item: any) => {
      const duration = typeof item.duration === "string" ? parseFloat(item.duration) : item.duration;
      return total + (duration || 0);
    }, 0);
  };

  useEffect(() => {
    if (checkInOutData?.data) {
      setTotalDuration(calculateTotalDuration());
    } else {
      setTotalDuration(0);
    }
  }, [checkInOutData]);

  const formatDuration = (minutes: number) => {
    if (isNaN(minutes)) return "0 mins";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (hours > 0 && remainingMinutes > 0) return `${hours} hrs ${remainingMinutes} mins`;
    if (hours > 0) return `${hours} hrs`;
    return `${remainingMinutes} mins`;
  };

  const handleOnExport = () => {
    if (!checkInOutData?.data || checkInOutData.data.length === 0) {
      notify.error("No timesheet data available to export");
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(checkInOutData.data);
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet");
    XLSX.writeFile(wb, "Employee_Timesheet.xlsx");
  };

  const thead = () => [
    { data: "#" },
    { data: "Task ID" },
    { data: "Project" },
    { data: "Task" },
    { data: "Subtask" },
    { data: "Check In" },
    { data: "Check Out" },
    { data: "Duration" },
    { data: "Staff" },
  ];

  const tbody = () => {
    if (!checkInOutData?.data) return [];
    return checkInOutData.data.map((item: any, idx: number) => ({
      id: item._id || idx,
      data: [
        { data: idx + 1 },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">#{item.task_id}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{item.project_title}</span> },
        { data: item.task_title },
        { data: item.subtask_title || "-" },
        { data: item.check_in ? new Date(item.check_in).toLocaleString() : "-" },
        {
          data: item.check_out ? (
            new Date(item.check_out).toLocaleString()
          ) : (
            <CrmBadge label="Active Session" variant="green" />
          ),
        },
        { data: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{item.duration} mins</span> },
        { data: item.staff_name || staff_id },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Timesheet & Attendance Logs"
        description="Track task check-in/check-out logs, working durations, and task activity sessions."
        secondaryActions={[
          {
            label: "Export Excel",
            onClick: handleOnExport,
            icon: <FileDown size={14} />,
          },
        ]}
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={taskId}
        onSearchChange={(val) => setTaskId(val)}
        searchPlaceholder="Filter by Task ID..."
        filters={[
          ...(role === "superadmin" || role === "team-lead"
            ? [
                {
                  key: "branchcode",
                  label: "Branch",
                  options: branchCodeOptions.map((b: any) => ({ label: b.label || b.value, value: b.value })),
                  value: selectedBranchCode,
                  onChange: (val: string) => setSelectedBranchCode(val),
                },
                {
                  key: "staff_id",
                  label: "Staff",
                  options: staffOptions,
                  value: selectedStaffId,
                  onChange: (val: string) => setSelectedStaffId(val),
                },
              ]
            : []),
        ]}
        onClearAll={() => {
          setTaskId("");
          setSelectedDate("");
          setSelectedendDate("");
          if (role === "superadmin") setSelectedBranchCode("");
          if (role === "superadmin" || role === "team-lead") setSelectedStaffId("");
        }}
      >
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          />
          <input
            type="date"
            value={selectedendDate}
            onChange={(e) => setSelectedendDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          />
          <button
            onClick={fetchCheckInOutData}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs transition"
          >
            Generate Log
          </button>
        </div>
      </FilterBar>

      {/* Summary Banner */}
      {checkInOutData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Staff ID</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{role !== "team-lead" && role !== "superadmin" ? staff_id : selectedStaffId || "All"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded-xl">
              <Hourglass size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Logged Duration</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatDuration(totalDuration)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Logged Sessions</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{totalItem} Records</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No check-in/out records found. Click 'Generate Log' to query timesheets."
        enableSorting={true}
      />

      {checkInOutData?.data && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <CustomPagination
            total={totalItem}
            currentPage={currentPage}
            defaultPageSize={pageSize}
            onChange={(page) => setCurrentPage(page)}
            paginationLabel="records"
            isScroll={true}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeTimeSheet;
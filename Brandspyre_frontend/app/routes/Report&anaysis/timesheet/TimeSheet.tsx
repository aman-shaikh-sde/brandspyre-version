
import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Dropdown from "src/component/DrapDown";
import { CalendarFold, FileDown, SquareKanban, SquareUserRound, UserCheck, UserSquare2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../../src/stores/useBranchStore";
import { Eye } from "lucide-react";
import { useMediaQuery } from "../../hooks/use-click-outside";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TimeSheetReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedProjectCode, setSelectedProjectCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const token = useAuthStore((state) => state.accessToken);
    const [activeTab, setActiveTab] = useState("timesheetreport"); // New state for tabs

  const {
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

  // Fetch staff options when branch code changes
  useEffect(() => {
    const getStaffOptions = async () => {
      if (!selectedBranchCode) {
        setStaffOptions([]);
        return;
      }
      
      setLoading(true);
      try {
        const url = `/users/read?branchcode=${selectedBranchCode}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((staff) => ({
            value: staff.staff_id,
            label: `${staff.firstname} ${staff.lastname} (${staff.staff_id})`,
          }));
          setStaffOptions(options);
        }
      } catch (error) {
        console.error("Error fetching staff list", error);
        notify.error("Failed to fetch staff");
      } finally {
        setLoading(false);
      }
    };

    getStaffOptions();
  }, [selectedBranchCode, token]);

  // Fetch project options when branch code changes
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
          const options = response.data.data.map((project) => ({
            value: project.project_code,
            label: project.title,
          }));
          setProjectOptions(options);
        }
      } catch (error) {
        console.error("Error fetching project list", error);
        notify.error("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    getProjectOptions();
  }, [selectedBranchCode, token]);

  // Fetch report data when filters change
  const fetchReportData = async () => {
    if (!selectedStaffId || !selectedProjectCode) {
      setReportData(null);
      return;
    }

    setLoading(true);
    try {
      let url = `/report/tasksummary/read?project_code=${encodeURIComponent(selectedProjectCode)}&staff_id=${encodeURIComponent(selectedStaffId)}`;
      
      if (startDate) {
        const formattedStartDate = formatDate(startDate);
        url += `&start_date=${formattedStartDate}`;
      }
      if (endDate) {
        const formattedEndDate = formatDate(endDate);
        url += `&end_date=${formattedEndDate}`;
      }

      const response = await apiClient.get(url);

      if (response.data) {
        setReportData(response.data);
        setTotalItem(response.data.data?.summary?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching time sheet report", error);
      notify.error("Failed to fetch time sheet report");
      setError("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear().toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBranchCodeChange = (value) => {
    setSelectedBranchCode(value);
    setSelectedStaffId("");
    setSelectedProjectCode("");
    setCurrentPage(1);
  };

  const handleStaffChange = (value) => {
    setSelectedStaffId(value);
    setCurrentPage(1);
  };

  const handleProjectChange = (value) => {
    setSelectedProjectCode(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleOnExport = () => {
    if (!reportData?.data?.summary) {
      notify.error("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData.data.summary);
    XLSX.utils.book_append_sheet(wb, ws, "TimeSheetReport");
    XLSX.writeFile(wb, "TimeSheetReport.xlsx");
  };

  const thead = () => [
    { data: "Task ID" },
    { data: "Task Title" },
    { data: "Priority" },
    { data: "Status" },
    { data: "Subtask" },
    { data: "Rating" },
    { data: "Duration (mins)" },
    {data:"Delay_By"},
    {data:"Delay Reason"},
    { data: "Last Check-in" },
    { data: "Last Check-out" },
  ];

  const tbody = () => {
    if (!reportData?.data?.summary) return [];
    
    return reportData.data.summary.map((item, index) => ({
      id: item.task_id || index,
      data: [
        { data: item.task_id },
        { data: item.task_title },
        { data: item.task_priority },
        { data: item.task_status },
        { data: item.subtask_title },
        { data: item.rating },
      
        { data: item.total_duration_minutes },
        {data:item.delay_by || "Task Ontime"},
        {data:item.delay_reason || "No Delay Reason"},
        { data: new Date(item.last_check_in).toLocaleString() },
        { data: new Date(item.last_check_out).toLocaleString() },
      ],
    }));
  };
  const tabs = [
    { id: "timesheetreport", label: "Time Sheet Report" },
    { id: "ProjectTimesheetReport", label: "Project Time Sheet Report" },
     { id: "usertimesheet", label: "Employee Time Sheet Report" },
  ];
  return (
    <>
      <div className="flex flex-col min-h-screen">
            <div className="border-b m-5 border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        {activeTab == "timesheetreport" && (
    <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              Time Sheet Report
            </h2>
            {isMobile && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-gray-200 rounded-md"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            )}
          </div>
<div className="flex flex-col gap-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-19">
              <Dropdown
                options={branchCodeOptions}
                selectedValue={selectedBranchCode}
                onSelect={handleBranchCodeChange}
                placeholder="Select Branch"
                className="w-full"
                isLoading={isStoreLoading}
              />
              
              <Dropdown
                options={staffOptions}
                selectedValue={selectedStaffId}
                onSelect={handleStaffChange}
                placeholder="Select Staff"
                className="w-full"
                disabled={!selectedBranchCode}
                isLoading={loading}
              />
              
              <Dropdown
                options={projectOptions}
                selectedValue={selectedProjectCode}
                onSelect={handleProjectChange}
                placeholder="Select Project"
                className="w-full"
                disabled={!selectedBranchCode}
                isLoading={loading}
              />
              
              <div className="w-full">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  placeholderText="Select date range"
                  className="w-full p-2 border rounded"
                  isClearable={true}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-19">
                <Dropdown
                  options={pageSizeOptions}
                  selectedValue={pageSize}
                  onSelect={handlePageSizeChange}
                  placeholder="Items per page"
                  className="w-[245px]"
                />
                
                <button
                  onClick={handleOnExport}
                  className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2.5 dark:bg-gray-800 dark:text-gray-300 py-2.5 w-[245px]"
                  disabled={!reportData?.data?.summary}
                >
                  <FileDown className="mr-1" />
                  {!isMobile && "Export Excel"}
                </button>
              </div>
              
              <button
                onClick={fetchReportData}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                disabled={!selectedStaffId || !selectedProjectCode || loading}
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
            </div>
          </div>

          {reportData && (
            <div className="mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg text-red-700 font-semibold mb-2">Report Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-3"><SquareKanban className="inline" size={20}/> Project Code</p>
                  <p className="font-medium">{reportData.data.project_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3"><UserCheck className="inline" size={20}/> Staff ID</p>
                  <p className="font-medium">{selectedStaffId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3"><CalendarFold className="inline" size={20}/> Date Range</p>
                  <p className="font-medium">
                    {startDate ? formatDate(startDate) : 'N/A'} - {endDate ? formatDate(endDate) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          {reportData?.data?.summary && (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  thead={thead}
                  tbody={tbody}
                  responsive={true}
                  className="min-w-full"
                />
              </div>

              <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
                <CustomPagination
                  total={totalItem}
                  currentPage={currentPage}
                  defaultPageSize={pageSize}
                  onChange={handlePageChange}
                  paginationLabel="tasks"
                  isScroll={true}
                />
              </div>
            </>
          )}

          {!loading && !reportData && (
            <div className="text-center py-10 text-gray-500">
              {selectedBranchCode 
                ? (!selectedStaffId || !selectedProjectCode 
                    ? "Please select both Staff and Project to generate report"
                    : "Click 'Generate Report' to view data")
                : "Please select a Branch to view available options"}
            </div>
          )}
        </div>
        )}
    
      </div>
    </>
  );
};

export default TimeSheetReport;
import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Dropdown from "src/component/DrapDown";
import { CalendarFold, FileDown, SquareKanban, UserCheck, SortAsc, SortDesc, Hourglass, Clock, Bookmark, List, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { useMediaQuery } from "~/routes/hooks/use-click-outside";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const UserSummaryReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [userSummaryData, setUserSummaryData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [sortOrder, setSortOrder] = useState("");

  // Auth store data
  const token = useAuthStore((state) => state.accessToken);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userBranchCode = useAuthStore((state) => state.branchcode);
  const role = (Array.isArray(permission) && permission.length > 0 ? permission[0]?.role : null) || userStoreRole || 'employee';

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

  const filteredBranchOptions = () => {
    if (role === 'superadmin') {
      return branchCodeOptions;
    } else if (role === 'team-lead') {
      return branchCodeOptions.filter(branch => branch.value === userBranchCode);
    }
    return [];
  };

  useEffect(() => {
    if (role === 'superadmin' || role === 'team-lead') {
      fetchBranches(token);
    }
  }, [token, role]);

  // Set initial branch code for team-lead
  useEffect(() => {
    if (role === 'team-lead') {
      setSelectedBranchCode(userBranchCode);
    }
  }, [role, userBranchCode]);

  // Set staff ID for employee
  useEffect(() => {
    if (role !== 'team-lead' && role !== "superadmin") {
      setSelectedStaffId(staff_id);
    }
  }, [role, staff_id]);

  // Fetch staff options when branch code changes (for superadmin and team-lead)
  useEffect(() => {
    const getStaffOptions = async () => {
      if ((role === 'superadmin' && !selectedBranchCode) || 
          (role === 'team-lead' && !userBranchCode)) {
        setStaffOptions([]);
        return;
      }
      
      setLoading(true);
      try {
        const branchToUse = role === 'team-lead' ? userBranchCode : selectedBranchCode;
        const url = `/users/read?branchcode=${branchToUse}`;
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

    if (role === 'superadmin' || role === 'team-lead') {
      getStaffOptions();
    }
  }, [selectedBranchCode, token, role, userBranchCode]);

  // Fetch user summary data
  const fetchUserSummaryData = async () => {
    const staffIdToUse = role !== 'team-lead' && role !=='superadmin' ? staff_id : selectedStaffId;
    
    if (!staffIdToUse || !startDate || !endDate) {
      setUserSummaryData(null);
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      let url = `/report/usersummary/read?staff_id=${encodeURIComponent(staffIdToUse)}&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;

      if (sortOrder) {
        url += `&dec=${sortOrder}`;
      }

      const response = await apiClient.get(url);

      if (response.data) {
        setUserSummaryData(response.data);
        setTotalItem(response.data.data?.projectsummary?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching user summary data", error);
      notify.error("Failed to fetch user summary data");
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
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
    setCurrentPage(1);
  };

  const handleStaffChange = (value) => {
    setSelectedStaffId(value);
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

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "" : "desc");
  };

  const handleOnExport = () => {
    if (!userSummaryData?.data?.projectsummary || userSummaryData.data.projectsummary.length === 0) {
      notify.error("No data to export");
      return;
    }

    // Flatten the data for export
    const dataToExport = userSummaryData.data.projectsummary.flatMap(project => 
      project.milestones_summary.flatMap(milestone => 
        milestone.taskparticipantsummary.map(participant => ({
          project_code: project.project_code,
          milestone_code: milestone.milestone_code,
          staff_id: participant.staff_id,
          staff_name: `${participant.firstname} ${participant.lastname}`,
          total_tasks: participant.total_tasks,
          total_duration_minutes: participant.total_duration_minutes,
          total_working_hours: (participant.total_duration_minutes / 60).toFixed(2),
          status: project.status
        }))
      )
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "UserSummaryReport");
    XLSX.writeFile(wb, "UserSummaryReport.xlsx");
  };

  const generateReport = () => {
    fetchUserSummaryData();
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (isNaN(minutes)) return "0 minutes";
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
  };

  // Table configurations for project summary
  const projectSummaryThead = () => [
    { data: "Project Code" },
    { data: "Status" },
    { data: "Total Tasks" },
    { data: "Total Duration" },
  ];

  const projectSummaryTbody = () => {
    if (!userSummaryData?.data?.projectsummary) return [];
    
    return userSummaryData.data.projectsummary.map((project, index) => ({
      id: project.project_code || index,
      data: [
        { data: project.project_code },
        // { data: project.status },
           {
          data: (
            <div
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${project.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${project.status === "completed" ? "bg-green-800" : "bg-red-700"}`}
              ></span>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </div>
          ),
        },
        { data: project.total_tasks },
        { data: formatDuration(project.total_duration_minutes) },
      ],
    }));
  };

  // Table configurations for milestone summary
  const milestoneSummaryThead = () => [
    { data: "Milestone Code" },
    { data: "Total Tasks" },
    { data: "In Progress" },
    { data: "Completed" },
    { data: "Total Duration" },
  ];

  const milestoneSummaryTbody = () => {
    if (!userSummaryData?.data?.projectsummary) return [];
    
    // Flatten all milestones from all projects
    const allMilestones = userSummaryData.data.projectsummary.flatMap(
      project => project.milestones_summary.map(milestone => ({
        ...milestone,
        project_code: project.project_code
      }))
    );

    return allMilestones.map((milestone, index) => ({
      id: milestone.milestone_code || index,
      data: [
        { data: milestone.milestone_code },
        { data: milestone.total_tasks },
        { data: milestone.total_inprogress },
        { data: milestone.total_verified_closed },
        { data: formatDuration(milestone.overall_task_duration) },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-5">
              User Work Summary Report
            </h2>
          </div>
<div className="flex flex-col gap-4 mb-5">
            <div className={`grid grid-cols-1 ${role !== "superadmin" && role !== "team-lead" ? "md:grid-cols-2 lg:grid-cols-2 gap-3" : "md:grid-cols-4 lg:grid-cols-4 gap-20"}`}>
              {/* Branch dropdown - only for superadmin and team-lead */}
              {(role === 'superadmin' || role === 'team-lead') && (
                <Dropdown
                  options={filteredBranchOptions()}
                  selectedValue={selectedBranchCode}
                  onSelect={handleBranchCodeChange}
                  placeholder="Select Branch"
                  className="w-[245px]"
                  isLoading={isStoreLoading}
                  disabled={role === 'team-lead'}
                />
              )}
              
              {/* Staff dropdown - only for superadmin and team-lead */}
              {(role === 'superadmin' || role === 'team-lead') && (
                <Dropdown
                  options={staffOptions}
                  selectedValue={selectedStaffId}
                  onSelect={handleStaffChange}
                  placeholder="Select Staff"
                  className="w-[245px]"
                  disabled={role === 'team-lead' ? !userBranchCode : !selectedBranchCode}
                  isLoading={loading}
                />
              )}

              {/* Date range picker */}
              <div className="w-[245px]">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  placeholderText="Select date range"
                  className="w-full p-2 border rounded h-[40px]"
                  isClearable={true}
                />
              </div>
            
              <Dropdown
                options={pageSizeOptions}
                selectedValue={pageSize}
                onSelect={handlePageSizeChange}
                placeholder="Items per page"
                className="w-[245px]"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center">
              <div className={`flex ${role !== "superadmin" && role !== "team-lead" ? "gap-91" : "gap-19"}`}>
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect px-18 h-[40px] rounded-sm"
                >
                  {sortOrder === "desc" ? <SortDesc className="mr-1" /> : <SortAsc className="mr-1" />}
                  Sort {sortOrder === "desc" ? "Desc" : "Asc"}
                </button>
                
                <button
                  onClick={handleOnExport}
                  className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2 dark:bg-gray-800 dark:text-gray-300 py-2 w-[245px]"
                  disabled={!userSummaryData?.data?.projectsummary}
                >
                  <FileDown className="mr-1" />
                  {!isMobile && "Export Excel"}
                </button>
              </div>
              
              <button
                onClick={generateReport}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                disabled={
                  (role !== 'team-lead' && role !== "superadmin" ? !startDate || !endDate : !selectedStaffId || !startDate || !endDate) ||
                  loading
                }
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
            </div>
          </div>

          {userSummaryData && (
            <div className="mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg text-red-700 font-semibold mb-2">User Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <UserCheck className="mr-1" size={16} /> Staff ID
                  </p>
                  <p className="font-medium">
                    {userSummaryData.data.staff_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <Clock className="mr-1" size={16} /> Date Range
                  </p>
                  <p className="font-medium">
                    {new Date(userSummaryData.data.start_date).toLocaleDateString()} - {new Date(userSummaryData.data.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <Hourglass className="mr-1" size={16} /> Total Working Hours
                  </p>
                  <p className="font-medium">
                    {formatDuration(userSummaryData.data.total_duration_minutes)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <Bookmark className="mr-1" size={16} /> Projects Worked
                  </p>
                  <p className="font-medium">
                    {userSummaryData.data.total_projects_worked}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-3 flex items-center">
                    <List className="mr-1" size={16} /> Total Tasks
                  </p>
                  <p className="font-medium">
                    {userSummaryData.data.total_tasks}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          {userSummaryData?.data?.projectsummary && (
            <>
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bookmark className="mr-2" size={20} /> Project Summary
                </h3>
                <div className="overflow-x-auto">
                  <DataTable
                    thead={projectSummaryThead}
                    tbody={projectSummaryTbody}
                    responsive={true}
                    className="min-w-full"
                  />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <List className="mr-2" size={20} /> Milestone Summary
                </h3>
                <div className="overflow-x-auto">
                  <DataTable
                    thead={milestoneSummaryThead}
                    tbody={milestoneSummaryTbody}
                    responsive={true}
                    className="min-w-full"
                  />
                </div>
              </div>

              <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
                <CustomPagination
                  total={totalItem}
                  currentPage={currentPage}
                  defaultPageSize={pageSize}
                  onChange={handlePageChange}
                  paginationLabel="projects"
                  isScroll={true}
                />
              </div>
            </>
          )}

          {!loading && !userSummaryData && (
            <div className="text-center py-10 text-gray-500">
              {role !== 'team-lead' && role !== "superadmin" 
                ? (!startDate || !endDate 
                    ? "Please select date range to generate report"
                    : "Click 'Generate Report' to view your work summary")
                : (role === 'team-lead' 
                    ? (!userBranchCode 
                        ? "Loading branch information..."
                        : (!selectedStaffId
                            ? "Please select Staff and date range"
                            : (!startDate || !endDate
                                ? "Please select date range"
                                : "Click 'Generate Report' to view data")))
                    : (!selectedBranchCode
                        ? "Please select Branch to view available options"
                        : (!selectedStaffId
                            ? "Please select Staff"
                            : (!startDate || !endDate
                                ? "Please select date range"
                                : "Click 'Generate Report' to view data"))))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserSummaryReport;

import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { 
  Users, 
  BookCheck, 
  UserX, 
  ArrowRightToLine, 
  ClockFading,
  Eye,
  Dot,
  FileDown,
  Calendar as CalendarIcon,
  Building,
  Users as TeamIcon,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import useBranchStore from "src/stores/useBranchStore";

const AttendanceReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("department");
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const staticBranchCode = useAuthStore((state) => state.branchcode);
  
  const {
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const filterOptions = [
    { value: "all", label: "All Branches" },
    ...branchCodeOptions.map(branch => ({
      value: branch.value,
      label: branch.label
    }))
  ];

  const tabs = [
    { id: "department", label: "Department View" },
    { id: "team", label: "Team View" }
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      let url = `/report/attendancesummary/read`;
      const params = new URLSearchParams();

      if (userRole === "superadmin" && selectedFilter && selectedFilter !== "all") {
        params.append("branchcode", selectedFilter);
      } else if (userRole !== "superadmin") {
        params.append("branchcode", staticBranchCode);
      }

      if (startDate) {
        params.append("startdate", formatDate(startDate));
      }
      if (endDate) {
        params.append("enddate", formatDate(endDate));
      }

      url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          setReportData(response.data);
          setSheetData(response.data.data || []);
        } else {
        
          const singleBranchResponse = {
            data: [response.data.data || response.data], 
            message: response.data.message
          };
          setReportData(singleBranchResponse);
          setSheetData([response.data.data || response.data] || []);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance report", error);
      notify.error("Failed to fetch attendance report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

  useEffect(() => {
    fetchAttendanceReport();
  }, [selectedFilter, startDate, endDate]);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleOnExport = () => {
    if (!reportData) {
      notify.error("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    let exportData = [];
    
    const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];
    
    exportData = branches.flatMap(branch => {
      if (!branch) return [];
      
      const branchRow = {
        "Branch Code": branch.branchcode,
        "Branch Name": branch.branch_name,
        "Total Employees": branch.total_employees,
        "Active Employees": branch.total_active_employees,
        "Present": branch.attendance_summary?.present_count || 0,
        "Absent": branch.attendance_summary?.absent_count || 0,
        "On Leave": branch.attendance_summary?.leave_count || 0,
        "Approved Leave": branch.attendance_summary?.approved_leave_count || 0,
        "Half Day Leave": branch.attendance_summary?.half_day_leave_count || 0,
        "Hourly Leave": branch.attendance_summary?.hourly_leave_count || 0,
        "Waiting for Login": branch.attendance_summary?.waitingforlogin_count || 0
      };

      const departmentRows = (branch.department_counts || []).map(dept => ({
        ...branchRow,
        "Department": dept.department || "N/A",
        "Dept Employees": dept.employee_count,
        "Dept Present": dept.present_count,
        "Dept Absent": dept.absent_count,
        "Dept On Leave": dept.leave_count,
        "Dept Approved Leave": dept.approved_leave_count,
        "Dept Half Day Leave": dept.half_day_leave_count,
        "Dept Hourly Leave": dept.hourly_leave_count,
        "Dept Waiting for Login": dept.waitingforlogin_count
      }));

      const teamRows = (branch.team_counts || []).map(team => ({
        ...branchRow,
        "Team ID": team.team_id,
        "Team Name": team.team_name,
        "Team Lead": team.teamleadname,
        "Team Employees": team.employee_count,
        "Team Present": team.present_count,
        "Team Absent": team.absent_count,
        "Team On Leave": team.leave_count,
        "Team Approved Leave": team.approved_leave_count,
        "Team Half Day Leave": team.half_day_leave_count,
        "Team Hourly Leave": team.hourly_leave_count,
        "Team Waiting for Login": team.waitingforlogin_count
      }));

      return [...departmentRows, ...teamRows];
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Summary");
    XLSX.writeFile(wb, "AttendanceReport.xlsx");
  };

  const calculateTotals = () => {
    if (!reportData) return null;

    const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];

    return branches.reduce((acc, branch) => {
      if (!branch) return acc;
      
      return {
        totalEmployees: acc.totalEmployees + (branch.total_employees || 0),
        activeEmployees: acc.activeEmployees + (branch.total_active_employees || 0),
        present: acc.present + (branch.attendance_summary?.present_count || 0),
        absent: acc.absent + (branch.attendance_summary?.absent_count || 0),
        leave: acc.leave + (branch.attendance_summary?.leave_count || 0),
        approvedLeave: acc.approvedLeave + (branch.attendance_summary?.approved_leave_count || 0),
        halfDayLeave: acc.halfDayLeave + (branch.attendance_summary?.half_day_leave_count || 0),
        hourlyLeave: acc.hourlyLeave + (branch.attendance_summary?.hourly_leave_count || 0),
        waitingForLogin: acc.waitingForLogin + (branch.attendance_summary?.waitingforlogin_count || 0)
      };
    }, {
      totalEmployees: 0,
      activeEmployees: 0,
      present: 0,
      absent: 0,
      leave: 0,
      approvedLeave: 0,
      halfDayLeave: 0,
      hourlyLeave: 0,
      waitingForLogin: 0
    });
  };

  const totals = calculateTotals();

  const Card = ({ value, icon, label, color }: any) => {
    return (
      <div className="flex flex-col bg-white w-full h-[100px] shadow-lg rounded-lg items-center justify-center dark:bg-gray-800">
        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
        <div className="flex gap-2">
          {icon}
          <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </h1>
        </div>
      </div>
    );
  };

  const departmentThead = () => [
    { data: "Department" },
    { data: "Total" },
    { data: "Present", icon: <CheckCircle className="inline text-green-500" size={16} /> },
    { data: "Absent", icon: <XCircle className="inline text-red-500" size={16} /> },
    { data: "On Leave", icon: <Clock className="inline text-yellow-500" size={16} /> },
    { data: "Approved Leave", icon: <UserCheck className="inline text-blue-500" size={16} /> },
    { data: "Waiting", icon: <ClockFading className="inline text-gray-500" size={16} /> },
  ];

  const departmentTbody = () => {
    if (!reportData) return [];
    
    const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];
    
    const departmentMap = new Map();
    
    branches.forEach(branch => {
      if (!branch) return;
      
      (branch.department_counts || []).forEach(dept => {
        const key = dept.department || "Unknown";
        if (!departmentMap.has(key)) {
          departmentMap.set(key, {
            department: key,
            employee_count: 0,
            present_count: 0,
            absent_count: 0,
            leave_count: 0,
            approved_leave_count: 0,
            half_day_leave_count: 0,
            hourly_leave_count: 0,
            waitingforlogin_count: 0
          });
        }
        
        const existing = departmentMap.get(key);
        departmentMap.set(key, {
          department: key,
          employee_count: existing.employee_count + (dept.employee_count || 0),
          present_count: existing.present_count + (dept.present_count || 0),
          absent_count: existing.absent_count + (dept.absent_count || 0),
          leave_count: existing.leave_count + (dept.leave_count || 0),
          approved_leave_count: existing.approved_leave_count + (dept.approved_leave_count || 0),
          half_day_leave_count: existing.half_day_leave_count + (dept.half_day_leave_count || 0),
          hourly_leave_count: existing.hourly_leave_count + (dept.hourly_leave_count || 0),
          waitingforlogin_count: existing.waitingforlogin_count + (dept.waitingforlogin_count || 0)
        });
      });
    });
    
    return Array.from(departmentMap.values()).map((dept, index) => ({
      id: `${dept.department}-${index}`,
      data: [
        { data: dept.department || "N/A" },
        { data: dept.employee_count },
        { data: dept.present_count },
        { data: dept.absent_count },
        { data: dept.leave_count },
        { data: dept.approved_leave_count },
        { data: dept.waitingforlogin_count },
      ],
    }));
  };

  const teamThead = () => [
    { data: "Team" },
    { data: "Team Lead" },
    { data: "Total" },
    { data: "Present", icon: <CheckCircle className="inline text-green-500" size={16} /> },
    { data: "Absent", icon: <XCircle className="inline text-red-500" size={16} /> },
    { data: "On Leave", icon: <Clock className="inline text-yellow-500" size={16} /> },
    { data: "Approved Leave", icon: <UserCheck className="inline text-blue-500" size={16} /> },
    { data: "Waiting", icon: <ClockFading className="inline text-gray-500" size={16} /> },
  ];

  const teamTbody = () => {
    if (!reportData) return [];
    
    const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];
    
    const allTeams = branches.flatMap(branch => {
      if (!branch) return [];
      return (branch.team_counts || []).map(team => ({
        ...team,
        branch_name: branch.branch_name
      }));
    });
    
    return allTeams.map((team, index) => ({
      id: team.team_id || `team-${index}`,
      data: [
        { data: team.team_name },
        { data: team.teamleadname },
        { data: team.employee_count },
        { data: team.present_count },
        { data: team.absent_count },
        { data: team.leave_count },
        { data: team.approved_leave_count },
        { data: team.waitingforlogin_count },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {userRole === "superadmin" && (
            <Dropdown
              options={filterOptions}
              selectedValue={selectedFilter}
              onSelect={setSelectedFilter}
              placeholder="Filter By Branch"
              className="w-full md:w-[220px]"
              isLoading={isStoreLoading}
            />
          )}

          <div className="w-full md:w-[240px]">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              placeholderText="Select date range"
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg h-[38px]"
              isClearable={true}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAttendanceReport}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-2xs flex items-center gap-1.5"
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Refresh Report"}
          </button>
          <button
            onClick={handleOnExport}
            className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <FileDown size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
          <Card
            value={totals.totalEmployees}
            icon={<Users className="text-blue-600" size={20} />}
            label="Total Employees"
            color="text-blue-600"
          />

          <Card
            value={totals.activeEmployees}
            icon={<UserCheck className="text-green-600" size={20} />}
            label="Active Employees"
            color="text-green-600"
          />

          <Card
            value={totals.present}
            icon={<CheckCircle className="text-green-600" size={20} />}
            label="Present Today"
            color="text-green-600"
          />

          <Card
            value={totals.absent}
            icon={<XCircle className="text-red-600" size={20} />}
            label="Absent Today"
            color="text-red-600"
          />

          <Card
            value={totals.leave}
            icon={<Clock className="text-yellow-600" size={20} />}
            label="On Leave"
            color="text-yellow-600"
          />

          <Card
            value={totals.approvedLeave}
            icon={<BookCheck className="text-purple-600" size={20} />}
            label="Approved Leave"
            color="text-purple-600"
          />

          <Card
            value={totals.halfDayLeave}
            icon={<ClockFading className="text-orange-600" size={20} />}
            label="Half Day Leave"
            color="text-orange-600"
          />

          <Card
            value={totals.waitingForLogin}
            icon={<ArrowRightToLine className="text-gray-600" size={20} />}
            label="Waiting for Login"
            color="text-gray-600"
          />
        </div>
      )}

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium text-sm ${activeTab === tab.id ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={`Search ${activeTab === 'department' ? 'departments' : 'teams'}...`}
        />
      </div>

      {activeTab === "department" ? (
        <DataTable 
          thead={departmentThead} 
          tbody={departmentTbody} 
          maxHeight="500px" 
        />
      ) : (
        <DataTable 
          thead={teamThead} 
          tbody={teamTbody} 
          maxHeight="500px" 
        />
      )}

      <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
        <CustomPagination
          total={
            activeTab === 'department' 
              ? departmentTbody().length
              : teamTbody().length
          }
          currentPage={currentPage}
          defaultPageSize={10}
          onChange={setCurrentPage}
          paginationLabel={activeTab === 'department' ? 'departments' : 'teams'}
          isScroll={true}
        />
      </div>

      <Modal
        isVisible={showModal}
        className="w-full md:w-[700px]"
        onClose={() => setShowModal(false)}
        title="Employee Attendance Details"
      >
        {selectedEmployee && (
          <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                Employee Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.empId || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                Attendance Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
                  <p className={`text-sm font-medium mt-1 ${
                    selectedEmployee.status === 'Present' ? 'text-green-600' :
                    selectedEmployee.status === 'Absent' ? 'text-red-600' :
                    selectedEmployee.status === 'On Leave' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {selectedEmployee.status || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-in Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.checkIn || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-out Time</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.checkOut || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Hours</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.totalHours || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedEmployee.status === 'On Leave' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                  Leave Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.leaveType || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Days</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.leaveDays || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">From Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.leaveStart || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">To Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{selectedEmployee.leaveEnd || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white dark:text-gray-100 rounded-md transition-colors duration-200 font-medium text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AttendanceReport;






// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";
// import Dropdown from "src/component/DrapDown";
// import {
//   Users,
//   BookCheck,
//   UserX,
//   ArrowRightToLine,
//   ClockFading,
//   Eye,
//   Dot,
//   FileDown,
//   Calendar as CalendarIcon,
//   Building,
//   Users as TeamIcon,
//   Home,
//   CheckCircle,
//   XCircle,
//   Clock,
//   UserCheck,
// } from "lucide-react";
// import * as XLSX from "xlsx";
// import { apiClient } from "src/services/apiClient";
// import { BASE_URL } from "~/constants/api";
// import toast, { Toaster } from "react-hot-toast";
// import { useAuthStore } from "src/stores/authStore";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
// import useBranchStore from "src/stores/useBranchStore";

// const AttendanceReport = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedFilter, setSelectedFilter] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState<string[]>([]); // Ensure it's an array
//   const [sheetData, setSheetData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [reportData, setReportData] = useState<any>(null);
//   const [startDate, setStartDate] = useState<Date | null>(null);
//   const [endDate, setEndDate] = useState<Date | null>(null);
//   const [activeTab, setActiveTab] = useState("department");
//   const [showModal, setShowModal] = useState(false);
//   const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

//   const token = useAuthStore((state) => state.accessToken);
//   const userRole = useAuthStore((state) => state.role);
//   const staticBranchCode = useAuthStore((state) => state.branchcode);

//   const { branchCodeOptions, fetchBranches, isLoading: isStoreLoading } = useBranchStore();

//   const filterOptions = [
//     { value: "all", label: "All Branches" },
//     ...branchCodeOptions.map((branch) => ({ value: branch.value, label: branch.label })),
//   ];

//   const tabs = [
//     { id: "department", label: "Department View" },
//     { id: "team", label: "Team View" },
//   ];

//   const formatDate = (date: Date | null) => {
//     if (!date) return "";
//     const d = new Date(date);
//     const year = d.getFullYear();
//     const month = (d.getMonth() + 1).toString().padStart(2, "0");
//     const day = d.getDate().toString().padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   // ==================== Fetch Attendance Data ====================
//   const fetchAttendanceData = async () => {
//     setLoading(true);
//     try {
//       let url = `/report/attendancesummary/read`;
//       const params = new URLSearchParams();

//       // Branch filter
//       if (userRole === "superadmin" && selectedFilter && selectedFilter !== "all") {
//         params.append("branchcode", selectedFilter);
//       } else if (userRole !== "superadmin") {
//         params.append("branchcode", staticBranchCode);
//       }

//       // Date filter
//       if (startDate) params.append("startdate", formatDate(startDate));
//       if (endDate) params.append("enddate", formatDate(endDate));

//       // Status filter (safe handling)
//       const statuses = Array.isArray(selectedStatus) ? selectedStatus : [selectedStatus];
//       statuses.forEach((status) => {
//         if (status) params.append("status", status);
//       });

//       url += `?${params.toString()}`;

//       const response = await apiClient.get(url, {
//
//       });

//       if (response.data) {
//         const data = response.data.data;
//         if (Array.isArray(data)) {
//           setReportData(response.data);
//           setSheetData(data);
//         } else {
//           // single branch response
//           setReportData({ data: [data], message: response.data.message });
//           setSheetData([data]);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching attendance data", error);
//       notify.error("Failed to fetch attendance data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generateReport = async () => {
//     await fetchAttendanceData();
//     // sheetData now updated and ready for DataTable/Excel export
//   };

//   useEffect(() => {
//     fetchBranches(token);
//   }, [token]);

//   useEffect(() => {
//     generateReport();
//   }, [selectedFilter, selectedStatus, startDate, endDate]);

//   const handleDateChange = (dates: [Date | null, Date | null]) => {
//     const [start, end] = dates;
//     setStartDate(start);
//     setEndDate(end);
//   };

//   const handleOnExport = () => {
//     if (!reportData) {
//       notify.error("No data to export");
//       return;
//     }

//     const wb = XLSX.utils.book_new();

//     const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];

//     const exportData = branches.flatMap((branch) => {
//       if (!branch) return [];

//       const branchRow = {
//         "Branch Code": branch.branchcode,
//         "Branch Name": branch.branch_name,
//         "Total Employees": branch.total_employees,
//         "Active Employees": branch.total_active_employees,
//         "Present": branch.attendance_summary?.present_count || 0,
//         "Absent": branch.attendance_summary?.absent_count || 0,
//         "On Leave": branch.attendance_summary?.leave_count || 0,
//         "Approved Leave": branch.attendance_summary?.approved_leave_count || 0,
//         "Half Day Leave": branch.attendance_summary?.half_day_leave_count || 0,
//         "Hourly Leave": branch.attendance_summary?.hourly_leave_count || 0,
//         "Waiting for Login": branch.attendance_summary?.waitingforlogin_count || 0,
//       };

//       const departmentRows = (branch.department_counts || []).map((dept) => ({
//         ...branchRow,
//         Department: dept.department || "N/A",
//         "Dept Employees": dept.employee_count,
//         "Dept Present": dept.present_count,
//         "Dept Absent": dept.absent_count,
//         "Dept On Leave": dept.leave_count,
//         "Dept Approved Leave": dept.approved_leave_count,
//         "Dept Half Day Leave": dept.half_day_leave_count,
//         "Dept Hourly Leave": dept.hourly_leave_count,
//         "Dept Waiting for Login": dept.waitingforlogin_count,
//       }));

//       const teamRows = (branch.team_counts || []).map((team) => ({
//         ...branchRow,
//         "Team ID": team.team_id,
//         "Team Name": team.team_name,
//         "Team Lead": team.teamleadname,
//         "Team Employees": team.employee_count,
//         "Team Present": team.present_count,
//         "Team Absent": team.absent_count,
//         "Team On Leave": team.leave_count,
//         "Team Approved Leave": team.approved_leave_count,
//         "Team Half Day Leave": team.half_day_leave_count,
//         "Team Hourly Leave": team.hourly_leave_count,
//         "Team Waiting for Login": team.waitingforlogin_count,
//       }));

//       return [...departmentRows, ...teamRows];
//     });

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     XLSX.utils.book_append_sheet(wb, ws, "Attendance Summary");
//     XLSX.writeFile(wb, "AttendanceReport.xlsx");
//   };

//   // ==================== Totals ====================
//   const calculateTotals = () => {
//     if (!reportData) return null;

//     const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];

//     return branches.reduce(
//       (acc, branch) => {
//         if (!branch) return acc;

//         return {
//           totalEmployees: acc.totalEmployees + (branch.total_employees || 0),
//           activeEmployees: acc.activeEmployees + (branch.total_active_employees || 0),
//           present: acc.present + (branch.attendance_summary?.present_count || 0),
//           absent: acc.absent + (branch.attendance_summary?.absent_count || 0),
//           leave: acc.leave + (branch.attendance_summary?.leave_count || 0),
//           approvedLeave: acc.approvedLeave + (branch.attendance_summary?.approved_leave_count || 0),
//           halfDayLeave: acc.halfDayLeave + (branch.attendance_summary?.half_day_leave_count || 0),
//           hourlyLeave: acc.hourlyLeave + (branch.attendance_summary?.hourly_leave_count || 0),
//           waitingForLogin: acc.waitingForLogin + (branch.attendance_summary?.waitingforlogin_count || 0),
//         };
//       },
//       {
//         totalEmployees: 0,
//         activeEmployees: 0,
//         present: 0,
//         absent: 0,
//         leave: 0,
//         approvedLeave: 0,
//         halfDayLeave: 0,
//         hourlyLeave: 0,
//         waitingForLogin: 0,
//       }
//     );
//   };

//   const totals = calculateTotals();

//   // ==================== Card Component ====================
//   const Card = ({ value, icon, label, color }: any) => (
//     <div className="flex flex-col bg-white w-full h-[100px] shadow-lg rounded-lg items-center justify-center dark:bg-gray-800">
//       <p className={`text-xl font-extrabold ${color}`}>{value}</p>
//       <div className="flex gap-2">
//         {icon}
//         <h1 className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</h1>
//       </div>
//     </div>
//   );

//   // ==================== Department Table ====================
//   const departmentThead = () => [
//     { data: "Department" },
//     { data: "Total" },
//     { data: "Present", icon: <CheckCircle className="inline text-green-500" size={16} /> },
//     { data: "Absent", icon: <XCircle className="inline text-red-500" size={16} /> },
//     { data: "On Leave", icon: <Clock className="inline text-yellow-500" size={16} /> },
//     { data: "Approved Leave", icon: <UserCheck className="inline text-blue-500" size={16} /> },
//     { data: "Waiting", icon: <ClockFading className="inline text-gray-500" size={16} /> },
//   ];

//   const departmentTbody = () => {
//     if (!reportData) return [];

//     const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];
//     const departmentMap = new Map();

//     branches.forEach((branch) => {
//       if (!branch) return;
//       (branch.department_counts || []).forEach((dept) => {
//         const key = dept.department || "Unknown";
//         if (!departmentMap.has(key)) {
//           departmentMap.set(key, {
//             department: key,
//             employee_count: 0,
//             present_count: 0,
//             absent_count: 0,
//             leave_count: 0,
//             approved_leave_count: 0,
//             half_day_leave_count: 0,
//             hourly_leave_count: 0,
//             waitingforlogin_count: 0,
//           });
//         }
//         const existing = departmentMap.get(key);
//         departmentMap.set(key, {
//           department: key,
//           employee_count: existing.employee_count + (dept.employee_count || 0),
//           present_count: existing.present_count + (dept.present_count || 0),
//           absent_count: existing.absent_count + (dept.absent_count || 0),
//           leave_count: existing.leave_count + (dept.leave_count || 0),
//           approved_leave_count: existing.approved_leave_count + (dept.approved_leave_count || 0),
//           half_day_leave_count: existing.half_day_leave_count + (dept.half_day_leave_count || 0),
//           hourly_leave_count: existing.hourly_leave_count + (dept.hourly_leave_count || 0),
//           waitingforlogin_count: existing.waitingforlogin_count + (dept.waitingforlogin_count || 0),
//         });
//       });
//     });

//     return Array.from(departmentMap.values()).map((dept, index) => ({
//       id: `${dept.department}-${index}`,
//       data: [
//         { data: dept.department || "N/A" },
//         { data: dept.employee_count },
//         { data: dept.present_count },
//         { data: dept.absent_count },
//         { data: dept.leave_count },
//         { data: dept.approved_leave_count },
//         { data: dept.waitingforlogin_count },
//       ],
//     }));
//   };

//   // ==================== Team Table ====================
//   const teamThead = () => [
//     { data: "Team" },
//     { data: "Team Lead" },
//     { data: "Total" },
//     { data: "Present", icon: <CheckCircle className="inline text-green-500" size={16} /> },
//     { data: "Absent", icon: <XCircle className="inline text-red-500" size={16} /> },
//     { data: "On Leave", icon: <Clock className="inline text-yellow-500" size={16} /> },
//     { data: "Approved Leave", icon: <UserCheck className="inline text-blue-500" size={16} /> },
//     { data: "Waiting", icon: <ClockFading className="inline text-gray-500" size={16} /> },
//   ];

//   const teamTbody = () => {
//     if (!reportData) return [];
//     const branches = Array.isArray(reportData.data) ? reportData.data : [reportData.data];
//     const allTeams = branches.flatMap((branch) => {
//       if (!branch) return [];
//       return (branch.team_counts || []).map((team) => ({ ...team, branch_name: branch.branch_name }));
//     });

//     return allTeams.map((team, index) => ({
//       id: team.team_id || `team-${index}`,
//       data: [
//         { data: team.team_name },
//         { data: team.teamleadname },
//         { data: team.employee_count },
//         { data: team.present_count },
//         { data: team.absent_count },
//         { data: team.leave_count },
//         { data: team.approved_leave_count },
//         { data: team.waitingforlogin_count },
//       ],
//     }));
//   };

//   // ==================== Render Component ====================
//   return (
//     <>
//       <Toaster position={toastposition} reverseOrder={false} />

//       {/* Header & Filters */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-4">
//           Attendance Report
//         </h2>
//       </div>

//       <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
//         <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
//           {userRole === "superadmin" && (
//             <Dropdown
//               options={filterOptions}
//               selectedValue={selectedFilter}
//               onSelect={setSelectedFilter}
//               placeholder="Filter By Branch"
//               className="w-full md:w-[250px]"
//               isLoading={isStoreLoading}
//             />
//           )}
//           <div className="w-full md:w-[300px]">
//             <DatePicker
//               selectsRange={true}
//               startDate={startDate}
//               endDate={endDate}
//               onChange={handleDateChange}
//               placeholderText="Select date range"
//               className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
//               isClearable={true}
//             />
//           </div>
//         </div>

//         <div className="flex gap-4">
//           <button
//             onClick={generateReport}
//             className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-none font-medium text-sm rounded-sm px-4 py-2"
//             disabled={loading}
//           >
//             {loading ? <ButtonLoader /> : "Refresh"}
//           </button>
//           <button
//             onClick={handleOnExport}
//             className="flex items-center justify-center text-gray-400 bg-white focus:outline-none font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2"
//           >
//             <FileDown className="mr-1" />
//             Export Excel
//           </button>
//         </div>
//       </div>

//       {/* Totals */}
//       {totals && (
//         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
//           <Card value={totals.totalEmployees} icon={<Users className="text-blue-600" size={20} />} label="Total Employees" color="text-blue-600" />
//           <Card value={totals.activeEmployees} icon={<UserCheck className="text-green-600" size={20} />} label="Active Employees" color="text-green-600" />
//           <Card value={totals.present} icon={<CheckCircle className="text-green-600" size={20} />} label="Present Today" color="text-green-600" />
//           <Card value={totals.absent} icon={<XCircle className="text-red-600" size={20} />} label="Absent Today" color="text-red-600" />
//           <Card value={totals.leave} icon={<Clock className="text-yellow-600" size={20} />} label="On Leave" color="text-yellow-600" />
//           <Card value={totals.approvedLeave} icon={<BookCheck className="text-purple-600" size={20} />} label="Approved Leave" color="text-purple-600" />
//           <Card value={totals.halfDayLeave} icon={<ClockFading className="text-orange-600" size={20} />} label="Half Day Leave" color="text-orange-600" />
//           <Card value={totals.waitingForLogin} icon={<ArrowRightToLine className="text-gray-600" size={20} />} label="Waiting for Login" color="text-gray-600" />
//         </div>
//       )}

//       {/* Tabs */}
//       <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
//         {tabs.map((tab) => (
//           <button
//             key={tab.id}
//             className={`px-4 py-2 font-medium text-sm ${
//               activeTab === tab.id
//                 ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]"
//                 : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
//             }`}
//             onClick={() => setActiveTab(tab.id)}
//           >
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Search */}
//       <div className="mb-4">
//         <SearchInput
//           value={searchTerm}
//           onChange={setSearchTerm}
//           placeholder={`Search ${activeTab === "department" ? "departments" : "teams"}...`}
//         />
//       </div>

//       {/* DataTable */}
//       {activeTab === "department" ? (
//         <DataTable thead={departmentThead} tbody={departmentTbody} maxHeight="500px" />
//       ) : (
//         <DataTable thead={teamThead} tbody={teamTbody} maxHeight="500px" />
//       )}

//       {/* Pagination */}
//       <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
//         <CustomPagination
//           total={activeTab === "department" ? departmentTbody().length : teamTbody().length}
//           currentPage={currentPage}
//           defaultPageSize={10}
//           onPageChange={setCurrentPage}
//         />
//       </div>
//     </>
//   );
// };

// export default AttendanceReport;

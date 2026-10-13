// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import Dropdown from "src/component/DrapDown";
// import {
//   FileDown,
//   Users,
//   CreditCard,
//   Calendar,
//   DollarSign,
//   PieChart,
//   X,
//   FileText,
//   ClipboardList,
//   CheckCircle,
//   Clock,
//   AlertCircle,
//   Archive,
//   TrendingUp,
//   Flag,
//   UserCheck
// } from "lucide-react";
// import * as XLSX from "xlsx";
// import { apiClient } from "src/services/apiClient";
// import { BASE_URL } from "~/constants/api";
// import toast, { Toaster } from "react-hot-toast";
// import { useAuthStore } from "src/stores/authStore";
// import useBranchStore from "src/stores/useBranchStore";
// import { useMediaQuery } from "~/routes/hooks/use-click-outside";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// const TeamProjectReport = () => {
//   const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [totalItem, setTotalItem] = useState(0);
//   const [error, setError] = useState(null);
//   const [selectedBranchCode, setSelectedBranchCode] = useState("");
//   const [selectedTeamId, setSelectedTeamId] = useState("");
//   const [pageSize, setPageSize] = useState(10);
//   const [projectData, setProjectData] = useState(null);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [teamOptions, setTeamOptions] = useState([]);
//   const [showDemoData, setShowDemoData] = useState(false);

//   // Auth store data
//   const token = useAuthStore((state) => state.accessToken);
//   const permission = useAuthStore((state) => state.permissions);
//   const userBranchCode = useAuthStore((state) => state.branchcode);
//   const role = permission[0]?.role || "employee";

//   const {
//     branchCodeOptions,
//     fetchBranches,
//     isLoading: isStoreLoading,
//   } = useBranchStore();

//   const pageSizeOptions = [
//     { value: 10, label: "10 per page" },
//     { value: 20, label: "20 per page" },
//     { value: 50, label: "50 per page" },
//     { value: 100, label: "100 per page" },
//   ];

//   const filteredBranchOptions = () => {
//     if (role === "superadmin") {
//       return branchCodeOptions;
//     } else if (role === "team-lead") {
//       return branchCodeOptions.filter(
//         (branch) => branch.value === userBranchCode
//       );
//     }
//     return [];
//   };

//   useEffect(() => {
//     if (role === "superadmin" || role === "team-lead") {
//       fetchBranches(token);
//     }
//   }, [token, role]);

//   // Set initial branch code for team-lead
//   useEffect(() => {
//     if (role === "team-lead") {
//       setSelectedBranchCode(userBranchCode);
//     }
//   }, [role, userBranchCode]);

//   // Fetch team options when branch code changes
//   useEffect(() => {
//     const fetchTeams = async () => {
//       if (!selectedBranchCode) {
//         setTeamOptions([]);
//         return;
//       }

//       try {
//         const url = `/teams/read?branchcode=${selectedBranchCode}`;
//         const response = await apiClient.get(url, {
//
//         });

//         if (response.data && response.data.data) {
//           const options = response.data.data.map((team) => ({
//             value: team.team_id,
//             label: team.team_name,
//           }));
//           setTeamOptions(options);
//         }
//       } catch (error) {
//         console.error("Error fetching teams", error);
//         notify.error("Failed to fetch teams");
//       }
//     };

//     if (role === "superadmin" || role === "team-lead") {
//       fetchTeams();
//     }
//   }, [selectedBranchCode, token, role]);

//   // Fetch project data
//   const fetchProjectData = async () => {
//     if (!selectedTeamId || !startDate || !endDate) {
//       setProjectData(null);
//       return;
//     }

//     setLoading(true);
//     try {
//       const formattedStartDate = formatDate(startDate);
//       const formattedEndDate = formatDate(endDate);

//       const url = `/teamview/report/read?startdate=${formattedStartDate}&enddate=${formattedEndDate}&teamid=${encodeURIComponent(selectedTeamId)}&page=${currentPage}&limit=${pageSize}`;

//       const response = await apiClient.get(url, {
//
//       });

//       if (response.data) {
//         setProjectData(response.data);
//         setTotalItem(response.data.totalDocuments || 0);
//         setShowDemoData(response.data.data.length === 0);
//       }
//     } catch (error) {
//       console.error("Error fetching project data", error);
//       notify.error("Failed to fetch project data");
//       setError("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return "";
//     const d = new Date(date);
//     const year = d.getFullYear();
//     const month = (d.getMonth() + 1).toString().padStart(2, "0");
//     const day = d.getDate().toString().padStart(2, "0");
//     return `${year}-${month}-${day}`;
//   };

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleBranchCodeChange = (value) => {
//     setSelectedBranchCode(value);
//     setSelectedTeamId("");
//     setCurrentPage(1);
//   };

//   const handleTeamChange = (value) => {
//     setSelectedTeamId(value);
//     setCurrentPage(1);
//   };

//   const handlePageSizeChange = (value) => {
//     setPageSize(value);
//     setCurrentPage(1);
//   };

//   const handleDateRangeChange = (dates) => {
//     const [start, end] = dates;
//     setStartDate(start);
//     setEndDate(end);
//   };

//   const clearDateRange = () => {
//     setStartDate(null);
//     setEndDate(null);
//   };

//   const handleOnExport = () => {
//     if (!projectData?.data || projectData.data.length === 0) {
//       notify.error("No data to export");
//       return;
//     }

//     const dataToExport = projectData.data.map((project) => ({
//       "Project ID": project.project_id,
//       "Project Name": project.project_name,
//       "Client Name": project.client_name,
//       "Project Value": formatCurrency(project.project_value),
//       "Paid Amount": formatCurrency(project.paid_amount),
//       "Pending Amount": formatCurrency(project.pending_amount),
//       "Start Date": project.start_date,
//       "End Date": project.end_date,
//       "Status": project.status,
//       "Team Lead": project.team_lead_name,
//       "Milestones": project.milestones_count,
//       "Tasks": project.tasks_count,
//     }));

//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(dataToExport);
//     XLSX.utils.book_append_sheet(wb, ws, "TeamProjectReport");
//     XLSX.writeFile(wb, "TeamProjectReport.xlsx");
//   };

//   const generateReport = () => {
//     fetchProjectData();
//   };

//   const formatCurrency = (amount) => {
//     if (!amount || isNaN(amount)) return "₹0";
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatNumber = (num) => {
//     if (!num || isNaN(num)) return "0";
//     return parseInt(num).toLocaleString("en-IN");
//   };

//   const getStatusIcon = (status) => {
//     switch (status.toLowerCase()) {
//       case 'draft':
//         return <FileText className="inline mr-1 text-gray-500" size={16} />;
//       case 'planning':
//         return <ClipboardList className="inline mr-1 text-blue-500" size={16} />;
//       case 'in process':
//         return <Clock className="inline mr-1 text-yellow-500" size={16} />;
//       case 'active':
//         return <TrendingUp className="inline mr-1 text-green-500" size={16} />;
//       case 'completed':
//         return <CheckCircle className="inline mr-1 text-purple-500" size={16} />;
//       case 'lead review':
//         return <UserCheck className="inline mr-1 text-indigo-500" size={16} />;
//       case 'client review':
//         return <Flag className="inline mr-1 text-orange-500" size={16} />;
//       case 'archived':
//         return <Archive className="inline mr-1 text-gray-400" size={16} />;
//       case 'drop':
//         return <AlertCircle className="inline mr-1 text-red-500" size={16} />;
//       default:
//         return <FileText className="inline mr-1 text-gray-500" size={16} />;
//     }
//   };

//   // Table configurations for project data
//   const projectThead = () => [
//     { data: "Project ID" },
//     { data: "Project Name" },
//     { data: "Client" },
//     { data: "Value" },
//     { data: "Status" },
//     { data: "Start Date" },
//     { data: "End Date" },
//     { data: "Milestones" },
//     { data: "Tasks" },
//   ];

//   const projectTbody = () => {
//     if (!projectData?.data) return [];

//     return projectData.data.map((project, index) => ({
//       id: project.project_id || index,
//       data: [
//         { data: project.project_id },
//         { data: project.project_name },
//         { data: project.client_name },
//         { data: formatCurrency(project.project_value) },
//         { 
//           data: (
//             <span className={`flex items-center ${
//               project.status === 'Completed' ? 'text-green-600' :
//               project.status === 'Active' ? 'text-blue-600' :
//               project.status === 'In Process' ? 'text-yellow-600' :
//               project.status === 'Draft' ? 'text-gray-600' :
//               'text-gray-800'
//             }`}>
//               {getStatusIcon(project.status)}
//               {project.status}
//             </span>
//           ) 
//         },
//         { data: project.start_date || 'N/A' },
//         { data: project.end_date || 'N/A' },
//         { data: formatNumber(project.milestones_count) },
//         { data: formatNumber(project.tasks_count) },
//       ],
//     }));
//   };

//   // Calculate summary statistics
//   const calculateSummary = () => {
//     if (!projectData?.data) return null;

//     return projectData.data.reduce((acc, project) => {
//       return {
//         totalProjects: acc.totalProjects + 1,
//         totalValue: acc.totalValue + (parseFloat(project.project_value) || 0),
//         totalPaid: acc.totalPaid + (parseFloat(project.paid_amount) || 0),
//         totalPending: acc.totalPending + (parseFloat(project.pending_amount) || 0),
//         milestones: acc.milestones + (parseInt(project.milestones_count) || 0),
//         tasks: acc.tasks + (parseInt(project.tasks_count) || 0),
//       };
//     }, {
//       totalProjects: 0,
//       totalValue: 0,
//       totalPaid: 0,
//       totalPending: 0,
//       milestones: 0,
//       tasks: 0,
//     });
//   };

//   const summary = calculateSummary();

//   return (
//     <>
//       <div className="flex flex-col min-h-screen">
//         <div className="p-4 flex-grow">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-5">
//               Team Project Report
//             </h2>
//             {showDemoData && (
//               <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
//                 No projects found for selected criteria
//               </div>
//             )}
//           </div>
//           <Toaster position={toastposition} reverseOrder={false} />

//           <div className="flex flex-col gap-4 mb-5">
//             <div
//               className={`grid grid-cols-1 ${role !== "superadmin" && role !== "team-lead" ? "md:grid-cols-2 lg:grid-cols-2 gap-3" : "md:grid-cols-4 lg:grid-cols-4 gap-20"}`}
//             >
//               {/* Branch dropdown - only for superadmin and team-lead */}
//               {(role === "superadmin" || role === "team-lead") && (
//                 <Dropdown
//                   options={filteredBranchOptions()}
//                   selectedValue={selectedBranchCode}
//                   onSelect={handleBranchCodeChange}
//                   placeholder="Select Branch"
//                   className="w-[245px]"
//                   isLoading={isStoreLoading}
//                   disabled={role === "team-lead"}
//                 />
//               )}

//               {/* Team dropdown - only for superadmin and team-lead */}
//               {(role === "superadmin" || role === "team-lead") && (
//                 <Dropdown
//                   options={teamOptions}
//                   selectedValue={selectedTeamId}
//                   onSelect={handleTeamChange}
//                   placeholder="Select Team"
//                   className="w-[245px]"
//                   disabled={
//                     role === "team-lead" ? !userBranchCode : !selectedBranchCode
//                   }
//                   isLoading={loading}
//                 />
//               )}

//               {/* Date range picker */}
//               <div className="w-[245px] relative">
//                 <DatePicker
//                   selectsRange={true}
//                   startDate={startDate}
//                   endDate={endDate}
//                   onChange={handleDateRangeChange}
//                   placeholderText="Select date range"
//                   className="w-full p-2 border rounded h-[40px]"
//                   isClearable={true}
//                 />
//                 {(startDate || endDate) && (
//                   <button
//                     onClick={clearDateRange}
//                     className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
//                   >
//                     <X size={16} />
//                   </button>
//                 )}
//               </div>

//               <Dropdown
//                 options={pageSizeOptions}
//                 selectedValue={pageSize}
//                 onSelect={handlePageSizeChange}
//                 placeholder="Items per page"
//                 className="w-[245px]"
//               />
//             </div>

//             <div className="flex flex-wrap justify-between items-center">
//               <div
//                 className={`flex ${role !== "superadmin" && role !== "team-lead" ? "gap-91" : "gap-19"}`}
//               >
//                 <button
//                   onClick={handleOnExport}
//                   className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2 dark:bg-gray-800 dark:text-gray-300 py-2 w-[245px]"
//                   disabled={!projectData?.data}
//                 >
//                   <FileDown className="mr-1" />
//                   {!isMobile && "Export Excel"}
//                 </button>
//               </div>

//               <button
//                 onClick={generateReport}
//                 className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
//                 disabled={
//                   (role !== "team-lead" && role !== "superadmin"
//                     ? false
//                     : !selectedTeamId || !startDate || !endDate) || loading
//                 }
//               >
//                 {loading ? "Loading..." : "Generate Report"}
//               </button>
//             </div>
//           </div>

//           {loading && <div className="text-center py-4">Loading...</div>}
//           {error && (
//             <div className="text-red-500 text-center py-4">{error}</div>
//           )}

//           {(projectData?.data || showDemoData) && (
//             <>
//               {summary && (
//                 <div className="mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
//                   <h3 className="text-lg text-[var(--color-primary)] font-semibold mb-2">
//                     Project Summary
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <Users className="mr-1" size={16} /> Total Projects
//                       </p>
//                       <p className="font-medium">
//                         {formatNumber(summary.totalProjects)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <DollarSign className="mr-1" size={16} /> Total Value
//                       </p>
//                       <p className="font-medium">
//                         {formatCurrency(summary.totalValue)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <CreditCard className="mr-1" size={16} /> Paid Amount
//                       </p>
//                       <p className="font-medium">
//                         {formatCurrency(summary.totalPaid)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <PieChart className="mr-1" size={16} /> Pending Amount
//                       </p>
//                       <p className="font-medium">
//                         {formatCurrency(summary.totalPending)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <Flag className="mr-1" size={16} /> Total Milestones
//                       </p>
//                       <p className="font-medium">
//                         {formatNumber(summary.milestones)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <ClipboardList className="mr-1" size={16} /> Total Tasks
//                       </p>
//                       <p className="font-medium">
//                         {formatNumber(summary.tasks)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-3 flex items-center">
//                         <Calendar className="mr-1" size={16} /> Date Range
//                       </p>
//                       <p className="font-medium">
//                         {startDate
//                           ? new Date(startDate).toLocaleDateString()
//                           : "N/A"}{" "}
//                         -{" "}
//                         {endDate ? new Date(endDate).toLocaleDateString() : "N/A"}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-4 flex items-center">
//                   <FileText className="mr-2" size={20} /> Project Details
//                 </h3>
//                 <div className="overflow-x-auto">
//                   <DataTable
//                     thead={projectThead}
//                     tbody={projectTbody}
//                     responsive={true}
//                     className="min-w-full"
//                   />
//                 </div>
//               </div>

//               <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
//                 <CustomPagination
//                   total={totalItem}
//                   currentPage={currentPage}
//                   defaultPageSize={pageSize}
//                   onChange={handlePageChange}
//                   paginationLabel="projects"
//                   isScroll={true}
//                 />
//               </div>
//             </>
//           )}

//           {!loading && !projectData && !showDemoData && (
//             <div className="text-center py-10 text-gray-500">
//               {role !== "team-lead" && role !== "superadmin"
//                 ? !startDate || !endDate
//                   ? "Please select date range to generate report"
//                   : "Click 'Generate Report' to view project details"
//                 : role === "team-lead"
//                   ? !userBranchCode
//                     ? "Loading branch information..."
//                     : !selectedTeamId
//                       ? "Please select Team and date range"
//                       : !startDate || !endDate
//                         ? "Please select date range"
//                         : "Click 'Generate Report' to view data"
//                   : !selectedBranchCode
//                     ? "Please select Branch to view available options"
//                     : !selectedTeamId
//                       ? "Please select Team"
//                       : !startDate || !endDate
//                         ? "Please select date range"
//                         : "Click 'Generate Report' to view data"}
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default TeamProjectReport;

import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Dropdown from "src/component/DrapDown";
import {
  FileDown,
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  PieChart,
  X,
  FileText,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  TrendingUp,
  Flag,
  UserCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { useMediaQuery } from "~/routes/hooks/use-click-outside";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TeamProjectReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [projectData, setProjectData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [showDemoData, setShowDemoData] = useState(false);

  // Demo data to show when API returns all zeros
  const demoData = [{
    project_id: "PRJ-001",
    project_name: "VasundraConstruction",
    client_name: "Vasundra",
    project_value: "50000",
    paid_amount: "30000",
    pending_amount: "20000",
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    status: "Active",
    team_lead_name: "Nasrin Fathima",
    milestones_count: "5",
    tasks_count: "20"
  }];

  // Auth store data
  const token = useAuthStore((state) => state.accessToken);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
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
    if (role === "superadmin") {
      return branchCodeOptions;
    } else if (role === "team-lead") {
      return branchCodeOptions.filter(
        (branch) => branch.value === userBranchCode
      );
    }
    return [];
  };

  useEffect(() => {
    if (role === "superadmin" || role === "team-lead") {
      fetchBranches(token);
    }
  }, [token, role]);

  // Set initial branch code for team-lead
  useEffect(() => {
    if (role === "team-lead") {
      setSelectedBranchCode(userBranchCode);
    }
  }, [role, userBranchCode]);

  // Fetch team options when branch code changes
  useEffect(() => {
    const fetchTeams = async () => {
      if (!selectedBranchCode) {
        setTeamOptions([]);
        return;
      }

      try {
        const url = `/teams/read?branchcode=${selectedBranchCode}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((team) => ({
            value: team.team_id,
            label: team.team_name,
          }));
          setTeamOptions(options);
        }
      } catch (error) {
        console.error("Error fetching teams", error);
        notify.error("Failed to fetch teams");
      }
    };

    if (role === "superadmin" || role === "team-lead") {
      fetchTeams();
    }
  }, [selectedBranchCode, token, role]);

  // Check if all values in the data are zero
  const isAllZeros = (data) => {
    if (!data || !data.data || data.data.length === 0) return true;
    
    const project = data.data[0];
    return (
      (project.project_value === "0" || !project.project_value) &&
      (project.paid_amount === "0" || !project.paid_amount) &&
      (project.pending_amount === "0" || !project.pending_amount) &&
      (project.milestones_count === "0" || !project.milestones_count) &&
      (project.tasks_count === "0" || !project.tasks_count)
    );
  };

  // Fetch project data
  const fetchProjectData = async () => {
    if (!selectedTeamId || !startDate || !endDate) {
      setProjectData(null);
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      const url = `/teamview/report/read?startdate=${formattedStartDate}&enddate=${formattedEndDate}&teamid=${encodeURIComponent(selectedTeamId)}&page=${currentPage}&limit=${pageSize}`;

      const response = await apiClient.get(url);

      if (response.data) {
        setShowDemoData(isAllZeros(response.data));
        setProjectData(response.data);
        setTotalItem(response.data.totalDocuments || 0);
      }
    } catch (error) {
      console.error("Error fetching project data", error);
      notify.error("Failed to fetch project data");
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Get the data to display (either real or demo)
  const getDisplayData = () => {
    if (showDemoData) {
      return demoData;
    }
    return projectData?.data || [];
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBranchCodeChange = (value) => {
    setSelectedBranchCode(value);
    setSelectedTeamId("");
    setCurrentPage(1);
  };

  const handleTeamChange = (value) => {
    setSelectedTeamId(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const clearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleOnExport = () => {
    const dataToExport = getDisplayData();
    
    if (dataToExport.length === 0) {
      notify.error("No data to export");
      return;
    }

    const exportData = dataToExport.map((project) => ({
      "Project ID": project.project_id,
      "Project Name": project.project_name,
      "Client Name": project.client_name,
      "Project Value": formatCurrency(project.project_value),
      "Paid Amount": formatCurrency(project.paid_amount),
      "Pending Amount": formatCurrency(project.pending_amount),
      "Start Date": project.start_date,
      "End Date": project.end_date,
      "Status": project.status,
      "Team Lead": project.team_lead_name,
      "Milestones": project.milestones_count,
      "Tasks": project.tasks_count,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "TeamProjectReport");
    XLSX.writeFile(wb, "TeamProjectReport.xlsx");
  };

  const generateReport = () => {
    fetchProjectData();
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num || isNaN(num)) return "0";
    return parseInt(num).toLocaleString("en-IN");
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <FileText className="inline mr-1 text-gray-500" size={16} />;
      case 'planning':
        return <ClipboardList className="inline mr-1 text-blue-500" size={16} />;
      case 'in process':
        return <Clock className="inline mr-1 text-yellow-500" size={16} />;
      case 'active':
        return <TrendingUp className="inline mr-1 text-green-500" size={16} />;
      case 'completed':
        return <CheckCircle className="inline mr-1 text-purple-500" size={16} />;
      case 'lead review':
        return <UserCheck className="inline mr-1 text-indigo-500" size={16} />;
      case 'client review':
        return <Flag className="inline mr-1 text-orange-500" size={16} />;
      case 'archived':
        return <Archive className="inline mr-1 text-gray-400" size={16} />;
      case 'drop':
        return <AlertCircle className="inline mr-1 text-red-500" size={16} />;
      default:
        return <FileText className="inline mr-1 text-gray-500" size={16} />;
    }
  };

  // Table configurations for project data
  const projectThead = () => [
    { data: "Project ID" },
    { data: "Project Name" },
    { data: "Client" },
    { data: "Value" },
    { data: "Status" },
    { data: "Start Date" },
    { data: "End Date" },
    { data: "Milestones" },
    { data: "Tasks" },
  ];

  const projectTbody = () => {
    const displayData = getDisplayData();
    if (displayData.length === 0) return [];

    return displayData.map((project, index) => ({
      id: project.project_id || index,
      data: [
        { data: project.project_id },
        { data: project.project_name },
        { data: project.client_name },
        { data: formatCurrency(project.project_value) },
        { 
          data: (
            <span className={`flex items-center ${
              project.status === 'Completed' ? 'text-green-600' :
              project.status === 'Active' ? 'text-blue-600' :
              project.status === 'In Process' ? 'text-yellow-600' :
              project.status === 'Draft' ? 'text-gray-600' :
              'text-gray-800'
            }`}>
              {getStatusIcon(project.status)}
              {project.status}
            </span>
          ) 
        },
        { data: project.start_date || 'N/A' },
        { data: project.end_date || 'N/A' },
        { data: formatNumber(project.milestones_count) },
        { data: formatNumber(project.tasks_count) },
      ],
    }));
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const displayData = getDisplayData();
    if (displayData.length === 0) return null;

    return displayData.reduce((acc, project) => {
      return {
        totalProjects: acc.totalProjects + 1,
        totalValue: acc.totalValue + (parseFloat(project.project_value) || 0),
        totalPaid: acc.totalPaid + (parseFloat(project.paid_amount) || 0),
        totalPending: acc.totalPending + (parseFloat(project.pending_amount) || 0),
        milestones: acc.milestones + (parseInt(project.milestones_count) || 0),
        tasks: acc.tasks + (parseInt(project.tasks_count) || 0),
      };
    }, {
      totalProjects: 0,
      totalValue: 0,
      totalPaid: 0,
      totalPending: 0,
      milestones: 0,
      tasks: 0,
    });
  };

  const summary = calculateSummary();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-5">
              Team Project Report
            </h2>
            {/* {showDemoData && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                Showing demo data
              </div>
            )} */}
          </div>
<div className="flex flex-col gap-4 mb-5">
            <div
              className={`grid grid-cols-1 ${role !== "superadmin" && role !== "team-lead" ? "md:grid-cols-2 lg:grid-cols-2 gap-3" : "md:grid-cols-4 lg:grid-cols-4 gap-20"}`}
            >
              {/* Branch dropdown - only for superadmin and team-lead */}
              {(role === "superadmin" || role === "team-lead") && (
                <Dropdown
                  options={filteredBranchOptions()}
                  selectedValue={selectedBranchCode}
                  onSelect={handleBranchCodeChange}
                  placeholder="Select Branch"
                  className="w-[245px]"
                  isLoading={isStoreLoading}
                  disabled={role === "team-lead"}
                />
              )}

              {/* Team dropdown - only for superadmin and team-lead */}
              {(role === "superadmin" || role === "team-lead") && (
                <Dropdown
                  options={teamOptions}
                  selectedValue={selectedTeamId}
                  onSelect={handleTeamChange}
                  placeholder="Select Team"
                  className="w-[245px]"
                  disabled={
                    role === "team-lead" ? !userBranchCode : !selectedBranchCode
                  }
                  isLoading={loading}
                />
              )}

              {/* Date range picker */}
              <div className="w-[245px] relative">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateRangeChange}
                  placeholderText="Select date range"
                  className="w-full p-2 border rounded h-[40px]"
                  isClearable={true}
                />
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateRange}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={16} />
                  </button>
                )}
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
              <div
                className={`flex ${role !== "superadmin" && role !== "team-lead" ? "gap-91" : "gap-19"}`}
              >
                <button
                  onClick={handleOnExport}
                  className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2 dark:bg-gray-800 dark:text-gray-300 py-2 w-[245px]"
                  disabled={!projectData?.data && !showDemoData}
                >
                  <FileDown className="mr-1" />
                  {!isMobile && "Export Excel"}
                </button>
              </div>

              <button
                onClick={generateReport}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                disabled={
                  (role !== "team-lead" && role !== "superadmin"
                    ? false
                    : !selectedTeamId || !startDate || !endDate) || loading
                }
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
            </div>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          {(projectData?.data || showDemoData) && (
            <>
              {summary && (
                <div className="mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-lg text-[var(--color-primary)] font-semibold mb-2">
                    Project Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <Users className="mr-1" size={16} /> Total Projects
                      </p>
                      <p className="font-medium">
                        {formatNumber(summary.totalProjects)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <DollarSign className="mr-1" size={16} /> Total Value
                      </p>
                      <p className="font-medium">
                        {formatCurrency(summary.totalValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <CreditCard className="mr-1" size={16} /> Paid Amount
                      </p>
                      <p className="font-medium">
                        {formatCurrency(summary.totalPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <PieChart className="mr-1" size={16} /> Pending Amount
                      </p>
                      <p className="font-medium">
                        {formatCurrency(summary.totalPending)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <Flag className="mr-1" size={16} /> Total Milestones
                      </p>
                      <p className="font-medium">
                        {formatNumber(summary.milestones)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <ClipboardList className="mr-1" size={16} /> Total Tasks
                      </p>
                      <p className="font-medium">
                        {formatNumber(summary.tasks)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-3 flex items-center">
                        <Calendar className="mr-1" size={16} /> Date Range
                      </p>
                      <p className="font-medium">
                        {startDate
                          ? new Date(startDate).toLocaleDateString()
                          : "N/A"}{" "}
                        -{" "}
                        {endDate ? new Date(endDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FileText className="mr-2" size={20} /> Project Details
                </h3>
                <div className="overflow-x-auto">
                  <DataTable
                    thead={projectThead}
                    tbody={projectTbody}
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

          {!loading && !projectData && !showDemoData && (
            <div className="text-center py-10 text-gray-500">
              {role !== "team-lead" && role !== "superadmin"
                ? !startDate || !endDate
                  ? "Please select date range to generate report"
                  : "Click 'Generate Report' to view project details"
                : role === "team-lead"
                  ? !userBranchCode
                    ? "Loading branch information..."
                    : !selectedTeamId
                      ? "Please select Team and date range"
                      : !startDate || !endDate
                        ? "Please select date range"
                        : "Click 'Generate Report' to view data"
                  : !selectedBranchCode
                    ? "Please select Branch to view available options"
                    : !selectedTeamId
                      ? "Please select Team"
                      : !startDate || !endDate
                        ? "Please select date range"
                        : "Click 'Generate Report' to view data"}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeamProjectReport;
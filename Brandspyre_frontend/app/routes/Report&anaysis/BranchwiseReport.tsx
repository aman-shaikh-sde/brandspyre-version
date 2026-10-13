// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";
// import Dropdown from "src/component/DrapDown";
// import { FileDown, PenBox } from "lucide-react";
// import * as XLSX from "xlsx";
// import { Link } from "react-router";
// import { apiClient } from "src/services/apiClient";
// import { BASE_URL } from "~/constants/api";
// import CreateBranchForm from "../Branch/CreateBranchForm";
// import toast, { Toaster } from "react-hot-toast";
// import EditBranchForm from "../Branch/EditFormData";
// import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
// import { useAuthStore } from "src/stores/authStore";
// import useBranchStore from "../../../src/stores/useBranchStore";
// import { CgExport } from "react-icons/cg";
// import { Edit2, Eye, SquarePen, Trash2 } from "lucide-react";
// import { useMediaQuery } from "../hooks/use-click-outside";
// import Leave from "../Leave/Leave";
// import AddNewLeaveType from "../Leave/CreateLeaveRequestForm";
// import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
// import DynamicLineGraph from "src/component/graphComponents/DynamicLineGraph";
// import { FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
// import DynamicBarChart from "src/component/graphComponents/DynamicBarChart";
// import DynamicPieChart from "src/component/graphComponents/DynamicPieChart";

// const BranchWiseReport = () => {
//   const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedFilter, setSelectedFilter] = useState("");
//   const [sheetData, setSheetData] = useState([]);
//   const [selectStatus, setSelectStatus] = useState("");
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [totalItem, setTotalItem] = useState(0);
//   const [error, setError] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedBranch, setSelectedBranch] = useState();
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [deleteId, setDeleteId] = useState("");
//   const [sortOrder, setSortOrder] = useState("");
//   const [selectedManager, setSelectedManager] = useState("");
//   const [selectedBranchCode, setSelectedBranchCode] = useState("");
//   const [pageSize, setPageSize] = useState(8);
//   const [showFilters, setShowFilters] = useState(false);
//   const token = useAuthStore((state) => state.accessToken);
//   const {
//     branches,
//     managerOptions,
//     branchCodeOptions,
//     fetchBranches,
//     isLoading: isStoreLoading,
//   } = useBranchStore();

//   const statusOptions = [
//     { value: "", label: "All Branches" },
//     { value: "active", label: "Active Branches" },
//     { value: "inactive", label: "Inactive Branches" },
//   ];

//   const pageSizeOptions = [
//     { value: 20, label: "20 per page" },
//     { value: 40, label: "30 per page" },
//     { value: 50, label: "40 per page" },
//     { value: 80, label: "50 per page" },
//     { value: 100, label: "100 per page" },
//     { value: 200, label: "100 per page" },
//   ];

//   useEffect(() => {
//     fetchBranches(token);
//   }, [token]);

//   // const getBranch = async (
//   //   page = currentPage,
//   //   limit = pageSize,
//   //   search = searchTerm,
//   //   status = selectStatus,
//   //   manager = selectedManager,
//   //   branchCode = selectedBranchCode,
//   //   sort = sortOrder
//   // ) => {
//   //   setLoading(true);
//   //   try {
//   //     let url = `/branch/read?page=${page}&limit=${limit}`;

//   //     if (search) url += `&search=${search}`;
//   //     if (status) url += `&status=${status}`;
//   //     if (manager) url += `&manager_id=${manager}`;
//   //     if (branchCode) url += `&branchcode=${branchCode}`;
//   //     if (sort) url += `&dec=${sort}`;

//   //     const response = await apiClient.get(url, {
//   //
//   //     });

//   //     setSheetData(response?.data);
//   //     setTotalItem(response?.data?.length || 0);
//   //     setData(response?.data || []);
//   //   } catch (error) {
//   //     console.error("Error fetching branch list", error);
//   //     setError("Failed to fetch branches");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // useEffect(() => {
//   //   getBranch();
//   // }, [
//   //   currentPage,
//   //   searchTerm,
//   //   selectStatus,
//   //   selectedManager,
//   //   selectedBranchCode,
//   //   sortOrder,
//   //   pageSize,
//   // ]);

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleCreateSuccess = () => {
//     setShowCreateModal(false);
//     notify.success("Branch added successfully!");
//     fetchBranches(token);

//   };

//   const handleSearch = (value) => {
//     setSearchTerm(value);
//     setCurrentPage(1);
//   };

//   const handleEditBranch = (branch) => {
//     setSelectedBranch(branch);
//     setShowEditModal(true);
//   };

//   const handleDeleteBranch = (id) => {
//     setShowDeleteModal(true);
//     setDeleteId(id);
//   };

//   // const handleDeleteSubmit = async () => {
//   //   const id = Number(deleteId);
//   //   const payload = { userId: "GK123" };

//   //   try {
//   //     setLoading(true);
//   //     const response = await apiClient.delete(`/branch/delete/${id}`, {
//   //       data: payload,
//   //
//   //     });

//   //     if (response?.status === 201) {
//   //       setShowDeleteModal(false);
//   //       notify.success("Branch deleted successfully!");
//   //       fetchBranches(token);
//   //     }
//   //   } catch (error) {
//   //     console.error("Error deleting branch", error);
//   //     notify.error("Failed to delete branch");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const toggleSortOrder = () => {
//     setSortOrder((prev) => (prev === "desc" ? "" : "desc"));
//     setCurrentPage(1);
//   };

//   const handleStatusChange = (value) => {
//     setSelectStatus(value);
//     setCurrentPage(1);
//   };

//   const handleManagerChange = (value) => {
//     setSelectedManager(value);
//     setCurrentPage(1);
//   };

//   const handleBranchCodeChange = (value) => {
//     setSelectedBranchCode(value);
//     setCurrentPage(1);
//   };

//   const handlePageSizeChange = (value) => {
//     setPageSize(value);
//     setCurrentPage(1);
//   };
//   const LeaveType = [
//     {
//       id: "1",
//       branch: "Branch1",
//       revnue: "?40L",
//       activeproject: "70",
//       overduepay: "?23L",
      
//     },
//      {
//       id: "2",
//       branch: "Branch 2",
//       revnue: "?40L",
//       activeproject: "70",
//       overduepay: "?23L",
      
//     },    {
//       id: "3",
//       branch: "Branch 3",
//       revnue: "?40L",
//       activeproject: "70",
//       overduepay: "?23L",
      
//     },    {
//       id: "4",
//       branch: "Branch 4",
//       revnue: "?40L",
//       activeproject: "70",
//       overduepay: "?23L",
      
//     },    {
//       id: "5",
//       branch: "Branch 5",
//       revnue: "?40L",
//       activeproject: "70",
//       overduepay: "?23L",
      
//     },
//         {
//       id: "6",
//       branch: "Branch 6",
//       revnue: "?40L",
//       activeproject: "70",
//       overduepay: "?23L",
      
//     },
//   ];
//   const thead = () => [
//     { data: "id" },
//     { data: "Branch Name" },
//     { data: "Revenue" },
//     { data: "Active Project" },
//     { data: "Overdue Payment" },
//     { data: "Actions" },
//   ];

//   const tbody = () => {
//     if (!LeaveType) return [];

//     return LeaveType.map((branch) => ({
//       id: branch.id,
//       data: [
//         { data: branch.id },
//         { data: branch.branch },
//                { data: branch.revnue},
//                       { data: branch.activeproject },
//                              { data: branch.overduepay},
//    {
//            data: (
//              <>
//                <div className="flex gap-4">
//                  <Link to="/campaign">
//                    <button className="bg-red-400/25 dark:bg-red-700/15 px-3 py-1 dark:text-red-200 text-red-700 rounded-full">
//                      <PenBox className="inline" size={20} />
//                    </button>
//                  </Link>
//                  <button className="bg-blue-400/25 dark:bg-red-700/15 px-3 py-1 dark:text-red-200 text-blue-700 rounded-full">
//                    <Eye className="inline" size={20} />
//                  </button>
//                </div>
//              </>
//            ),
//          },
   
//       ],
//     }));
//   };

//   const handleEditSuccess = () => {
//     setShowEditModal(false);
//     notify.success("Branch updated successfully!");
//     fetchBranches(token);
//   };

//   const handleOnExport = () => {
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(sheetData);
//     XLSX.utils.book_append_sheet(wb, ws, "Branches");
//     XLSX.writeFile(wb, "BranchList.xlsx");
//   };
//   const progressItems = [
//     {
//       type: "Completed",
//       value: 350,
//       color: "bg-green-500",
//       icon: <FaCheckCircle className="text-green-500 mr-2" />,
//       label: "Paid",
//     },
//     {
//       type: "pending",
//       value: 450,
//       color: "bg-yellow-500",
//       icon: <FaClock className="text-yellow-500 mr-2" />,
//       label: "Pending",
//     },
//     {
//       type: "overdue",
//       value: 200,
//       color: "bg-red-500",
//       icon: <FaExclamationCircle className="text-red-500 mr-2" />,
//       label: "Overdue",
//     },
//   ];
//   const lineGraphData = {
//     title: "Monthly Project Data",
//     labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
//     datasets: [
//       { label: "Paid", data: [65, 59, 80, 81, 56, 55] },
//       { label: "Un_Paid", data: [28, 48, 40, 19, 86, 27] },
//       { label: "Pending", data: [45, 25, 60, 91, 76, 35] },
//       { label: "OverDue", data: [35, 55, 30, 71, 66, 45] },
//     ],
//   };
//   const pieChartData = [
//     {
//       title: "Revenue",
//       labels: [
//         "Branch1",
//         "Branch2",
//         "Branch3",
//         "Branch4",
//         "Branch5",
//         "Branch6",
//       ],
//       values: [35, 25, 20, 20, 50, 72],
//       colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
//     },
//   ];
//   const theme = "light";
//   const chartData = {
//     title: "Branch wise Project",
//     labels: ["Branch1", "Branch2", "Branch3", "Branch4", "Branch5", "Branch6"],
//     datasets: [
//       {
//         label: "Sales",
//         data: [150, 200, 180, 200, 330, 220, 260],
//         backgroundColor: "rgba(34, 197, 94, 0.7)", // green
//         //   borderColor: 'rgba(34, 197, 94, 1)',
//       },
//     ],
//   };
//   return (
//     <>
//       <div className="flex flex-col min-h-screen">
//         <div className="flex justify-around mt-6">
//           <div className="w-[60%]">
//             <DynamicBarChart
//               data={chartData}
//               theme={theme}
//               className="h-[350px] w-[600px]"
//             />
//           </div>
//           <div className="w-[40%]">
//             {pieChartData.map((pieData, index) => (
//               <DynamicPieChart
//                 key={index}
//                 data={pieData}
//                 theme={theme}
//                 className="h-[350px] w-[380px]"
//               />
//             ))}
//           </div>
//         </div>
//         <div className="p-4 flex-grow">
//           <div className="flex justify-between items-center">
//             <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
//               Branch wise Report
//             </h2>
//             {isMobile && (
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="p-2 bg-gray-200 rounded-md"
//               >
//                 {showFilters ? "Hide Filters" : "Show Filters"}
//               </button>
//             )}
//           </div>
//           <Toaster position="top-center" reverseOrder={false} />

//           <div
//             className={`flex ${isMobile ? "flex-col" : "items-end justify-end"} gap-4 mb-5`}
//           >
//             <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}>
//               <Dropdown
//                 options={pageSizeOptions}
//                 selectedValue={pageSize}
//                 onSelect={handlePageSizeChange}
//                 placeholder="Items per page"
//                 className="w-full md:w-[150px]"
//               />
//               <button
//                 onClick={handleOnExport}
//                 className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
//               >
//                 <FileDown className="mr-1" />
//                 {!isMobile && "Export Excel"}
//               </button>
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
//               >
//                 {!isMobile && "Add New Type"} +
//               </button>
//             </div>
//           </div>

//           <div
//             className={`${isMobile && !showFilters ? "hidden" : "block"} mb-4`}
//           >
//             <div
//               className={`${isMobile ? "grid grid-cols-1 gap-3" : "flex flex-wrap justify-between items-center gap-3"}`}
//             >
//               <Dropdown
//                 options={statusOptions}
//                 selectedValue={selectStatus}
//                 onSelect={handleStatusChange}
//                 placeholder="Branch Status"
//                 className="w-full md:w-[200px]"
//               />

//               <Dropdown
//                 options={branchCodeOptions}
//                 selectedValue={selectedBranchCode}
//                 onSelect={handleBranchCodeChange}
//                 placeholder="Branch Code"
//                 className="w-full md:w-[200px]"
//                 isLoading={isStoreLoading}
//               />

//               <Dropdown
//                 options={managerOptions}
//                 selectedValue={selectedManager}
//                 onSelect={handleManagerChange}
//                 placeholder="Manager"
//                 className="w-full md:w-[200px]"
//                 isLoading={isStoreLoading}
//               />

//               <button
//                 onClick={toggleSortOrder}
//                 className={`${isMobile ? "w-full" : "w-[200px]"} h-[40px] text-white bg-[var(--color-primary)] hover-effect px-2 py-1 rounded-sm`}
//               >
//                 Sort {sortOrder === "desc" ? "?" : "?"}
//               </button>

//               <div className={`${isMobile ? "w-full" : "w-[200px] mt-3"}`}>
//                 <SearchInput
//                   value={searchTerm}
//                   onChange={handleSearch}
//                   placeholder="Search branches..."
//                   className="w-full"
//                 />
//               </div>
//             </div>
//           </div>

//           {loading && <div className="text-center py-4">Loading...</div>}
//           {error && (
//             <div className="text-red-500 text-center py-4">{error}</div>
//           )}

//           <div className="overflow-x-auto">
//             <DataTable
//               thead={thead}
//               tbody={tbody}
//               responsive={true}
//               className="min-w-full"
//             />
//           </div>
//         </div>

//         <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
//           <CustomPagination
//             total={totalItem}
//             currentPage={currentPage}
//             defaultPageSize={pageSize}
//             onChange={handlePageChange}
//             paginationLabel="branches"
//             isScroll={true}
//           />
//         </div>
//       </div>

//       <Modal
//         isVisible={showCreateModal}
//         className="w-full md:w-[800px]"
//         onClose={() => setShowCreateModal(false)}
//         title="Create New Branch"
//       >
//         <AddNewLeaveType onCancel={() => setShowCreateModal(false)} />
//       </Modal>

//       <Modal
//         isVisible={showEditModal}
//         className="w-full md:w-[800px]"
//         onClose={() => setShowEditModal(false)}
//         title="Edit Branch"
//       >
//         <EditBranchForm
//           branch={selectedBranch}
//           onSuccess={handleEditSuccess}
//           onCancel={() => setShowEditModal(false)}
//         />
//       </Modal>

//       <Modal
//         isVisible={showDeleteModal}
//         className="w-full md:w-[600px]"
//         onClose={() => setShowDeleteModal(false)}
//         title="Delete Branch"
//       >
//         <div className="flex flex-col gap-6 justify-center items-center">
//           <p className="text-gray-500 text-lg font-bold text-center">
//             Are you sure you want to delete this Type?
//           </p>
//           <div className="flex gap-4 flex-wrap justify-center">
//             <button
//               type="button"
//               className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-hover-secondary)] text-gray-800 hover-effect dark:text-gray-700 rounded dark:hover:bg-gray-500 transition"
//               disabled={loading}
//               onClick={() => setShowDeleteModal(false)}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-hover)] hover-effect transition"
//               disabled={loading}
//               // onClick={handleDeleteSubmit}
//             >
//               {loading ? <ButtonLoader /> : "Confirm"}
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </>
//   );
// };

// export default BranchWiseReport;
import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Dropdown from "src/component/DrapDown";
import { CalendarFold, FileDown, SquareKanban, UserCheck } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useMediaQuery } from "../hooks/use-click-outside";

const BranchSummaryReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("ASC");
  
  // Get auth store values
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const staticBranchCode = useAuthStore((state) => state.branchcode);

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

  const sortFieldOptions = [
    { value: "branchcode", label: "Branch Code" },
    { value: "total_projects", label: "Total Projects" },
    { value: "minor_priority_projects", label: "Minor Priority Projects" },
    { value: "major_priority_projects", label: "Major Priority Projects" },
    { value: "critical_priority_projects", label: "Critical Priority Projects" },
    { value: "blocker_priority_projects", label: "Blocker Priority Projects" },
    { value: "draft_projects", label: "Draft Projects" },
    { value: "inprocess_projects", label: "In Process Projects" },
    { value: "completed_projects", label: "Completed Projects" },
    { value: "total_milestones", label: "Total Milestones" },
    { value: "total_tasks", label: "Total Tasks" },
  ];

  const sortDirectionOptions = [
    { value: "ASC", label: "Ascending" },
    { value: "DESC", label: "Descending" },
  ];

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

  // Fetch report data when branch code changes
  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = `/report/branchsummary/read`;
      const params = new URLSearchParams();

      const branchCodeToUse = userRole === "superadmin" ? selectedBranchCode : staticBranchCode;
      if (branchCodeToUse) {
        params.append("branchcode", branchCodeToUse);
      }

      if (startDate) {
        params.append("start_date", formatDate(startDate));
      }

      if (endDate) {
        params.append("end_date", formatDate(endDate));
      }

      if (sortField) {
        params.append("sortField", sortField);
      }

      if (sortDirection) {
        params.append("sortDirection", sortDirection);
      }

      url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.data) {
        // Aggregate data by branch
        const aggregatedData = aggregateBranchData(response.data.data);
        setReportData({
          ...response.data,
          data: aggregatedData,
          aggregated: true
        });
        setTotalItem(aggregatedData.length);
      }
    } catch (error) {
      console.error("Error fetching branch summary report", error);
      notify.error("Failed to fetch branch summary report");
      setError("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  // Aggregate client data by branch
  const aggregateBranchData = (clientData) => {
    if (!clientData || clientData.length === 0) return [];
    
    // Group by branchcode
    const branchMap = {};
    
    clientData.forEach(client => {
      if (!branchMap[client.branchcode]) {
        branchMap[client.branchcode] = {
          branchcode: client.branchcode,
          total_projects: 0,
          minor_priority_projects: 0,
          major_priority_projects: 0,
          critical_priority_projects: 0,
          blocker_priority_projects: 0,
          draft_projects: 0,
          planning_projects: 0,
          inprocess_projects: 0,
          active_projects: 0,
          lead_review_projects: 0,
          completed_projects: 0,
          revised_projects: 0,
          client_review_projects: 0,
          drop_projects: 0,
          total_milestones: 0,
          draft_milestones: 0,
          inprocess_milestones: 0,
          archived_milestones: 0,
          drop_milestones: 0,
          verified_milestones: 0,
          total_tasks: 0,
          minor_priority_task: 0,
          major_priority_task: 0,
          critical_priority_task: 0,
          blocker_priority_task: 0,
          inprocess_tasks: 0,
          archived_tasks: 0,
          verified_closed_tasks: 0,
          client_count: 0
        };
      }
      
      const branch = branchMap[client.branchcode];
      
      // Sum all numeric fields
      Object.keys(client).forEach(key => {
        if (typeof client[key] === 'string' && !isNaN(client[key]) && client[key] !== '') {
          branch[key] = (branch[key] || 0) + parseInt(client[key]);
        }
      });
      
      branch.client_count += 1;
    });
    
    return Object.values(branchMap);
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

  const handleSortFieldChange = (value) => {
    setSortField(value);
  };

  const handleSortDirectionChange = (value) => {
    setSortDirection(value);
  };

  const handleOnExport = () => {
    if (!reportData?.data) {
      notify.error("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Export branch details
    const branchDetails = reportData.data.map(branch => ({
      "Branch Code": branch.branchcode,
      "Total Clients": branch.client_count,
      "Total Projects": branch.total_projects,
      "Minor Priority Projects": branch.minor_priority_projects,
      "Major Priority Projects": branch.major_priority_projects,
      "Critical Priority Projects": branch.critical_priority_projects,
      "Blocker Priority Projects": branch.blocker_priority_projects,
      "Draft Projects": branch.draft_projects,
      "Planning Projects": branch.planning_projects,
      "In Process Projects": branch.inprocess_projects,
      "Active Projects": branch.active_projects,
      "Lead Review Projects": branch.lead_review_projects,
      "Completed Projects": branch.completed_projects,
      "Revised Projects": branch.revised_projects,
      "Client Review Projects": branch.client_review_projects,
      "Dropped Projects": branch.drop_projects,
      "Total Milestones": branch.total_milestones,
      "Draft Milestones": branch.draft_milestones,
      "In Process Milestones": branch.inprocess_milestones,
      "Archived Milestones": branch.archived_milestones,
      "Dropped Milestones": branch.drop_milestones,
      "Verified Milestones": branch.verified_milestones,
      "Total Tasks": branch.total_tasks,
      "Minor Priority Tasks": branch.minor_priority_task,
      "Major Priority Tasks": branch.major_priority_task,
      "Critical Priority Tasks": branch.critical_priority_task,
      "Blocker Priority Tasks": branch.blocker_priority_task,
      "In Process Tasks": branch.inprocess_tasks,
      "Archived Tasks": branch.archived_tasks,
      "Verified/Closed Tasks": branch.verified_closed_tasks
    }));
    
    const wsBranch = XLSX.utils.json_to_sheet(branchDetails);
    XLSX.utils.book_append_sheet(wb, wsBranch, "Branch Summary");
    
    XLSX.writeFile(wb, "BranchSummaryReport.xlsx");
  };

  // Table headers for branch summary
  const branchThead = () => [
    { data: "Branch Code" },
    { data: "Total Clients" },
    { data: "Total Projects" },
    { data: "Draft Projects" },
    { data: "In Process" },
    { data: "Completed" },
    { data: "Total Milestones" },
    { data: "Total Tasks" },
  ];

  // Table body for branch summary
  const branchTbody = () => {
    if (!reportData?.data) return [];
    
    return reportData.data.map((branch, index) => ({
      id: branch.branchcode,
      data: [
        { data: branch.branchcode },
        { data: branch.client_count },
        { data: branch.total_projects },
        { data: branch.draft_projects },
        { data: branch.inprocess_projects },
        { data: branch.completed_projects },
        { data: branch.total_milestones },
        { data: branch.total_tasks },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              Branch Summary Report
            </h2>
          </div>
<div className="flex flex-col gap-4 mb-5 ml-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-40">
              {userRole === "superadmin" && (
                <Dropdown
                  options={branchCodeOptions}
                  selectedValue={selectedBranchCode}
                  onSelect={handleBranchCodeChange}
                  placeholder="Select Branch"
                  className="w-full"
                  isLoading={isStoreLoading}
                />
              )}
              
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
              
              <Dropdown
                options={pageSizeOptions}
                selectedValue={pageSize}
                onSelect={handlePageSizeChange}
                placeholder="Items per page"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-40">
              <Dropdown
                options={sortFieldOptions}
                selectedValue={sortField}
                onSelect={handleSortFieldChange}
                placeholder="Sort By Field"
                className="w-full"
              />
              
              <Dropdown
                options={sortDirectionOptions}
                selectedValue={sortDirection}
                onSelect={handleSortDirectionChange}
                placeholder="Sort Direction"
                className="w-full"
              />
              
              <div className="flex items-center justify-end">
                <button
                  onClick={fetchReportData}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5 w-full"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Generate Report"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleOnExport}
                className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2.5 dark:bg-gray-800 dark:text-gray-300 py-2.5 w-[285px]"
                disabled={!reportData?.data}
              >
                <FileDown className="mr-1" />
                {!isMobile && "Export Excel"}
              </button>
            </div>
          </div>

          {reportData && (
            <>
              {reportData.data.length > 0 ? (
                <>
                  <div className="mb-6">
                    <DataTable
                      thead={branchThead}
                      tbody={branchTbody}
                      responsive={true}
                      className="min-w-full"
                    />

                    <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
                      <CustomPagination
                        total={totalItem}
                        currentPage={currentPage}
                        defaultPageSize={pageSize}
                        onChange={handlePageChange}
                        paginationLabel="branches"
                        isScroll={true}
                      />
                    </div>
                  </div>

                  {/* Detailed Branch Summary Section */}
                  {selectedBranchCode && reportData.data.length === 1 && (
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg text-red-700 font-semibold mb-4">Detailed Branch Summary</h3>
                      
                      <div className="mb-4">
                        <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded shadow">
                          <p className="text-sm text-red-700 mb-1"><SquareKanban className="inline mr-2" size={16}/> Branch Code</p>
                          <p className="font-medium text-lg">{reportData.data[0].branchcode}</p>
                        </div>
                      </div>
                      
                      {/* Projects Summary */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold mb-3">Projects Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Total Projects</p>
                            <p className="font-medium">{reportData.data[0].total_projects}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Total Clients</p>
                            <p className="font-medium">{reportData.data[0].client_count}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Draft</p>
                            <p className="font-medium">{reportData.data[0].draft_projects}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">In Process</p>
                            <p className="font-medium">{reportData.data[0].inprocess_projects}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="font-medium">{reportData.data[0].completed_projects}</p>
                          </div>
                        </div>
                        
                        {/* Priority Summary */}
                        <h4 className="text-md font-semibold mb-3">Priority Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Minor</p>
                            <p className="font-medium">{reportData.data[0].minor_priority_projects}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Major</p>
                            <p className="font-medium">{reportData.data[0].major_priority_projects}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Critical</p>
                            <p className="font-medium">{reportData.data[0].critical_priority_projects}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Blocker</p>
                            <p className="font-medium">{reportData.data[0].blocker_priority_projects}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Milestones Summary */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold mb-3">Milestones Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Total Milestones</p>
                            <p className="font-medium">{reportData.data[0].total_milestones}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Draft</p>
                            <p className="font-medium">{reportData.data[0].draft_milestones}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">In Process</p>
                            <p className="font-medium">{reportData.data[0].inprocess_milestones}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Verified</p>
                            <p className="font-medium">{reportData.data[0].verified_milestones}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tasks Summary */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold mb-3">Tasks Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Total Tasks</p>
                            <p className="font-medium">{reportData.data[0].total_tasks}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">In Process</p>
                            <p className="font-medium">{reportData.data[0].inprocess_tasks}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Verified/Closed</p>
                            <p className="font-medium">{reportData.data[0].verified_closed_tasks}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Archived</p>
                            <p className="font-medium">{reportData.data[0].archived_tasks}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No data found for the selected filters
                </div>
              )}
            </>
          )}

          {!loading && !reportData && (
            <div className="text-center py-10 text-gray-500">
              {userRole === "superadmin" && !selectedBranchCode 
                ? "Please select a Branch to view report"
                : "Click 'Generate Report' to view data"}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BranchSummaryReport;
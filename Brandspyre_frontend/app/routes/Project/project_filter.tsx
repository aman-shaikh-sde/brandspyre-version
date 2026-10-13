// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";
// import Dropdown from "src/component/DrapDown";
// import {
//   ChartNetwork,
//   ClipboardType,
//   FileDown,
//   Network,
//   Tag,
// } from "lucide-react";
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
// import AddNewProject from "./AddNewProject";
// import EditProjectForm from "./ProjectDocuments/EditProjectForm";
// import useProjectStore from "src/stores/ProjectStore";
// import ProjectMeetingForm from "./Meeting/ProjectMeetingForm";
// const Project = () => {
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
//   const [deleteData, setDeleteData] = useState(null);
//   const [sortOrder, setSortOrder] = useState("");
//   const [selectedPriority, setSelectedPriority] = useState("");
//   const [selectedBranchCode, setSelectedBranchCode] = useState("");
//   const [pageSize, setPageSize] = useState(8);
//   const [showFilters, setShowFilters] = useState(false);
//   const token = useAuthStore((state) => state.accessToken);
//   const [showMeetingModal,setShowMeetingModal]=useState(false)
//   const [inActiveData, setInActiveData] = useState({
//     delete_type: "",
//     status: "",
//   });
//   //stores
//   const {fetchProject,
   
//      }=useProjectStore();
// const branchcode=useAuthStore((state)=>state.branchcode)
//   const {
//     branchCodeOptions,
//     fetchBranches,
//     isLoading: isStoreLoading,
//   } = useBranchStore();
//   const managerOptions = [
//     { value: "", label: "All Priority" },
//     { value: "minor", label: "Minor Projects" },
//     { value: "major", label: "Major Project" },
//     { value: "critical", label: "Critical Project" },
//     { value: "blocker", label: "Blocker Project" },
//   ];
//   const statusOptions = [
//     { value: "", label: "All Projects" },
//     { value: "active", label: "Active Projects" },
//     { value: "draft", label: "Draft Project" },
//     { value: "planning", label: "planning Project" },
//     { value: "paused", label: "paused Project" },
//     { value: "completed", label: "completed Project" },
//     { value: "revised", label: "revised Project" },
//     { value: "client_review", label: "client_review Project" },
//     { value: "drop", label: "drop Project" },
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
//     fetchProject(token,branchcode);
//   }, [token]);

//   const getBranch = async (
//     page = currentPage,
//     limit = pageSize,
//     search = searchTerm,
//     status = selectStatus,
//     priority = selectedPriority,
//     branchCode = selectedBranchCode,
//     sort = sortOrder
//   ) => {
//     setLoading(true);
//     try {
//       let url = `/project/overview/read?page=${page}&limit=${limit}`;

//       if (search) url += `&search=${search}`;
//       if (status) url += `&status=${status}`;
//       if (priority) url += `&priority=${priority}`;
//       if (branchCode) url += `&branchcode=${branchCode}`;
//       if (sort) url += `&dec=${sort}`;

//       const response = await apiClient.get(url, {
//
//       });

//       setSheetData(response?.data?.data);
//       setTotalItem(response?.data?.totalDocuments || 0);
//       setData(response?.data?.data || []);
//     } catch (error) {
//       console.error("Error fetching t list", error);
//       setError("Failed to fetch project");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     getBranch();
//   }, [
//     currentPage,
//     searchTerm,
//     selectStatus,
//     selectedPriority,
//     selectedBranchCode,
//     sortOrder,
//     pageSize,
//   ]);

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleCreateSuccess = () => {
//     setShowCreateModal(false);
//     notify.success("Project added successfully!");
//     fetchBranches(token);
//     getBranch();
//   };

//   const handleSearch = (value) => {
//     setSearchTerm(value);
//     setCurrentPage(1);
//   };

//   const handleEditBranch = (branch) => {
//     setSelectedBranch(branch);
//     setShowEditModal(true);
//   };

//   const handleDeleteBranch = (project) => {
//     setShowDeleteModal(true);
//     setDeleteData(project);
//   };

//   //   const handleDeleteSubmit = async () => {
//   //     const id=deleteData.id
//   //   const deletedData={
//   // data:{
//   //   branchcode:deleteData.branchcode,
//   //   campaign_code:deleteData.campaign_code
//   // }
//   //   }

//   //     try {
//   //       setLoading(true);
//   //       const response = await apiClient.delete(`/branch/delete/${id}`, {
//   //         data: payload,
//   //
//   //       });

//   //       if (response?.status === 201) {
//   //         setShowDeleteModal(false);
//   //         notify.success("Branch deleted successfully!");
//   //         fetchBranches(token);
//   //         getBranch();
//   //       }
//   //     } catch (error) {
//   //       console.error("Error deleting branch", error);
//   //       notify.error("Failed to delete branch");
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };
//   const handleDeleteSubmit = async () => {
//     const deletedData = {
//       data: {
//         branchcode: deleteData.branchcode,
//         project_code: deleteData.project_code,
//         delete_type: inActiveData.delete_type,
//         status: inActiveData.status,
//       },
//     };
//     console.log("projectdeleteddataa", deletedData);
//     try {
//       setLoading(true);
//       const response = await apiClient.delete(
//         `/project/overview/delete`,
//         {
//           data: deletedData,
//
//         }
//       );
//       console.log("deleteemployeeresponse", response);
//       if (response?.status === 201) {
//         setShowDeleteModal(false);
//         notify.success("Project Deleted Successfully!");
//         getBranch();
//         setLoading(false);
//         setInActiveData({
//           delete_type: "",
//           status: "",
//         });
//       }
//     } catch (error) {
//       console.error("Error deleting branch", error);
//       notify.error("Failed to delete branch");
//       setLoading(false);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const toggleSortOrder = () => {
//     setSortOrder((prev) => (prev === "desc" ? "" : "desc"));
//     setCurrentPage(1);
//   };

//   const handleStatusChange = (value) => {
//     setSelectStatus(value);
//     setCurrentPage(1);
//   };

//   const handleManagerChange = (value) => {
//     setSelectedPriority(value);
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
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setInActiveData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const thead = () => [
//     { data: "id" },
//     { data: "Branch Code" },
//     { data: "Project_Code" },
//     { data: "Project Name" },
//     { data: "Client_Code" },
//     { data: "Type" },
//     { data: "Budget" },
//     { data: "Duration_Days" },
   
//     { data: "Status" },
//     { data: "Actions", className: "text-center" },
//   ];

//   const tbody = () => {
//     if (!data) return [];

//     return data.map((project, index) => ({
//       id: project.id,
//       data: [
//         { data: index + 1 },

//         { data: project.branchcode },
//         { data: project.project_code },
//         { data: project.title },
//         { data: project.client_code },

//         { data: project.type },
//         { data: project.budget },

//         { data: project.duration_days },

//         {
//           data: (
//             <div
//               className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${project.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
//             >
//               <span
//                 className={`w-2 h-2 rounded-full mr-2 ${project.status === "active" ? "bg-green-800" : "bg-red-700"}`}
//               ></span>
//               {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
//             </div>
//           ),
//         },
//         {
//           data: (
//             <div className="flex  justify-center gap-2">
//               <Link to={`/project/${project.project_code}`}>
//                 <button className=" px-4 py-2 dark:text-blue-600 text-blue-700 rounded-sm">
//                   <Eye className="inline" size={20} />
//                 </button>
//               </Link>
//               <button
//                 className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
//                 onClick={() => handleEditBranch(project)}
//                 title="Edit"
//               >
//                 <SquarePen size={18} />
//               </button>
//               <button
//                 className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
//                 onClick={() => handleDeleteBranch(project)}
//                 title="Delete"
//               >
//                 <Trash2 size={18} />
//               </button>
//             </div>
//           ),
//           className: "action-cell",
//         },
//       ],
//     }));
//   };

//   const handleEditSuccess = () => {
//     setShowEditModal(false);
//     notify.success("Branch updated successfully!");
//     fetchBranches(token);
//     getBranch();
//   };
// const handleMeetingSuccess=()=>{
//      setShowMeetingModal(false);
//     notify.success("Meeting and Document Created successfully!");

// }
//   const handleOnExport = () => {
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(sheetData);
//     XLSX.utils.book_append_sheet(wb, ws, "Branches");
//     XLSX.writeFile(wb, "ProjectList.xlsx");
//   };

//   return (
//     <>
//       <div className="flex flex-col min-h-screen">
//         <div className="p-4 flex-grow">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
//               Project Management
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
//           <Toaster position={toastposition} reverseOrder={false} />

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
//                 {!isMobile && "New Project"} +
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
//                 selectedValue={selectedPriority}
//                 onSelect={handleManagerChange}
//                 placeholder="Priority"
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
//         title="Create New Project"
//       >
//         <AddNewProject
//           onSuccess={handleCreateSuccess}
//           onCancel={() => setShowCreateModal(false)}
//         />
//       </Modal>

//       <Modal
//         isVisible={showEditModal}
//         className="w-full md:w-[800px]"
//         onClose={() => setShowEditModal(false)}
//         title="Edit Project"
//       >
//         <EditProjectForm
//           project={selectedBranch}
//           onSuccess={handleEditSuccess}
//           onCancel={() => setShowEditModal(false)}
//         />
//       </Modal>
//  <Modal
//         isVisible={showMeetingModal}
//         className="w-full md:w-[800px]"
//         onClose={() =>setShowMeetingModal(false)}
//         title="Create Branch Meeting"
//       >
//         <ProjectMeetingForm
//            project={selectedBranch}
//           onSuccess={handleMeetingSuccess}
//           onCancel={() => setShowMeetingModal(false)}
//         />
//       </Modal>
//       <Modal
//         isVisible={showDeleteModal}
//         className="w-full md:w-[600px]"
//         onClose={() => setShowDeleteModal(false)}
//         title="Delete Project"
//       >
//         <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
//               <Network className="inline mr-2" /> Delete Project
//             </h3>

//             <p className="text-gray-500 text-sm font-medium text-center">
//               Are you sure you want to delete this Project?
//             </p>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                   <ClipboardType className="inline mr-1" size={14} /> Type
//                 </p>
//                 <select
//                   name="delete_type"
//                   value={inActiveData.delete_type}
//                   onChange={handleChange}
//                   className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//                   required
//                 >
//                   <option value="">Select Type</option>
//                   <option value="temp">Temporary</option>
//                   <option value="permanent">Permanent</option>
//                 </select>
//               </div>
//               <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                 <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                   <Tag className="inline mr-1" size={14} /> Status
//                 </p>
//                 <select
//                   name="status"
//                   value={inActiveData.status}
//                   onChange={handleChange}
//                   className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//                   required
//                 >
//                   <option value="draft">Draft</option>
//                   <option value="planning">Planning</option>
//                   <option value="active">Active</option>
//                   <option value="paused">Paused</option>
//                   <option value="completed">Completed</option>
//                   <option value="revised">Revised</option>
//                   <option value="client_review">Client_review</option>
//                   <option value="drop">Drop</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//             <button
//               type="button"
//               className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
//               onClick={() => setShowDeleteModal(false)}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button
//               type="button"
//               className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
//               onClick={handleDeleteSubmit}
//               disabled={loading}
//             >
//               {loading ? "Processing..." : "Confirm"}
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </>
//   );
// };

// export default Project;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import {
  ChartNetwork,
  ClipboardType,
  FileDown,
  Network,
  Tag,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import CreateBranchForm from "../Branch/CreateBranchForm";
import { notify } from "~/services/notificationService";
import EditBranchForm from "../Branch/EditFormData";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import { CgExport } from "react-icons/cg";
import { Edit2, Eye, SquarePen, Trash2 } from "lucide-react";
import { useMediaQuery } from "../hooks/use-click-outside";
import AddNewProject from "./AddNewProject";
import EditProjectForm from "./ProjectDocuments/EditProjectForm";
import useProjectStore from "src/stores/ProjectStore";
import ProjectMeetingForm from "./Meeting/ProjectMeetingForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Project = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [sortOrder, setSortOrder] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(8);
  const [showFilters, setShowFilters] = useState(false);
  const token = useAuthStore((state) => state.accessToken);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [inActiveData, setInActiveData] = useState({
    delete_type: "",
    status: "",
  });
  const [roleAccess, setRoleAccess] = useState(null); // ? define here
  // New filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedFilterType, setSelectedFilterType] = useState("");
  const [selectedPayStatus, setSelectedPayStatus] = useState("");


  const UserRole=useAuthStore((state=>state.role))

  const UserId=useAuthStore((state=>state.staff_id))
  //stores
  const { fetchProject } = useProjectStore();
  const branchcode = useAuthStore((state) => state.branchcode);
  const {
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const managerOptions = [
    { value: "", label: "All Priority" },
    { value: "minor", label: "Minor Projects" },
    { value: "major", label: "Major Project" },
    { value: "critical", label: "Critical Project" },
    { value: "blocker", label: "Blocker Project" },
  ];

  const statusOptions = [
    { value: "", label: "All Projects" },
    { value: "active", label: "Active Projects" },
    { value: "draft", label: "Draft Project" },
    { value: "planning", label: "Planning Project" },
    { value: "paused", label: "Paused Project" },
    { value: "completed", label: "Completed Project" },
    { value: "revised", label: "Revised Project" },
    { value: "client_review", label: "Client Review Project" },
    { value: "drop", label: "Drop Project" },
  ];

  const filterTypeOptions = [
    { value: "", label: "All Types" },
    { value: "upcoming", label: "Upcoming Projects" },
    { value: "custom", label: "Custom Projects" },
    { value: "deadline", label: "Deadline Projects" },
  ];

  const payStatusOptions = [
    { value: "", label: "All Payment Status" },
    { value: "paid", label: "Paid" },
    { value: "payment_closed", label: "Payment Closed" },
    { value: "request", label: "Payment Request" },
    { value: "none", label: "No Payment" },
  ];

  const pageSizeOptions = [
    { value: 20, label: "20 per page" },
    { value: 40, label: "30 per page" },
    { value: 50, label: "40 per page" },
    { value: 80, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 200, label: "100 per page" },
  ];

  useEffect(() => {
    fetchProject(token, branchcode);
  }, [token]);

  const getBranch = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    priority = selectedPriority,
    branchCode = selectedBranchCode,
    sort = sortOrder,
    filterStartDate = startDate,
    filterEndDate = endDate,
    filterType = selectedFilterType,
    payStatus = selectedPayStatus
  ) => {
    setLoading(true);
    try {
      let url = `/project/overview/read?page=${page}&limit=${limit}`;

    	// let url = `/getprojectaccess?userRole=${UserRole}&userId=${encodeURIComponent(staff_id)}&useBranchcode=${encodeURIComponent(branchcode)}&page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (priority) url += `&priority=${priority}`;
      if (branchCode) url += `&branchcode=${encodeURIComponent(branchCode)}`;
      if (sort) url += `&dec=${sort}`;
      if (filterStartDate) url += `&start_date=${formatDate(filterStartDate)}`;
      if (filterEndDate) url += `&end_date=${formatDate(filterEndDate)}`;
      if (filterType) url += `&filter_type=${filterType}`;
      if (payStatus) url += `&paystatus=${payStatus}`;

      const response = await apiClient.get(url);

      setSheetData(response?.data?.data);
      setTotalItem(response?.data?.totalDocuments || 0);
      setData(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching project list", error);
      setError("Failed to fetch project");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  };

  useEffect(() => {
    getBranch();
  }, [
    currentPage,
    searchTerm,
    selectStatus,
    selectedPriority,
    selectedBranchCode,
    sortOrder,
    pageSize,
    startDate,
    endDate,
    selectedFilterType,
    selectedPayStatus,
  ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Project added successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (project) => {
    setShowDeleteModal(true);
    setDeleteData(project);
  };

  const handleDeleteSubmit = async () => {
    const deletedData = {
      data: {
        branchcode: deleteData.branchcode,
        project_code: deleteData.project_code,
        delete_type: inActiveData.delete_type,
        status: inActiveData.status,
      },
    };
    console.log("projectdeleteddataa", deletedData);
    try {
      setLoading(true);
      const response = await apiClient.delete(
        `/project/overview/delete`,
        {
          data: deletedData,
        }
      );
      console.log("deleteemployeeresponse", response);
      if (response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Project Deleted Successfully!");
        getBranch();
        setLoading(false);
        setInActiveData({
          delete_type: "",
          status: "",
        });
      }
    } catch (error) {
      console.error("Error deleting branch", error);
      notify.error("Failed to delete branch");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "" : "desc"));
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setSelectStatus(value);
    setCurrentPage(1);
  };

  const handleManagerChange = (value) => {
    setSelectedPriority(value);
    setCurrentPage(1);
  };

  const handleBranchCodeChange = (value) => {
    setSelectedBranchCode(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInActiveData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // New filter handlers
  const handleStartDateChange = (date) => {
    setStartDate(date);
    setCurrentPage(1);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setCurrentPage(1);
  };

  const handleFilterTypeChange = (value) => {
    setSelectedFilterType(value);
    setCurrentPage(1);
  };

  const handlePayStatusChange = (value) => {
    setSelectedPayStatus(value);
    setCurrentPage(1);
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const thead = () => [
    { data: "id" },
    { data: "Branch Code" },
    { data: "Project_Code" },
    { data: "Project Name" },
    { data: "Client_Code" },
    { data: "Type" },
    { data: "Budget" },
    { data: "Duration_Days" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((project, index) => ({
      id: project.id,
     
      data: [
        { data: index + 1 },
        { data: project.branchcode },
        { data: project.project_code },
        { data: project.title },
        { data: project.client_code },
        { data: project.type },
        { data: project.budget },
        { data: project.duration_days },
        {
          data: (
            <div
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${project.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${project.status === "active" ? "bg-green-800" : "bg-red-700"}`}
              ></span>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </div>
          ),
        },
        {
          data: (
            <div className="flex  justify-center gap-2">
              <Link to={`/project/${encodeURIComponent(project.project_code)}`}>
                <button className=" px-4 py-2 dark:text-blue-600 text-blue-700 rounded-sm">
                  <Eye className="inline" size={20} />
                </button>
              </Link>
              <button
                className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => handleEditBranch(project)}
                title="Edit"
              >
                <SquarePen size={18} />
              </button>
              <button
                className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => handleDeleteBranch(project)}
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ),
          className: "action-cell",
        },
      ],
    }));
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Branch updated successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Meeting and Document Created successfully!");
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Branches");
    XLSX.writeFile(wb, "ProjectList.xlsx");
  };



  useEffect(() => {
  fetch(`/get-roleaccessdetail/${UserRole}`)
    .then(res => res.json())
    .then(data => {
      if (data.status) {
        setRoleAccess(data.access);
      }
    });
}, [UserRole]);

console.log("RoleAccess:", roleAccess);


  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              Project Management
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
<div
            className={`flex ${isMobile ? "flex-col" : "items-end justify-end"} gap-4 mb-5`}
          >
            <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}>
              <Dropdown
                options={pageSizeOptions}
                selectedValue={pageSize}
                onSelect={handlePageSizeChange}
                placeholder="Items per page"
                className="w-full md:w-[150px]"
              />
              <button
                onClick={handleOnExport}
                className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
              >
                <FileDown className="mr-1" />
                {!isMobile && "Export Excel"}
              </button>
            {/*  <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
              >
                {!isMobile && "New Project"} +
              </button>*/}


              	{roleAccess?.project?.create && (
  <button
    onClick={() => setShowCreateModal(true)}
    className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 font-medium text-sm rounded-sm px-5 py-2.5"
  >
    {!isMobile && "New Project"} +
  </button>
)}

            </div>
          </div>


      {userRole === "superadmin" && userRole === "admin" && userRole === "hr" && (

          <div
            className={`${isMobile && !showFilters ? "hidden" : "block"} mb-4`}
          >
            <div
              className={`${isMobile ? "grid grid-cols-1 gap-3" : "flex flex-wrap justify-between items-center gap-3"}`}
            >
              <Dropdown
                options={statusOptions}
                selectedValue={selectStatus}
                onSelect={handleStatusChange}
                placeholder="Project Status"
                className="w-full md:w-[200px]"
              />

              <Dropdown
                options={branchCodeOptions}
                selectedValue={selectedBranchCode}
                onSelect={handleBranchCodeChange}
                placeholder="Branch Code"
                className="w-full md:w-[200px]"
                isLoading={isStoreLoading}
              />

              <Dropdown
                options={managerOptions}
                selectedValue={selectedPriority}
                onSelect={handleManagerChange}
                placeholder="Priority"
                className="w-full md:w-[200px]"
                isLoading={isStoreLoading}
              />

              <Dropdown
                options={filterTypeOptions}
                selectedValue={selectedFilterType}
                onSelect={handleFilterTypeChange}
                placeholder="Filter Type"
                className="w-full md:w-[200px]"
              />

              <Dropdown
                options={payStatusOptions}
                selectedValue={selectedPayStatus}
                onSelect={handlePayStatusChange}
                placeholder="Payment Status"
                className="w-full md:w-[200px]"
              />

            

              <button
                onClick={toggleSortOrder}
                className={`${isMobile ? "w-full" : "w-[200px]"} h-[40px] text-white bg-[var(--color-primary)] hover-effect px-2 py-1 rounded-sm`}
              >
                Sort {sortOrder === "desc" ? "?" : "?"}
              </button>

              <div className={`${isMobile ? "w-full" : "w-[180px] mt-3"}`}>
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search projects..."
                  className="w-full"
                />
              </div>
                <div className={`w-full md:w-[200px] z-[15]`}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 z-500">
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full p-2 border rounded-md text-sm z-[15]"
                  placeholderText="Select start date"
                />
              </div>

              <div className={`w-full md:w-[200px] z-[15]`}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 z-[15]">
                  End Date
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="w-full p-2 border rounded-md text-sm z-[15]"
                  placeholderText="Select end date"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  onClick={clearDateFilters}
                  className="h-[40px] text-white bg-red-700 hover:bg-red-800 px-2 py-1 rounded-sm text-sm"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </div>

)}


          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          <div className="overflow-x-auto">
            <DataTable
              thead={thead}
              tbody={tbody}
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
      </div>

      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <AddNewProject
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
      >
        <EditProjectForm
          project={selectedBranch}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showMeetingModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowMeetingModal(false)}
        title="Create Branch Meeting"
      >
        <ProjectMeetingForm
          project={selectedBranch}
          onSuccess={handleMeetingSuccess}
          onCancel={() => setShowMeetingModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
              <Network className="inline mr-2" /> Delete Project
            </h3>

            <p className="text-gray-500 text-sm font-medium text-center">
              Are you sure you want to delete this Project?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <ClipboardType className="inline mr-1" size={14} /> Type
                </p>
                <select
                  name="delete_type"
                  value={inActiveData.delete_type}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="temp">Temporary</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Tag className="inline mr-1" size={14} /> Status
                </p>
                <select
                  name="status"
                  value={inActiveData.status}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="revised">Revised</option>
                  <option value="client_review">Client_review</option>
                  <option value="drop">Drop</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
              onClick={handleDeleteSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Project;
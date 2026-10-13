import { useEffect, useState, useMemo } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import {
  ClipboardCheck,
  ClipboardType,
  FileDown,
  LogOut,
  MessageSquareText,
  Network,
  NetworkIcon,
  Tag,
  PlusSquare,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Link, useNavigate, useParams } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { CgExport } from "react-icons/cg";
import { Edit2, Eye, SquarePen, Trash2 } from "lucide-react";
import { useMediaQuery } from "../../hooks/use-click-outside";
import AddMilestone from "../Milestone/AddNewMilestone";
import EditMilestoneForm from "../Milestone/EditMilestoneForm";
import AddNewTaskForm from "./AddNewTask";
import EditPaymentForm from "./EditPaymentForm";
import MilestoneMeetingForm from "../Milestone/Meeting/MilestoneMeetingForm";
import AddNewTaskForMilestone from "./AddNewTaskForMilestone";
import AddPaymentForm from "./AddPaymentForm";
import MilestoneDocument from "./Meeting/MilestoneDocuments";

const MilestoneTaskList = () => {
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
  const [deleteId, setDeleteId] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(8);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [milestoneData, setMilestoneData] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [activeTab, setActiveTab] = useState("payList"); // New state for tabs

 const [hydrated, setHydrated] = useState(false);
 
const accesstoken = useAuthStore((state) => state.accessToken);
    const userRole = useAuthStore((state) => state.role);
  // wait for Zustand persist to hydrate
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


const token = accesstoken;

  const navigate = useNavigate();
  const { id } = useParams();
  console.log("iddmilestonee", id);
  const [inActiveData, setInActiveData] = useState({
    delete_type: "",
    status: "",
  });

  
  const {
    branches,
    managerOptions,
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const statusOptions = [
    { value: "", label: "All Branches" },
    { value: "active", label: "Active Branches" },
    { value: "inactive", label: "Inactive Branches" },
  ];
  const tabs = [
    { id: "payList", label: "Payment Requests" },
    { id: "milestonedoc", label: "Milestone Documents" },
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
    if (hydrated && token) {
    fetchBranches(token);
  }
  }, [hydrated,token]);
  useEffect(() => {
if (hydrated && token) {

    const fetchMilestoneData = async () => {
      try {
        const response = await apiClient.get(
          `/project/milestone/read?milestone_code=${encodeURIComponent(id)}`
        );
        if (response.data.data && response.data.data.length > 0) {
          setMilestoneData(response.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching milestone data", error);
        notify.error("Failed to load milestone details");
      }
    };

    if (id) {
      fetchMilestoneData();
    }
  }
  }, [hydrated,id, token]);


  const getPayments = async (
  page = currentPage,
  limit = pageSize,
  search = searchTerm,
  status = selectStatus,
  branchCode = selectedBranchCode,
  sort = sortOrder
) => {
  setLoading(true);
  try {
    let url = `/project/req/read?milestone_code=${encodeURIComponent(id)}&page=${page}&limit=${limit}`;

    if (search) url += `&search=${search}`;
    if (status) url += `&status=${status}`;
    if (branchCode) url += `&branchcode=${branchCode}`;
    if (sort) url += `&dec=${sort}`;

    console.log("payments url", url);

    const response = await apiClient.get(url);

    setSheetData(response?.data?.data);
    setTotalItem(response?.data?.totalDocuments || 0);
    setData(response?.data?.data || []);
  } catch (error) {
    console.error("Error fetching payment list", error);
    setError("Failed to fetch payments");
  } finally {
    setLoading(false);
  }
};


  // Removed token logging for security
  console.log("Role:", userRole);



  const getBranch = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    manager = selectedManager,
    branchCode = selectedBranchCode,
    sort = sortOrder
  ) => {
    setLoading(true);
    console.log("milestoneeeiddd", id);
    try {
      let url = `/project/task/read?milestone_code=${encodeURIComponent(id)}&page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (branchCode) url += `&branchcode=${branchCode}`;
      if (sort) url += `&dec=${sort}`;
      console.log("milestoneurll", url);
      const response = await apiClient.get(url);

      setSheetData(response?.data?.data);
      setTotalItem(response?.data?.length || 0);
      setData(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching branch list", error);
      setError("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // getBranch();
    if (hydrated && token) {
    getPayments();
  }
  }, [
    hydrated,
    token,
    currentPage,
    searchTerm,
    selectStatus,
    selectedManager,
    selectedBranchCode,
    sortOrder,
    pageSize,
  ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Payment Request added successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditBranch = (pay) => {
    console.log("branchhhhtaskk", pay);
    setSelectedBranch(pay);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (milestone) => {
    setShowDeleteModal(true);
    setDeleteData(milestone);
  };
  const handleDeleteSubmit = async () => {
    const deletedData = {
      data: {
        branchcode: deleteData.branchcode,
        project_code: deleteData.project_code,
        milestone_code: deleteData.milestone_code,
        delete_type: inActiveData.delete_type,
        status: inActiveData.status,
      },
    };
    console.log("projectdeleteddataa", deletedData);
    try {
      setLoading(true);
      const response = await apiClient.delete(
        `/project/milestone/delete`,
        {
          data: deletedData,
        }
      );
      console.log("deleteemployeeresponse", response);
      if (response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Milestone Deleted Successfully!");
        getBranch();
        setLoading(false);
        setInActiveData({
          delete_type: "",
          status: "",
        });
      }
    } catch (error) {
      console.error("Error deleting milestone", error);
      notify.error("Failed to delete milestone");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInActiveData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    setSelectedManager(value);
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

  // const thead = () => [
  //   { data: "id" },
  //   { data: "Branch Code" },
  //   { data: "Milestone Name" },
  //   { data: "Task Name" },

  //   { data: "Duration Days" },

  //   { data: "Participant Count" },
  //   { data: "Task Priority" },
  //   { data: "Start Date" },
  //   { data: "End Date" },
  //   { data: "Handle By" },
  //   { data: "Status" },
  //   { data: "Actions", className: "text-center" },
  // ];


  //for payments 



const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [columnFilters, setColumnFilters] = useState({});

  // --- Columns ---
  const columns = [
    { key: "request_id", label: "Request ID" },
    { key: "branchcode", label: "Branch Code" },
    { key: "client_code", label: "Client Code" },
    { key: "project_code", label: "Project Code" },
    { key: "milestone_code", label: "Milestone Code" },
    { key: "project_amount", label: "Project Amount" },
    { key: "milestone_amount", label: "Milestone Amount" },
    { key: "balance_amount", label: "Balance Amount (with taxes)" },
    { key: "due_date", label: "Due Date" },
    { key: "status", label: "Status" },
    { key: "created_on", label: "Created On" },
    { key: "actions", label: "Actions", sortable: false, filterable: false, className: "text-center" },
  ];

  // --- Sorting handler ---
  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  // --- Filter handler ---
  const handleFilterChange = (key, value) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  // --- Filtered & Sorted Data ---
  const processedData = useMemo(() => {
    if (!data) return [];

    let filtered = data.filter((pay) =>
      columns.every((col) => {
        if (col.filterable === false || !columnFilters[col.key]) return true;

        let value = pay[col.key];

        if (col.key === "status") value = pay.status;
        if (col.key === "due_date" || col.key === "created_on")
          value = new Date(pay[col.key]).toLocaleDateString();

        if (value === null || value === undefined) value = "";

        return value.toString().toLowerCase().includes(columnFilters[col.key].toLowerCase());
      })
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === "status") {
          valA = a.status;
          valB = b.status;
        }
        if (sortConfig.key === "due_date" || sortConfig.key === "created_on") {
          valA = new Date(a[sortConfig.key]);
          valB = new Date(b[sortConfig.key]);
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        } else {
          return sortConfig.direction === "asc"
            ? valA.toString().localeCompare(valB.toString())
            : valB.toString().localeCompare(valA.toString());
        }
      });
    }

    return filtered;
  }, [data, columnFilters, sortConfig]);

  // --- Render Table Head ---
  const thead = () =>
    columns.map((col) => ({
      data: (
        <div className="flex flex-col">
          <span
            className={`cursor-pointer ${col.className || ""}`}
            onClick={() => col.sortable !== false && handleSort(col.key)}
          >
            {col.label}
            {sortConfig.key === col.key &&
              (sortConfig.direction === "asc" ? " 🔼" : " 🔽")}
          </span>
          {col.filterable !== false && (
            <input
              type="text"
              placeholder={`Search ${col.label}`}
              value={columnFilters[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              className="w-full text-xs border rounded px-1 py-0.5 mt-1"
            />
          )}
        </div>
      ),
      className: col.className,
    }));

  // --- Render Table Body ---
  const tbody = () => {
    if (!processedData) return [];

    return processedData.map((pay) => {
      return {
        data: [
          { data: pay.request_id },
          { data: pay.branchcode },
          { data: pay.client_code },
          { data: pay.project_code },
          { data: pay.milestone_code },
          { data: `₹${pay.project_amount}` },
          { data: `₹${pay.milestone_amount}` },
          { data: `₹${pay.balance_amount}` },
          {
            data: new Date(pay.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          },
          {
            data: (
              <div
                className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
                  pay.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    pay.status === "approved" ? "bg-green-800" : "bg-yellow-600"
                  }`}
                ></span>
                {pay.status.charAt(0).toUpperCase() + pay.status.slice(1)}
              </div>
            ),
          },
          {
            data: new Date(pay.created_on).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          },
          {
            data: (
              <div className="flex justify-center gap-2">
                <button
                  className="p-1 text-blue-700"
                  title="Add Payment"
                  onClick={() => navigate(`/payreq_view/${encodeURIComponent(pay.invoice_id)}`)}
                >
                  <Eye size={18} />
                </button>
                <button
                  className="p-1 text-blue-700"
                  onClick={() => handleEditBranch(pay)}
                  title="Edit"
                >
                  <SquarePen size={18} />
                </button>
                <button
                  className="p-1 text-red-600"
                  onClick={() => handleDeleteBranch(pay)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
            className: "action-cell",
          },
        ].map((col, idx) => ({
          ...col,
          data:
            idx === 11 ? (
              col.data
            ) : (
              <div
                onDoubleClick={() => navigate(`/payreq_view/${encodeURIComponent(pay.invoice_id)}`)}
                className="w-full h-full cursor-pointer"
              >
                {col.data}
              </div>
            ),
        })),
      };
    });
  };



//   const thead = () => [
//   { data: "Request ID" },
//   { data: "Branch Code" },
//   { data: "Client Code" },
//   { data: "Project Code" },
//   { data: "Milestone Code" },
//   { data: "Project Amount" },
//   { data: "Milestone Amount" },
//   { data: "Balance Amount" },
//   { data: "Due Date" },
//   { data: "Status" },
//   { data: "Created On" },
//   { data: "Actions", className: "text-center" },
// ];

//   //for payments

//   // const tbody = () => {
//   //   if (!data) return [];

//   //   return data.map((branch, index) => ({
//   //     id: branch.id,
//   //     data: [
//   //       { data: branch.id },
//   //       { data: branch.branchcode },
//   //       { data: branch.milestonetitle },
//   //       { data: branch.task_title },

//   //       { data: branch.duration_days },

//   //       { data: branch.participant_count },

//   //       {
//   //         data: (
//   //           <div
//   //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${branch.task_priority === "minor" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
//   //           >
//   //             <span
//   //               className={`w-2 h-2 rounded-full mr-2 ${branch.task_priority === "minor" ? "bg-green-800" : "bg-red-700"}`}
//   //             ></span>
//   //             {branch.task_priority.charAt(0).toUpperCase() +
//   //               branch.task_priority.slice(1)}
//   //           </div>
//   //         ),
//   //       },
//   //       // { data: branch.start_date },
//   //       // { data: branch.end_date },
//   //       {
//   //         data: new Date(branch.start_date).toLocaleDateString("en-IN", {
//   //           day: "numeric",
//   //           month: "short",
//   //           year: "numeric",
//   //         }),
//   //       },
//   //       {
//   //         data: new Date(branch.end_date).toLocaleDateString("en-IN", {
//   //           day: "numeric",
//   //           month: "short",
//   //           year: "numeric",
//   //         }),
//   //       },
//   //       { data: branch.handler_by },

//   //       {
//   //         data: (
//   //           <div
//   //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${branch.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
//   //           >
//   //             <span
//   //               className={`w-2 h-2 rounded-full mr-2 ${branch.status === "completed" ? "bg-green-800" : "bg-red-700"}`}
//   //             ></span>
//   //             {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
//   //           </div>
//   //         ),
//   //       },
//   //       {
//   //         data: (
//   //           <div className="flex  justify-center gap-2">
//   //             <Link to={`/task_view/${branch.id}`}>
//   //               <button
//   //                 className="p-1 text-blue-700 rounded hover:text-gray-500 dark:hover:text-gray-300"
//   //                 title="View"
//   //               >
//   //                 <Eye size={18} />
//   //               </button>
//   //             </Link>
//   //             <button
//   //               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
//   //               onClick={() => handleEditBranch(branch)}
//   //               title="Edit"
//   //             >
//   //               <SquarePen size={18} />
//   //             </button>
//   //             <button
//   //               className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
//   //               onClick={() => handleDeleteBranch(branch)}
//   //               title="Delete"
//   //             >
//   //               <Trash2 size={18} />
//   //             </button>
//   //           </div>
//   //         ),
//   //         className: "action-cell",
//   //       },
//   //     ],
//   //   }));
//   // };


// //for payments 

// const tbody = () => {
//   if (!data) return [];

//   return data.map((pay, index) => ({
//     id: pay.request_id,
//     data: [
//       { data: pay.request_id },
//       { data: pay.branchcode },
//       { data: pay.client_code },
//       { data: pay.project_code },
//       { data: pay.milestone_code },
//       { data: `₹${pay.project_amount}` },
//       { data: `₹${pay.milestone_amount}` },
//       { data: `₹${pay.balance_amount}` },
//       {
//         data: new Date(pay.due_date).toLocaleDateString("en-IN", {
//           day: "numeric",
//           month: "short",
//           year: "numeric",
//         }),
//       },
//       {
//         data: (
//           <div
//             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
//               pay.status === "approved"
//                 ? "bg-green-100 text-green-800"
//                 : "bg-yellow-100 text-yellow-800"
//             }`}
//           >
//             <span
//               className={`w-2 h-2 rounded-full mr-2 ${
//                 pay.status === "approved" ? "bg-green-800" : "bg-yellow-600"
//               }`}
//             ></span>
//             {pay.status.charAt(0).toUpperCase() + pay.status.slice(1)}
//           </div>
//         ),
//       },
//       {
//         data: new Date(pay.created_on).toLocaleDateString("en-IN", {
//           day: "numeric",
//           month: "short",
//           year: "numeric",
//         }),
//       },
//       {
//         data: (
//           <div className="flex justify-center gap-2">
//             <button
//               className="p-1 text-blue-700 rounded hover:text-gray-500 dark:hover:text-gray-300"
//               title="Add Payment"
//             >
//               <PlusSquare size={18} />
//             </button>
//             <button
//               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
//               onClick={() => handleEditBranch(pay)}
//               title="Edit"
//             >
//               <SquarePen size={18} />
//             </button>
//             <button
//               className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
//               onClick={() => handleDeleteBranch(pay)}
//               title="Delete"
//             >
//               <Trash2 size={18} />
//             </button>
//           </div>
//         ),
//         className: "action-cell",
//       },
//     ],
//   }));
// };


//for payments


  const calculateCompletionPercentage = () => {
    if (!milestoneData || !milestoneData.totaltask_count) return 0;

    const totalTasks = parseInt(milestoneData.totaltask_count);
    const completedTasks = parseInt(
      milestoneData.verified_closedtask_count || 0
    );

    if (totalTasks === 0) return 0;

    return Math.round((completedTasks / totalTasks) * 100);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Task updated successfully!");
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
    XLSX.writeFile(wb, "BranchList.xlsx");
  };




  if (!hydrated) {
    return <div>Loading...</div>; // wait until state is restored
  }


  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] p-5">
            View Milestone
          </h2>
          <div>
            <button
              className="text-gray-500 bg-gray-200 px-3 py-1 rounded-lg mt-6"
              onClick={() => navigate(-1)}
            >
              <LogOut className="inline rotate-180 text-gray-500 mr-3" />
              Go Back
            </button>
          </div>
        </div>
        {milestoneData ? (
          <div className="w-full max-w-full mx-auto p-15 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-red-700 dark:text-white">
                <NetworkIcon className="inline mr-3" />{" "}
                {milestoneData?.miles_title || "Milestone Details"}
              </h2>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                >
                  {"New Meeting"}{" "}
                  <MessageSquareText className="ml-2" size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-100">
                  Milestone Code:
                </span>{" "}
                {milestoneData?.milestone_code}
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-100">
                  Project Code:
                </span>{" "}
                {milestoneData?.project_code}
              </div>
              <div>
                <span className="font-medium text-purple-700 dark:text-gray-100">
                  Status:
                </span>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    milestoneData?.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {milestoneData?.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-green-700 dark:text-gray-100">
                  Start Date:
                </span>{" "}
                {milestoneData?.start_date
                  ? new Date(milestoneData.start_date).toLocaleDateString()
                  : "N/A"}
              </div>
              <div>
                <span className="font-medium text-red-700 dark:text-gray-100">
                  End Date:
                </span>{" "}
                {milestoneData?.end_date
                  ? new Date(milestoneData.end_date).toLocaleDateString()
                  : "N/A"}
              </div>
              <div>
                <span className="font-medium text-blue-700 dark:text-gray-100">
                  Duration:
                </span>{" "}
                {milestoneData?.duration_days || 0} days
              </div>
            </div>

            {/* Budget Information */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-200">
              <div>
                <span className="font-semibold">Base Amount:</span> ₹
                {milestoneData?.base_amount || "0.00"}
              </div>
              <div>
                <span className="font-semibold">Additional Amount:</span> ₹
                {milestoneData?.additional_amount || "0.00"}
              </div>
              <div>
                <span className="font-semibold">Total Amount:</span> ₹
                {milestoneData?.total_amount || "0.00"}
              </div>
            </div>

            <div className="flex items-center  justify-between text-sm">
              <div className="text-gray-700 dark:text-gray-200">
                <span className="font-semibold">Task Progress:</span>{" "}
                {milestoneData?.totaltask_count
                  ? `${milestoneData.verified_closedtask_count || 0}/${milestoneData.totaltask_count} tasks completed`
                  : "No tasks yet"}
              </div>
              <div className="flex items-center">
                <div className="w-[250px] rounded-full h-2.5 bg-gray-200 dark:bg-gray-700">
                  <div
                    className="bg-red-700 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${calculateCompletionPercentage(milestoneData)}%`,
                    }}
                  ></div>
                </div>
                <div>
                  <span className="text-red-700 ml-3">
                    {calculateCompletionPercentage(milestoneData)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {milestoneData?.revision_reason && (
              <div className="text-sm text-gray-700 dark:text-gray-200">
                <p>
                  <span className="font-semibold">Revision Reason:</span>
                  <br />
                  {milestoneData.revision_reason}
                </p>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-200">
              <div>
                <span className="font-semibold">Assigned by:</span>{" "}
                {milestoneData?.handler_by || "N/A"}
              </div>
              <div>
                <span className="font-semibold">Created by:</span>{" "}
                {milestoneData?.createby || "N/A"}
              </div>
            </div>
          </div>
        ) : (
          <div>Loading milestone details...</div>
        )}
   <div className="border-b border-gray-200 dark:border-gray-700 ml-5 mb-5 mt-10">
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
       {activeTab === "payList" && (
        <>
            <div className="p-4 flex-grow">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] ">
              <ClipboardCheck className="inline mr-4" />{" "}
              {milestoneData?.miles_title} Payment requests
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
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
              >
                {!isMobile && "Add New Payment request"} +
              </button>
            </div>
          </div>

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
                placeholder="Branch Status"
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

              <button
                onClick={toggleSortOrder}
                className={`${isMobile ? "w-full" : "w-[200px]"} h-[40px] text-white bg-[var(--color-primary)] hover-effect px-2 py-1 rounded-sm`}
              >
                Sort {sortOrder === "desc" ? "↑" : "↓"}
              </button>

              <div className={`${isMobile ? "w-full" : "w-[200px] mt-3"}`}>
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search branches..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

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
            paginationLabel="branches"
            isScroll={true}
          />
        </div>
        </>
       )}
{activeTab === 'milestonedoc' && (
<MilestoneDocument/>
)}
    
      </div>

      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Add New Payment Form"
        closeOnOutsideClick={false}
      >
        <AddPaymentForm
          milestone={milestoneData}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Payment Form"
        closeOnOutsideClick={false}
      >
        <EditPaymentForm
          taskData={selectedBranch}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowDeleteModal(false)}
        title="Drop Milestone"
        closeOnOutsideClick={false}
      >
        <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
              <Network className="inline mr-2" /> Drop Milestone
            </h3>

            <p className="text-gray-500 text-sm font-medium text-center">
              Are you sure you want to Drop this Milestone?
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
      <Modal
        isVisible={showMeetingModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowMeetingModal(false)}
        title="Create Meeting"
        closeOnOutsideClick={false}
      >
        <MilestoneMeetingForm
          milestone={milestoneData}
          onSuccess={handleMeetingSuccess}
          onCancel={() => setShowMeetingModal(false)}
          closeOnOutsideClick={false}
        />
      </Modal>
    </>
  );
};

export default MilestoneTaskList;

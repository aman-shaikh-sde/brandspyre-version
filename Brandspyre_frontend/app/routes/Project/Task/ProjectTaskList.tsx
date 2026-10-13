import { useEffect, useState,useMemo  } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { ClipboardType, FileDown, Network, Tag } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import {  useNavigate } from "react-router-dom";
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
import EditTaskForm from "./EditTaskForm";
import TaskMeetingForm from "./Meeting/TaskMeetingForm";

const ProjectTaskList = () => {
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
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [inActiveData, setInActiveData] = useState({
    delete_type: "",
    status: "",
  });


           const [hydrated, setHydrated] = useState(false);

  // const branchCode = useBranchStore((state) => state.branchCodeOptions);
  // const branchcodeForNor = useAuthStore((state) => state.branchcode);
  // const branchCodeOptions =
  //   userRole === "superadmin"
  //     ? branchCode
  //     : [{ value: branchcodeForNor, label: branchcodeForNor }];

  const accesstoken = useAuthStore((state) => state.accessToken);
  const staff_id = useAuthStore((state) => state.staff_id);
  const navigate = useNavigate();
  //  const permissions = useAuthStore((state) => state.permissions);
  // const userRole = permissions[0].role;

  const permissions = useAuthStore((state) => state.permissions);
const userRole = permissions?.[0]?.role || null;


const [roleAccess, setRoleAccess] = useState(null); // ✅ define here
  // --- Sorting & Filtering State ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [columnFilters, setColumnFilters] = useState({});
  console.log("staffiddd", staff_id);

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

  const pageSizeOptions = [
    { value: 20, label: "20 per page" },
    { value: 40, label: "30 per page" },
    { value: 50, label: "40 per page" },
    { value: 80, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 200, label: "100 per page" },
  ];


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




  useEffect(() => {

if (hydrated && token) {
    fetchBranches(token);
  }

  }, [hydrated,token]);

  // const getBranch = async (
  //   page = currentPage,
  //   limit = pageSize,
  //   search = searchTerm,
  //   status = selectStatus,
  //   manager = selectedManager,
  //   branchCode = selectedBranchCode,
  //   sort = sortOrder
  // ) => {
  //   setLoading(true);
  //   try {
  //     let url = `/project/task/members/read?page=${page}&limit=${limit}&staff_id=BRANCH-08/05`;

  //     if (search) url += `&search=${search}`;
  //     if (status) url += `&status=${status}`;
  //     if (manager) url += `&manager_id=${manager}`;
  //     if (branchCode) url += `&branchcode=${branchCode}`;
  //     if (sort) url += `&dec=${sort}`;

  //     const response = await apiClient.get(url, {
  //
  //     });
  //     console.log("responseeeedatataskview", response);
  //     setSheetData(response?.data?.data);
  //     setTotalItem(response?.data?.length || 0);
  //     setData(response?.data?.data || []);
  //   } catch (error) {
  //     console.error("Error fetching branch list", error);
  //     setError("Failed to fetch branches");
  //   } finally {
  //     setLoading(false);
  //   }
  // };



    useEffect(() => {
      if (hydrated && token&&userRole) {
  fetch(`/get-roleaccessdetail/${userRole}`)
    .then(res => res.json())
    .then(data => {
      if (data.status) {
        setRoleAccess(data.access);
      }
    });
      }
}, [hydrated,token,userRole]);

console.log("RoleAccess:", roleAccess);


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
    try {
      const storeState = useAuthStore.getState();
      const userRole = storeState.role || (Array.isArray(storeState.permissions) && storeState.permissions.length > 0 ? storeState.permissions[0]?.role : "") || "";

      let url = `/project/task/members/read?page=${page}&limit=${limit}`;

      if (userRole !== "superadmin" && userRole !== "teamlead") {
        url += `&staff_id=${staff_id}`;
      }

      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (manager) url += `&manager_id=${manager}`;
      if (branchCode) url += `&branchcode=${branchCode}`;
      if (sort) url += `&dec=${sort}`;

      const response = await apiClient.get(url);

      console.log("responseeeedatataskview", response);
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
if (hydrated && token) {
    getBranch();
  }
  }, [
   hydrated,token,
    currentPage,
    searchTerm,
    selectStatus,
    selectedManager,
    selectedBranchCode,
    sortOrder,
    pageSize,
  ]);
  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Meeting and Document Created successfully!");
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Task added successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditBranch = (branch) => {
    console.log("branchhhhtaskk", branch);
    setSelectedBranch(branch);
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


  const columns = [
    { key: "id", label: "ID" },
    { key: "branchcode", label: "Branch Code" },
    { key: "project_code", label: "Project Code" },
    { key: "duration_days", label: "Duration Days" },
    { key: "task_title", label: "Task Name" },
    { key: "task_priority", label: "Task Priority" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "handler_by", label: "Handle By" },
    { key: "status", label: "Status" },
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

    let filtered = data.filter((task) =>
      columns.every((col) => {
        if (col.filterable === false || !columnFilters[col.key]) return true;

        let value = task[col.key];

        // Handle special columns
        if (col.key === "task_priority") value = task.task_priority;
        if (col.key === "status") value = task.status;
        if (col.key === "start_date" || col.key === "end_date")
          value = new Date(task[col.key]).toLocaleDateString();

        if (value === null || value === undefined) value = "";

        return value.toString().toLowerCase().includes(columnFilters[col.key].toLowerCase());
      })
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === "task_priority") {
          valA = a.task_priority;
          valB = b.task_priority;
        }
        if (sortConfig.key === "status") {
          valA = a.status;
          valB = b.status;
        }

        if (sortConfig.key === "start_date" || sortConfig.key === "end_date") {
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

    return processedData.map((task, index) => {
      const viewUrl = `/member_view/${task.participants_id}`;

      return {
        data: [
          { data: index + 1 },
          { data: task.branchcode },
          { data: task.project_code },
          { data: task.duration_days },
          { data: task.task_title },
          {
            data: (
              <div
                className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
                  task.task_priority === "minor" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    task.task_priority === "minor" ? "bg-green-800" : "bg-red-700"
                  }`}
                ></span>
                {task.task_priority.charAt(0).toUpperCase() + task.task_priority.slice(1)}
              </div>
            ),
          },
          {
            data: new Date(task.start_date).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          },
          {
            data: new Date(task.end_date).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          },
          { data: task.handler_by },
          {
            data: (
              <div
                className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
                  task.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    task.status === "completed" ? "bg-green-800" : "bg-red-700"
                  }`}
                ></span>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </div>
            ),
          },
          {
            data: (
              <div className="flex justify-center gap-2">
                <Link to={viewUrl}>
                  <button className="p-1 text-blue-700" title="View">
                    <Eye size={18} />
                  </button>
                </Link>
                                         {roleAccess?.task?.edit && (
                <button
                  className="p-1 text-blue-700"
                  onClick={() => handleEditBranch(task)}
                  title="Edit"
                >
                  <SquarePen size={18} />
                </button>
                )}
                
                                                                  {roleAccess?.task?.delete && (
                <button
                  className="p-1 text-red-600"
                  onClick={() => handleDeleteBranch(task)}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
                )}
              </div>
            ),
            className: "action-cell",
          },
        ].map((col, idx) => ({
          ...col,
          data:
            idx === 10 ? (
              col.data
            ) : (
              <div
                onDoubleClick={() => navigate(viewUrl)}
                className="w-full h-full cursor-pointer"
              >
                {col.data}
              </div>
            ),
        })),
      };
    });
  };



  // const thead = () => [
  //   { data: "id" },
  //   { data: "Branch Code" },
  //   { data: "Project Code" },
  //   { data: "Duration Days" },
  //   { data: "Task Name" },
  //   { data: "Task Priority" },
  //   { data: "Start Date" },
  //   { data: "End Date" },
  //   { data: "Handle By" },
  //   { data: "Status" },
  //   { data: "Actions", className: "text-center" },
  // ];

  // const tbody = () => {
  //   if (!data) return [];

  //   return data.map((branch, index) => ({
  //     id: index + 1,
  //     data: [
  //       { data: branch.id },

  //       { data: branch.branchcode },
  //       { data: branch.project_code },
  //       { data: branch.duration_days },

  //       { data: branch.task_title },

  //       {
  //         data: (
  //           <div
  //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${branch.task_priority === "minor" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
  //           >
  //             <span
  //               className={`w-2 h-2 rounded-full mr-2 ${branch.task_priority === "minor" ? "bg-green-800" : "bg-red-700"}`}
  //             ></span>
  //             {branch.task_priority.charAt(0).toUpperCase() +
  //               branch.task_priority.slice(1)}
  //           </div>
  //         ),
  //       },
  //       // { data: branch.start_date },
  //       // { data: branch.end_date },
  //       {
  //         data: new Date(branch.start_date).toLocaleString("en-IN", {
  //           dateStyle: "medium",
  //           timeStyle: "short",
  //         }),
  //       },
  //       {
  //         data: new Date(branch.end_date).toLocaleString("en-IN", {
  //           dateStyle: "medium",
  //           timeStyle: "short",
  //         }),
  //       },
  //       { data: branch.handler_by },

  //       {
  //         data: (
  //           <div
  //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${branch.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
  //           >
  //             <span
  //               className={`w-2 h-2 rounded-full mr-2 ${branch.status === "completed" ? "bg-green-800" : "bg-red-700"}`}
  //             ></span>
  //             {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
  //           </div>
  //         ),
  //       },
  //       {
  //         data: (
  //           <div className="flex  justify-center gap-2">
  //             <Link to={`/member_view/${branch.participants_id}`}>
  //               <button
  //                 className="p-1 text-blue-700 rounded hover:text-gray-500 dark:hover:text-gray-300"
  //                 title="View"
  //               >
  //                 <Eye size={18} />
  //               </button>
  //             </Link>
  //             <button
  //               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
  //               onClick={() => handleEditBranch(branch)}
  //               title="Edit"
  //             >
  //               <SquarePen size={18} />
  //             </button>
  //             <button
  //               className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
  //               onClick={() => handleDeleteBranch(branch)}
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

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Task updated successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Branches");
    XLSX.writeFile(wb, "BranchList.xlsx");
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              Task Management
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
              
                                       {roleAccess?.task?.create && (

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
              >
                {!isMobile && "Add New Task"} +
              </button>
          )}


            </div>
          </div>

{(userRole === "superadmin" || userRole === "admin" || userRole === "hr") && (

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

              <Dropdown
                options={managerOptions}
                selectedValue={selectedManager}
                onSelect={handleManagerChange}
                placeholder="Manager"
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
            paginationLabel="branches"
            isScroll={true}
          />
        </div>
      </div>

      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Add New Task Form"
      >
        <AddNewTaskForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Task Form"
      >
        <EditTaskForm
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
    </>
  );
};

export default ProjectTaskList;

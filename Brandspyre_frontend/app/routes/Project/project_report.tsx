import { useEffect, useState ,useMemo } from "react";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const accesstoken = useAuthStore((state) => state.accessToken);
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

         const [hydrated, setHydrated] = useState(false);


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

  const navigate = useNavigate();

  // --- State for Sorting & Filtering ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [columnFilters, setColumnFilters] = useState({});

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

  fetch(`/get-roleaccessdetail/${UserRole}`)
    .then(res => res.json())
    .then(data => {
      if (data.status) {
        setRoleAccess(data.access);
      }
    });
}

}, [hydrated,token,UserRole]);

console.log("RoleAccess:", roleAccess);


  useEffect(() => {
if (hydrated && token) {

    fetchProject(token, branchcode);
}
  }, [hydrated,token]);

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
    payStatus = selectedPayStatus,
    canCreate = roleAccess?.project?.create, // ?? add here
    staff_id = UserId
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
      if (canCreate !== undefined) url += `&create=${canCreate}`; // ?? add here
      if (staff_id !== undefined) url += `&staff_id=${staff_id}`; // ?? add here

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
    	
    	if (hydrated && token) {


    getBranch();
}
  }, [
  	hydrated,
  	token,
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




  const columns = [
    { key: "id", label: "ID" },
    { key: "branchcode", label: "Branch Code" },
    { key: "project_code", label: "Project Code" },
    { key: "title", label: "Project Name" },
    { key: "client_code", label: "Client Code" },
    { key: "type", label: "Type" },
    { key: "budget", label: "Budget" },
    { key: "duration_days", label: "Duration (Days)" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", sortable: false, filterable: false, className: "text-center" },
  ];

  // --- Handle Sorting ---
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

  // --- Handle Filter Change ---
  const handleFilterChange = (key, value) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  // --- Filtered & Sorted Data ---
  const processedData = useMemo(() => {
  if (!data) return [];

  // Filter
  let filtered = data.filter((project) =>
    columns.every((col) => {
      if (col.filterable === false || !columnFilters[col.key]) return true;

      let value = project[col.key];

      // Convert undefined/null to empty string
      if (value === null || value === undefined) value = "";

      return value.toString().toLowerCase().includes(columnFilters[col.key].toLowerCase());
    })
  );

  // Sort
  if (sortConfig.key) {
    filtered.sort((a, b) => {
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";

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
              (sortConfig.direction === "asc" ? " ??" : " ??")}
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

    return processedData.map((project, index) => {
      const viewUrl = `/project/${encodeURIComponent(project.project_code)}`;

      return {
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
                className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
                  project.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    project.status === "active" ? "bg-green-800" : "bg-red-700"
                  }`}
                ></span>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </div>
            ),
          },
          {
            data: (
              <div className="flex justify-center gap-2">
                <Link to={viewUrl}>
                  <button className="px-4 py-2 text-blue-700" title="View">
                    <Eye size={20} />
                  </button>
                </Link>
                  {roleAccess?.project?.edit && (
                <button
                  className="p-1 text-[var(--color-primary)]"
                  onClick={() => handleEditBranch(project)}
                  title="Edit"
                >
                  <SquarePen size={18} />
                </button>
                )}

                  {roleAccess?.project?.delete && (
                <button
                  className="p-1 text-red-600"
                  onClick={() => handleDeleteBranch(project)}
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
            idx === 9 ? (
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
  //   { data: "Project_Code" },
  //   { data: "Project Name" },
  //   { data: "Client_Code" },
  //   { data: "Type" },
  //   { data: "Budget" },
  //   { data: "Duration_Days" },
  //   { data: "Status" },
  //   { data: "Actions", className: "text-center" },
  // ];

  // const tbody = () => {
  //   if (!data) return [];

  //   return data.map((project, index) => ({
  //     id: project.id,
     
  //     data: [
  //       { data: index + 1 },
  //       { data: project.branchcode },
  //       { data: project.project_code },
  //       { data: project.title },
  //       { data: project.client_code },
  //       { data: project.type },
  //       { data: project.budget },
  //       { data: project.duration_days },
  //       {
  //         data: (
  //           <div
  //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${project.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
  //           >
  //             <span
  //               className={`w-2 h-2 rounded-full mr-2 ${project.status === "active" ? "bg-green-800" : "bg-red-700"}`}
  //             ></span>
  //             {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
  //           </div>
  //         ),
  //       },
  //       {
  //         data: (
  //           <div className="flex  justify-center gap-2">
  //             <Link to={`/project/${encodeURIComponent(project.project_code)}`}>
  //               <button className=" px-4 py-2 dark:text-blue-600 text-blue-700 rounded-sm">
  //                 <Eye className="inline" size={20} />
  //               </button>
  //             </Link>
  //             <button
  //               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
  //               onClick={() => handleEditBranch(project)}
  //               title="Edit"
  //             >
  //               <SquarePen size={18} />
  //             </button>
  //             <button
  //               className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
  //               onClick={() => handleDeleteBranch(project)}
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

const handleOnExportPDF = () => {
  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.text("Project List (Summary)", 14, 10);

  if (sheetData.length > 0) {
    // Pick only important columns
    const importantCols = [
      "project_code",
      "title",
      "priority",
      "status",
      "budget",
      "revised_cost",
      "handler_by",
      "start_date",
      "end_date",
    ];

    const columns = importantCols.map((key) => ({
      header: key,
      dataKey: key,
    }));

    autoTable(doc, {
      columns,
      body: sheetData,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [22, 160, 133], fontSize: 9, halign: "center" },
      theme: "grid",
      tableWidth: "auto",
    });
  }

  doc.save("ProjectList.pdf");
};

const handleDownloadTemplate = () => {
  const headers = [
    "project_code",
    "branchcode",
    "campaign_code",
    "lead_id",
    "client_code",
    "title",
    "priority",
    "type",
    "loc",
    "notes",
    "budget",
    "revised_cost",
    "balance",
    "paystatus",
    "start_date",
    "end_date",
    "duration_days",
    "handler_by",
    "createby",
    "updatedby",
    "revised_count",
    "additional",
    "milestone_count",
    "status",
    "created_on",
    "updated_on",
    "overallcost",
    "reason",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers]); // Only headers row
  XLSX.utils.book_append_sheet(wb, ws, "ProjectTemplate");

  XLSX.writeFile(wb, "ProjectTemplate.xlsx");
};

const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
   // Upload Excel handler
const handleUpload = async () => {
    if (!file) return alert("Please select a file first");

    const formData = new FormData();
    formData.append("file", file); // ?? Must match multer.single("file")

    try {
      const res = await apiClient.post(`/projectimport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // if using auth
        },
      });
      console.log("Upload success:", res.data);
      alert ("projects imported successfully!")
      navigate("/project");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };






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


 {(UserRole === "superadmin" || UserRole === "admin" || UserRole === "hr") && (
              <button
                onClick={handleDownloadTemplate }
                className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
              >
                <FileDown className="mr-1" />
                {!isMobile && "Download Template"}
              </button>

              )}




<div className="flex flex-col items-start">  {/* ?? changed to items-start */}
    <label className="flex items-center justify-center text-gray-400 bg-white font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-green-700/70 px-3 py-2.5 cursor-pointer">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <CgExport className="mr-1" />
      Upload Excel
    </label>


  </div>

    {/* ? left-aligned filename */}
    {file && (
      <span
        className="text-xs text-green-500 mt-1 max-w-[140px] truncate"
        title={file.name}
      >
        {file.name}
      </span>
    )}
  {/* Upload button */}


  <button
    onClick={handleUpload}
    className="flex items-center justify-center text-gray-400 bg-white font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-green-700/70 px-3 py-2.5"
  >
    Upload
  </button>


 {(UserRole === "superadmin" || UserRole === "admin" || UserRole === "hr") && (
              <button
                onClick={handleOnExport}
                className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
              >
                <FileDown className="mr-1" />
                {!isMobile && "Export Excel"}
              </button>

              )}
            {/*  <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
              >
                {!isMobile && "New Project"} +
              </button>*/}


 {(UserRole === "superadmin" || UserRole === "admin" || UserRole === "hr") && (
<button
                onClick={handleOnExportPDF}
                className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
              >
                <FileDown className="mr-1" />
                {!isMobile && "Export PDF"}
              </button>
              )}

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

{(UserRole === "superadmin" || UserRole === "admin" || UserRole === "hr") && (

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
        closeOnOutsideClick={false}
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
        closeOnOutsideClick={false}
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
        closeOnOutsideClick={false}
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
        closeOnOutsideClick={false}
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
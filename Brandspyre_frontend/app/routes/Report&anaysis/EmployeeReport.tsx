import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { FileDown } from "lucide-react";
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
import Leave from "../Leave/Leave";
import AddNewLeaveType from "../Leave/CreateLeaveRequestForm";
import DynamicDoughnutChart from "src/component/graphComponents/DynamicDoughnutChart";
import LineGraph from "src/component/graphComponents/LineGraph";

const EmployeeReport = () => {
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
  const token = useAuthStore((state) => state.accessToken);
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

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

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
  //     let url = `/branch/read?page=${page}&limit=${limit}`;
  //     if (search) url += `&search=${search}`;
  //     if (status) url += `&status=${status}`;
  //     if (manager) url += `&manager_id=${manager}`;
  //     if (branchCode) url += `&branchcode=${branchCode}`;
  //     if (sort) url += `&dec=${sort}`;
  //     const response = await apiClient.get(url, {
  //
  //     });

  //     setSheetData(response?.data);
  //     setTotalItem(response?.data?.length || 0);
  //     setData(response?.data || []);
  //   } catch (error) {
  //     console.error("Error fetching branch list", error);
  //     setError("Failed to fetch branches");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   getBranch();
  // }, [
  //   currentPage,
  //   searchTerm,
  //   selectStatus,
  //   selectedManager,
  //   selectedBranchCode,
  //   sortOrder,
  //   pageSize,
  // ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Branch added successfully!");
    fetchBranches(token);

  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (id) => {
    setShowDeleteModal(true);
    setDeleteId(id);
  };

  const handleDeleteSubmit = async () => {
    const id = Number(deleteId);
    const payload = { userId: "GK123" };

    try {
      setLoading(true);
      console.log("branchclicked")
      // const response = await apiClient.delete(`/branch/delete/${id}`, {
      //   data: payload,
      //
      // });

      // if (response?.status === 201) {
      //   setShowDeleteModal(false);
      //   notify.success("Branch deleted successfully!");
      //   fetchBranches(token);
      //   getBranch();
      // }
    } catch (error) {
      console.error("Error deleting branch", error);
      notify.error("Failed to delete branch");
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
  const LeaveType = [
    {
      id: "1",
      employeename: "Arun",
      role: "sales",
      ontimetask: "23",
      overtask: "32",
      totalask: "45",
      completeTask: "56%",
    },
  ];
  const thead = () => [
    { data: "id" },
    { data: "Employee Name" },
    { data: "Employee Role" },
    { data: "On time-Tasks" },
    { data: "Overdue Task" },
    { data: "Total Task" },
    { data: "Completion Task" },
  ];

  const tbody = () => {
    if (!LeaveType) return [];

    return LeaveType.map((branch) => ({
      id: branch.id,
      data: [
        { data: branch.id },
        { data: branch.employeename },
        { data: branch.role },
        { data: branch.ontimetask },
        { data: branch.overtask },
        { data: branch.totalask },
        { data: branch.completeTask },
        // {
        //   data: (
        //     <div
        //       className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${branch.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        //     >
        //       <span
        //         className={`w-2 h-2 rounded-full mr-2 ${branch.status === "active" ? "bg-green-800" : "bg-red-700"}`}
        //       ></span>
        //       {branch.status.charAt(0).toUpperCase() + branch.status.slice(1)}
        //     </div>
        //   ),
        // },
        // {
        //   data: (
        //     <div className="flex flex-wrap gap-2 ml-[-290px]">
        //       {/* <Link to={`/branch/${branch.id}`}>
        //         <button
        //           className="p-1 text-blue-700 rounded hover:text-gray-500 dark:hover:text-gray-300"
        //           title="View"
        //         >
        //           <Eye size={18} />
        //         </button>
        //       </Link> */}

        //       <button
        //         className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
        //         onClick={() => handleDeleteBranch(branch.id)}
        //         title="Delete"
        //       >
        //         <Trash2 size={18} />
        //       </button>
        //     </div>
        //   ),
        //   className: "action-cell",
        // },
      ],
    }));
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Branch updated successfully!");
    fetchBranches(token);
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Branches");
    XLSX.writeFile(wb, "BranchList.xlsx");
  };
  const dougntChartData = [
    {
      title: "Top Performance",
      labels: ["Prakash", "Arun", "parthiban"],
      values: [15, 35, 65],
      colors: ["#839192 ", "#c0392b ", "#ccd1d1"],
    },
  ];
  const theme = "light";
  const lineGraphData = {
    title: "Fast Task Completion",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      { label: "Arun Prakash", data: [65, 59, 80, 81, 56, 55] },
      { label: "Karthick", data: [28, 48, 40, 19, 86, 27] },
      { label: "Parthiban", data: [45, 25, 60, 91, 76, 35] },
      { label: "Kayal", data: [35, 55, 30, 71, 66, 45] },
    ],
  };
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex justify-around mt-10">
          <LineGraph
            data={lineGraphData}
            theme={theme}
            className="h-[350px] w-[650px]"
          />

          {dougntChartData.map((pieData, index) => (
            <DynamicDoughnutChart
              key={index}
              data={pieData}
              theme={theme}
              className="h-[350px] w-[350px]"
            />
          ))}
        </div>
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              Employee Report
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
                {!isMobile && "Add New Type"} +
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
                Sort {sortOrder === "desc" ? "?" : "?"}
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
      </div>

      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Create New Branch"
      >
        <AddNewLeaveType onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Edit Branch"
      >
        <EditBranchForm
          branch={selectedBranch}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Branch"
      >
        <div className="flex flex-col gap-6 justify-center items-center">
          <p className="text-gray-500 text-lg font-bold text-center">
            Are you sure you want to delete this Type?
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              type="button"
              className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-hover-secondary)] text-gray-800 hover-effect dark:text-gray-700 rounded dark:hover:bg-gray-500 transition"
              disabled={loading}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-hover)] hover-effect transition"
              disabled={loading}
              // onClick={handleDeleteSubmit}
            >
              {loading ? <ButtonLoader /> : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EmployeeReport;

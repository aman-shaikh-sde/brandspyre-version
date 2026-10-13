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
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";

import { Edit2, Eye, SquarePen, Trash2 } from "lucide-react";

import { useMediaQuery } from "~/routes/hooks/use-click-outside";

import CreateLeaveForm from "../settings/leave/CreateLeaveForm";
import EditLeaveForm from "../settings/leave/EditLeaveForm";
const LeaveTypes = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
  const accesstoken = useAuthStore((state) => state.accessToken);
  const branchCode = useAuthStore((state) => state.branchcode);

  const {
    branches,
    managerOptions,
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const pageSizeOptions = [
    { value: 20, label: "20 per page" },
    { value: 40, label: "30 per page" },
    { value: 50, label: "40 per page" },
    { value: 80, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 200, label: "100 per page" },
  ];


      const [hydrated, setHydrated] = useState(false);



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

  const getSoftware = async (
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
      let url = `/master/leavetypes/read?branchcode=${branchCode}&page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (manager) url += `&manager_id=${manager}`;
      if (branchCode) url += `&branchcode=${branchCode}`;
      if (sort) url += `&dec=${sort}`;

      const response = await apiClient.get(url);
      console.log("responseeeeleavee", response);
      setSheetData(response?.data?.data);
      setTotalItem(response?.data?.data?.totalDocuments || 0);
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
    getSoftware();
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
    notify.success("Leave Type added successfully!" );
    fetchBranches(token);
    getSoftware();
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditBranch = (software) => {
    setSelectedBranch(software);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (id) => {
    setShowDeleteModal(true);
    setDeleteId(id);
  };

  const handleDeleteSubmit = async () => {
    const id = Number(deleteId);

    try {
      setLoading(true);
      const response = await apiClient.delete(
        `/master/leavetypes/delete/${id}`
      );

      if (response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Leave deleted successfully!" );
        fetchBranches(token);
        getSoftware();
      }
    } catch (error) {
      console.error("Error deleting leave", error);
      notify.error("Failed to delete Leave");
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

  const thead = () => [
    { data: "id" },
    { data: "Branch Code" },
    { data: "Leave Type" },
    { data: "Year" },
    { data: "TotalDays" },
    { data: "Status" },
    { data: "Actions" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((software) => ({
      id: software.id,
      data: [
        { data: software.id },
        { data: software.branchcode },
        { data: software.name },
        { data: software.year },
        { data: software.total_days },

        {
          data: (
            <div
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${software.status === "open" ? "bg-green-100 text-green-800" : software.status === "close" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${software.status === "open" ? "bg-green-800" : software.status === "close" ? "bg-red-700" : "bg-gray-500"}`}
              ></span>
              {software.status
                ? software.status.charAt(0).toUpperCase() + software.status.slice(1)
                : "N/A"}
            </div>
          ),
        },
        {
          data: (
            <div className="flex  justify-center gap-1 ">
              {/*<Link to={`/branch/${software.id}`}>
                <button
                  className="p-1 text-blue-700 rounded hover:text-gray-500 dark:hover:text-gray-300"
                  title="View"
                >
                  <Eye size={18} />
                </button>
              </Link>*/}
              <button
                className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => handleEditBranch(software)}
                title="Edit"
              >
                <SquarePen size={18} />
              </button>
              <button
                className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => handleDeleteBranch(software.id)}
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
    notify.success("Leave updated successfully!" );
    fetchBranches(token);
    getSoftware();
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Software");
    XLSX.writeFile(wb, "SoftWareList.xlsx");
  };

  return (
    <>
      <div className="flex flex-col min-h-screen w-full">
        <div className="flex flex-col">
          <div className="p-4 flex-grow">
            <div className="flex justify-between items-center ">
              <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
                LeaveType Management
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
              <div
                className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}
              >
                
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                >
                  {!isMobile && "New Leave Type"} +
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
                  Sort {sortOrder === "desc" ? "?" : "?"}
                </button>
    <Dropdown
                  options={pageSizeOptions}
                  selectedValue={pageSize}
                  onSelect={handlePageSizeChange}
                  placeholder="Items per page"
                  className="w-full md:w-[200px]"
                />
                <button
                  onClick={handleOnExport}
                  className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-9 dark:bg-gray-800 dark:text-gray-300 py-2.5"
                >
                  <FileDown className="mr-1" />
                  {!isMobile && "Export Excel"}
                </button>
              
                <div className={`${isMobile ? "w-full" : "w-[180px] mt-3"}`}>
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
                className="min-w-[50%]"
                enableFilters={true}
  enableSorting={true}

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
          title="CREATE NEW LEAVETYPE"
            closeOnOutsideClick={false}
        >
          <CreateLeaveForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        <Modal
          isVisible={showEditModal}
          className="w-full md:w-[800px]"
          onClose={() => setShowEditModal(false)}
          title="EDIT LEAVE TYPE"
            closeOnOutsideClick={false}
        >
          <EditLeaveForm
            branch={selectedBranch}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>

        <Modal
          isVisible={showDeleteModal}
          className="w-full md:w-[600px]"
          onClose={() => setShowDeleteModal(false)}
          title="DELETE LEAVE TYPE"
            closeOnOutsideClick={false}
        >
          <div className="flex flex-col gap-6 justify-center items-center">
            <p className="text-gray-500 text-lg font-bold text-center">
              Are you sure you want to delete this Leavetype?
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
                onClick={handleDeleteSubmit}
              >
                {loading ? <ButtonLoader /> : "Confirm"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};
export default LeaveTypes;

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
import { CgExport } from "react-icons/cg";
import { Edit2, Eye, SquarePen, Trash2 } from "lucide-react";
import { useMediaQuery } from "./hooks/use-click-outside";
import LeaveRequest from "./Leave/LeaveRequestList";
import LeaveTypes from "./Leave/LeaveTypes";
import AddNewLeaveType from "./Leave/CreateLeaveRequestForm";
import UpdateLeaveReq from "./Leave/EditLeaveRequestForm";
import CreateInvoice from "./Accounts/Invoice/CreateInvoice";
import UpdateInvoice from "./Accounts/Invoice/UpdateInvoice";
import FinancialTransection from "./Accounts/FinancialTransection";
import MomViewPage from "./Clients/MomViewPage";
import ScheduleMeeting from "./Calandar/AddNewScheduledMeeting";
import UpcomingEvents from "./Calandar/UpcomingEvents";

const Calander = () => {
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
  const [activeTab, setActiveTab] = useState("scheduledmeet");
  const [showModal, setShowModal] = useState(false);
  const[showViewInvoiceModal,setShowViewInvoiceModal]=useState(false)
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
      let url = `/branch/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${search}`;
      if (status) url += `&status=${status}`;
      if (manager) url += `&manager_id=${manager}`;
      if (branchCode) url += `&branchcode=${branchCode}`;
      if (sort) url += `&dec=${sort}`;

      const response = await apiClient.get(url);

      setSheetData(response?.data);
      setTotalItem(response?.data?.length || 0);
      setData(response?.data || []);
    } catch (error) {
      console.error("Error fetching branch list", error);
      setError("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBranch();
  }, [
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
    notify.success("Branch added successfully!");
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

  const handleDeleteBranch = (id) => {
    setShowDeleteModal(true);
    setDeleteId(id);
  };

  const handleDeleteSubmit = async () => {
    const id = Number(deleteId);
    const payload = { userId: "GK123" };

    try {
      setLoading(true);
      const response = await apiClient.delete(`/branch/delete/${id}`, {
        data: payload,
      });

      if (response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Branch deleted successfully!");
        fetchBranches(token);
        getBranch();
      }
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
  const meetdata = [
    {
      id: "ASC_12",
      date: "Agenda_1",
      name: "ABC 1",
      branch: "TL",
      priority: "Employee",
      progress: "TRACK-1",
      lastdate: "25-05-2025",
    },
    {
      id: "ASC_13",
      date: "Agenda_2",
      name: "ABC 2",
      branch: "TL",
      priority: "Employee",
      progress: "TRACK-2",
      lastdate: "25-05-2025",
    },
    // More data...
  ];
  const thead = () => [
    { data: "MeetId" },
    { data: "Agenda" },
    { data: "Consultant" },
    { data: "OrgBy" },
    { data: "Attendees" },
    { data: "Summary" },
    { data: "Last Meet" },
    { data: "view" },
  ];

  const tbody = () => {
    if (!meetdata) return [];
    return meetdata.map((user) => ({
      id: user.id,
      data: [
        { data: user.id },
        { data: user.name },
        { data: user.date },
        { data: user.branch },
        { data: user.priority },
        {
          data: user.progress,
        },
        { data: user.lastdate },
        {
          data: (
           
              <button className="bg-red-400/25 text-xs dark:bg-red-700/15 px-3 py-1 dark:text-red-200 text-red-700 rounded-sm" onClick={()=>setShowModal(true)}>
                View
              </button>
           
          ),
        },
      ],
    }));
  };

  // const handleEditSuccess = () => {
  //   setShowEditModal(false);
  //   notify.success("Branch updated successfully!");
  //   fetchBranches(token);
  //   getBranch();
  // };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Branches");
    XLSX.writeFile(wb, "BranchList.xlsx");
  };
  // Tab configuration
  const tabs = [
    { id: "scheduledmeet", label: "Schedule Meeting" },
    { id: "UpcomingEvents", label: "Announcement" },
  
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="  dark:border-gray-700  ">
        <nav className="flex justify-evenly -mb-px">
          {tabs.map((tab, index) => (
            <>
              {index > 0 && (
                <span className="bg-gray-300 dark:bg-red-700 w-[50px] h-[2px] mt-5 items-center"></span>
              )}
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={` font-medium text-sm  ${
                  activeTab === tab.id
                    ? " text-gray-200 dark:bg-gray-800 dark:text-red-800 hover:border-gray-300 bg-red-700 w-[170px] h-[40px] rounded-sm "
                    : "border-transparent text-gray-700 hover:text-red-700 dark:bg-gray-600 dark:text-gray-100 hover:border-gray-300 bg-gray-200 w-[170px] h-[40px] rounded-sm "
                }`}
              >
                {tab.label}
              </button>
            </>
          ))}
        </nav>
      </div>
      <div className="relative">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex justify-center relative">
            <div className="flex border-b border-gray-200 w-full">
              {tabs.map((tab, index) => (
                <div key={tab.id} className="relative flex">
                  {index > 0 && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-6 w-px bg-red-800"></div>
                  )}
                  
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'text-red-600 border-b-2 border-red-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>

      <div className="p-4 flex-grow">
        {activeTab === "scheduledmeet" && (
          <>
            <div className="flex flex-col min-h-screen ">
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-center mt-4">
                  <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
                    Meeting Records
                  </h2>
                  {/* {isMobile && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-gray-200 rounded-md"
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            )} */}
                </div>
<div
                  className={`flex ${isMobile ? "flex-col" : "items-end justify-end"} gap-4 mb-5`}
                >
                  <div
                    className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}
                  >
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
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                    >
                      {!isMobile && "Scheduled Meet"} +
                    </button>
                  </div>
                </div>

                <div
                  className={`${isMobile && !showFilters ? "hidden" : "block"} mb-4`}
                >
                  <div
                    className={`${isMobile ? "grid grid-cols-1 gap-3" : "flex flex-wrap justify-between items-center gap-3"}`}
                  >
                    {/* <Dropdown
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
              /> */}

                    <Dropdown
                      options={managerOptions}
                      selectedValue={selectedManager}
                      onSelect={handleManagerChange}
                      placeholder="Manager"
                      className="w-full md:w-[200px]"
                      isLoading={isStoreLoading}
                    />
                    {/* 
        

              <button
                onClick={toggleSortOrder}
                className={`${isMobile ? "w-full" : "w-[200px]"} h-[40px] text-white bg-[var(--color-primary)] hover-effect px-2 py-1 rounded-sm`}
              >
                Sort {sortOrder === "desc" ? "?" : "?"}
              </button> */}

                    <div
                      className={`${isMobile ? "w-full" : "w-[200px] mt-3"}`}
                    >
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
          </>
        )}

        {activeTab === "UpcomingEvents" && (
          <div>
          <UpcomingEvents/>
          </div>
        )}
      </div>
      <Modal 
        isVisible={showModal}
        className="w-[200px]"
        onClose={() => setShowModal(false)}
      
      >
        <MomViewPage />
      </Modal>
            <Modal
        isVisible={showViewInvoiceModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowModal(false)}
        title="Create New Invoice"
      >
        <CreateInvoice onCancel={() => setShowModal(false)} />
      </Modal>
      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Scheduled Meeting"
      >
        <ScheduleMeeting onCancel={() => setShowEditModal(false)} />
      </Modal>
   
    </div>
  );
};

export default Calander;

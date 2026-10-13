

import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Dropdown from "src/component/DrapDown";
import {
  FileDown,
  Filter,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  SquarePen,
  CircleCheckBig,
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
import Modal from "src/component/Modal";
import HRSalaryApprovalForm from "./HRSalaryApprovalForm";
// import HRSalaryApprovalForm
import AddSalaryRevision  from "./AddSalaryRevision";
const SalaryRevision = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [salaryRequests, setSalaryRequests] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Auth store data
  const token = useAuthStore((state) => state.accessToken);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userBranchCode = useAuthStore((state) => state.branchcode);
  const role = (Array.isArray(permission) && permission.length > 0 ? permission[0]?.role : null) || userStoreRole || 'employee';

  // const {
  //   branchCodeOptions,
  //   fetchBranches,
  //   isLoading: isStoreLoading,
  // } = useBranchStore();



  // const token = useAuthStore((state) => state.accessToken);
  const {
    branches,
    managerOptions,
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

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "submitted", label: "Submitted" },
    { value: "teamlead_reviewed", label: "Team Lead Reviewed" },
    { value: "hr_reviewed", label: "HR Reviewed" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const [selectedStatus, setSelectedStatus] = useState("");

  // Filter branch options based on user role
  const filteredBranchOptions = () => {
    if (role === "superadmin") {
      return branchCodeOptions;
    } else if (role === "hr") {
      return branchCodeOptions.filter(
        (branch) => branch.value === userBranchCode
      );
    }
    return [];
  };


  useEffect(() => {
    fetchBranches(token);
  }, [token]);



  useEffect(() => {
    if (role === "superadmin" || role === "hr") {
      fetchBranches(token);
    }
  }, [token, role]);

  // Set initial branch code for HR
  useEffect(() => {
    if (role === "hr") {
      setSelectedBranchCode(userBranchCode);
    }
  }, [role, userBranchCode]);

  // Set staff ID for employees (non-HR, non-superadmin)
  useEffect(() => {
    if (role !== "hr" && role !== "superadmin") {
      setSelectedStaffId(staff_id);
    }
  }, [role, staff_id]);

  // Fetch staff options when branch code changes (for superadmin and HR)
  useEffect(() => {
    const getStaffOptions = async () => {
      if (
        (role === "superadmin" && !selectedBranchCode) ||
        (role === "hr" && !userBranchCode)
      ) {
        setStaffOptions([]);
        return;
      }

      setLoading(true);
      try {
        const branchToUse = role === "hr" ? userBranchCode : selectedBranchCode;
        const url = `/users/dropdown?branchcode=${branchToUse}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((staff) => ({
            value: staff.staff_id,
            label: `${staff.firstname} ${staff.lastname} (${staff.staff_id})`,
          }));
          setStaffOptions(options);
        }
      } catch (error) {
        console.error("Error fetching staff list", error);
        notify.error("Failed to fetch staff");
      } finally {
        setLoading(false);
      }
    };

    if (role === "superadmin" || role === "hr") {
      getStaffOptions();
    }
  }, [selectedBranchCode, token, role, userBranchCode]);

  // Fetch salary requests
  const fetchSalaryRequests = async () => {
    setLoading(true);
    try {
      let url = `/users/self_rating/read`;
      const params = new URLSearchParams();
      
      if (role === "superadmin") {
        if (selectedBranchCode) params.append("branchcode", selectedBranchCode);
        if (selectedStaffId) params.append("staff_id", selectedStaffId);
      } else if (role === "hr") {
        params.append("branchcode", userBranchCode);
        if (selectedStaffId) params.append("staff_id", selectedStaffId);
      } else {
        params.append("staff_id", staff_id);
      }

      // Common parameters
      if (selectedStatus) params.append("status", selectedStatus);
      if (startDate) params.append("start_date", formatDate(startDate));
      if (endDate) params.append("end_date", formatDate(endDate));
      params.append("page", currentPage);
      params.append("limit", pageSize);

      url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.data) {
        setSalaryRequests(response.data.data || []);
        setTotalItem(response.data.totalDocuments || 0);
      }
    } catch (error) {
      console.error("Error fetching salary requests", error);
      notify.error("Failed to fetch salary requests");
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
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

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };
  const handleBranchCodeChange = (value) => {
    setSelectedBranchCode(value);
    setSelectedStaffId("");
    setCurrentPage(1);
  };

  const handleStaffChange = (value) => {
    setSelectedStaffId(value);
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

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleApprovalSuccess = () => {
    setShowApprovalModal(false);
    notify.success("Salary request processed successfully!");
    fetchSalaryRequests();
  };

  const handleOnExport = () => {
    if (!salaryRequests || salaryRequests.length === 0) {
      notify.error("No data to export");
      return;
    }


      const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Branch added successfully!");
    fetchBranches(token);
    getBranch();
  };

    const dataToExport = salaryRequests.map((request) => ({
      "Performance ID": request.performance_id,
      "Staff ID": request.staff_id,
      "Name": request.name,
      "Branch Code": request.branchcode,
      "Designation": request.designation,
      "Department": request.department,
      "Review Year": request.review_year,
      "Self Rating": request.self_rating_overall,
      "Lead Rating": request.lead_technical_rating,
      "Status": request.status,
      "Increment Percentage": request.increment_percentage,
      "Increment Effective Date": request.increment_effective_date,
      "Created On": request.created_on,
      "Updated On": request.updated_on,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "SalaryRequests");
    XLSX.writeFile(wb, "SalaryRequests.xlsx");
  };

  useEffect(() => {
    fetchSalaryRequests();
  }, [
    currentPage,
    pageSize,
    selectedBranchCode,
    selectedStaffId,
    selectedStatus,
    startDate,
    endDate,
    role,
    userBranchCode,
  ]);

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const thead = () => [
    { data: "Performance ID" },
    { data: "Staff ID" },
    { data: "Name" },
    { data: "Branch Code" },
    { data: "Designation" },
    { data: "Department" },
    { data: "Review Year" },
    { data: "Self Rating" },
    { data: "Lead Rating" },
    { data: "Status" },
    { data: "Increment %" },
    { data: "Effective Date" },
    { data: "Created On" },
    { data: "Action" },
  ];

  const tbody = () => {
    if (!salaryRequests) return [];

    return salaryRequests.map((request) => {
      return ({
        id: request.performance_id,
        data: [
          { data: request.performance_id },
          { data: request.staff_id },
          { data: request.name },
          { data: request.branchcode },
          { data: request.designation },
          { data: request.department },
          { data: request.review_year },
          { data: request.self_rating_overall || "-" },
          { data: request.lead_technical_rating || "-" },
          {
            data: (
              <div
                className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${request.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : request.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : request.status === "hr_reviewed" || request.status === "teamlead_reviewed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"}`}
              >
                {request.status === "approved" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : request.status === "rejected" ? (
                  <XCircle className="w-3 h-3 mr-1" />
                ) : (
                  <Clock className="w-3 h-3 mr-1" />
                )}
                {request.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </div>
            ),
          },
          { data: request.increment_percentage ? `${request.increment_percentage}%` : "-" },
          {
            data: request.increment_effective_date
              ? new Date(request.increment_effective_date).toLocaleDateString()
              : "-"
          },
          { data: new Date(request.created_on).toLocaleDateString() },
          {
            data: (
              <div className="flex flex-nowrap justify-center gap-2">
                {/* Show Approve button only for HR and superadmin roles */}
                {(role === "hr" || role === "superadmin") && (
                  <button
                    className="p-1 text-amber-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={() => handleApproveRequest(request)}
                    title="Process"
                    disabled={request.status === "approved" || request.status === "rejected"}
                  >
                    <CircleCheckBig size={18} />
                  </button>
                )}
              </div>
            ),
            className: "action-cell",
          },
   
        ],
      });
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Salary Increment Requests</h3>
          <p className="text-xs text-slate-500">Track and review employee compensation revisions, ratings, and approval workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOnExport}
            disabled={salaryRequests.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-2xs transition disabled:opacity-50"
          >
            <FileDown size={14} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {role === "superadmin" && (
            <div className="min-w-[160px]">
              <Dropdown
                options={filteredBranchOptions()}
                selectedValue={selectedBranchCode}
                onSelect={handleBranchCodeChange}
                placeholder="Select Branch"
                className="w-full text-xs"
                isLoading={isStoreLoading}
              />
            </div>
          )}

          {(role === "superadmin" || role === "hr") && (
            <div className="min-w-[160px]">
              <Dropdown
                options={staffOptions}
                selectedValue={selectedStaffId}
                onSelect={handleStaffChange}
                placeholder="Select Staff"
                className="w-full text-xs"
                disabled={role === "hr" ? false : !selectedBranchCode}
                isLoading={loading}
              />
            </div>
          )}

          <div className="min-w-[140px]">
            <Dropdown
              options={statusOptions}
              selectedValue={selectedStatus}
              onSelect={handleStatusChange}
              placeholder="Select Status"
              className="w-full text-xs"
            />
          </div>

          <div className="min-w-[140px]">
            <Dropdown
              options={pageSizeOptions}
              selectedValue={pageSize}
              onSelect={handlePageSizeChange}
              placeholder="Items per page"
              className="w-full text-xs"
            />
          </div>

          <div className="min-w-[200px]">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              placeholderText="Select date range"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              isClearable={true}
            />
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4 text-xs text-slate-500">Loading requests...</div>}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Modern DataTable without cramped filters */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No increment requests found"
        enableSorting={true}
        enableFilters={false}
      />

      {/* Card Pagination */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={handlePageChange}
          paginationLabel="salary requests"
          isScroll={true}
        />
      </div>

      <Modal
        isVisible={showApprovalModal}
        maxWidth="3xl"
        onClose={() => setShowApprovalModal(false)}
        title="Process Salary Request"
      >
        <HRSalaryApprovalForm
          salaryRequest={selectedRequest}
          onSuccess={handleApprovalSuccess}
          onCancel={() => setShowApprovalModal(false)}
        />
      </Modal>
    </div>
  );
};

export default SalaryRevision;
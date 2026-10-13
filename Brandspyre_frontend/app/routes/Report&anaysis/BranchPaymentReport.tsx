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
  Building,
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

const BranchPaymentReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [paymentData, setPaymentData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDemoData, setShowDemoData] = useState(false);
  const [activeTab, setActiveTab] = useState("branchpay");

  // Demo data to show when API returns all zeros
  const demoData = [
    {
      team_id: "BRCH-01/TEAM/01",
      team_name: "Archetech Team",
      branchcode: "BRANCH-01",
      team_lead_id: "BRANCH/01/02",
      team_lead_name: "Keerthana",
      total_project_count: "3",
      total_project_amount: "50000",
      total_paid_amount: "15000",
      total_pending_amount: "35000",
      total_project_draft: "1",
      total_project_planning: "1",
      total_project_inprocess: "1",
      total_project_active: "1",
      total_project_completed: "0",
    },
  ];

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

  // Check if all values in the data are zero
  const isAllZeros = (data) => {
    if (!data || !data.data || data.data.length === 0) return true;

    return data.data.every(
      (team) =>
        team.total_project_amount === "0" &&
        team.total_paid_amount === "0" &&
        team.total_pending_amount === "0" &&
        team.total_project_count === "0"
    );
  };

  // Fetch payment data
  const fetchPaymentData = async () => {
    if (!selectedBranchCode || !startDate || !endDate) {
      setPaymentData(null);
      return;
    }

    setLoading(true);
    try {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      const url = `/teamview/report/read?branchcode=${selectedBranchCode}&startdate=${formattedStartDate}&enddate=${formattedEndDate}&page=${currentPage}&limit=${pageSize}`;

      const response = await apiClient.get(url);

      if (response.data) {
        setShowDemoData(isAllZeros(response.data));
        setPaymentData(response.data);
        setTotalItem(response.data.totalDocuments || 0);
      }
    } catch (error) {
      console.error("Error fetching payment data", error);
      notify.error("Failed to fetch payment data");
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
    return paymentData?.data || [];
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

    const exportData = dataToExport.map((team) => ({
      "Team Name": team.team_name,
      "Team Lead": team.team_lead_name,
      "Total Projects": team.total_project_count,
      "Total Amount": formatCurrency(team.total_project_amount),
      "Paid Amount": formatCurrency(team.total_paid_amount),
      "Pending Amount": formatCurrency(team.total_pending_amount),
      "Draft Projects": team.total_project_draft,
      "Planning Projects": team.total_project_planning,
      "In Process Projects": team.total_project_inprocess,
      "Active Projects": team.total_project_active,
      "Completed Projects": team.total_project_completed,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "BranchPaymentReport");
    XLSX.writeFile(wb, "BranchPaymentReport.xlsx");
  };

  const generateReport = () => {
    fetchPaymentData();
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

  // Calculate branch totals from the data
  const calculateBranchTotals = () => {
    const displayData = getDisplayData();
    if (displayData.length === 0) return null;

    return {
      totalProjects: displayData.reduce(
        (sum, team) => sum + parseInt(team.total_project_count || "0"),
        0
      ),
      totalAmount: displayData.reduce(
        (sum, team) => sum + parseInt(team.total_project_amount || "0"),
        0
      ),
      totalPaid: displayData.reduce(
        (sum, team) => sum + parseInt(team.total_paid_amount || "0"),
        0
      ),
      totalPending: displayData.reduce(
        (sum, team) => sum + parseInt(team.total_pending_amount || "0"),
        0
      ),
    };
  };

  const branchTotals = calculateBranchTotals();

  // Table configurations for payment data
  const paymentThead = () => [
    { data: "Team Name" },
    { data: "Team Lead" },
    { data: "Total Projects" },
    { data: "Total Amount" },
    { data: "Paid Amount" },
    { data: "Pending Amount" },
  ];

  const paymentTbody = () => {
    const displayData = getDisplayData();
    if (displayData.length === 0) return [];

    return displayData.map((team, index) => ({
      id: team.team_id || index,
      data: [
        { data: team.team_name },
        { data: team.team_lead_name },
        { data: formatNumber(team.total_project_count) },
        { data: formatCurrency(team.total_project_amount) },
        { data: formatCurrency(team.total_paid_amount) },
        { data: formatCurrency(team.total_pending_amount) },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-5">
              Branch Payment Report
            </h2>
            {/* {showDemoData && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  Showing demo data
                </div>
              )} */}
          </div>
<div className="flex flex-col gap-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex gap-19">
                <button
                  onClick={handleOnExport}
                  className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2 dark:bg-gray-800 dark:text-gray-300 py-2 w-[245px]"
                  disabled={!paymentData?.data && !showDemoData}
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
                    : !selectedBranchCode || !startDate || !endDate) || loading
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

          {(paymentData?.data || showDemoData) && (
            <>
              <div className="mb-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg text-[var(--color-primary)] font-semibold mb-2">
                  Branch Financial Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                      <Building className="mr-1" size={16} /> Branch
                    </p>
                    <p className="font-medium">{selectedBranchCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                      <DollarSign className="mr-1" size={16} /> Total Amount
                    </p>
                    <p className="font-medium">
                      {formatCurrency(branchTotals?.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                      <CreditCard className="mr-1" size={16} /> Total Paid
                    </p>
                    <p className="font-medium">
                      {formatCurrency(branchTotals?.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                      <PieChart className="mr-1" size={16} /> Total Pending
                    </p>
                    <p className="font-medium">
                      {formatCurrency(branchTotals?.totalPending)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                      <Users className="mr-1" size={16} /> Total Projects
                    </p>
                    <p className="font-medium">
                      {formatNumber(branchTotals?.totalProjects)}
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

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <CreditCard className="mr-2" size={20} /> Team Payment Summary
                </h3>
                <div className="overflow-x-auto">
                  <DataTable
                    thead={paymentThead}
                    tbody={paymentTbody}
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
                  paginationLabel="records"
                  isScroll={true}
                />
              </div>
            </>
          )}

          {!loading && !paymentData && !showDemoData && (
            <div className="text-center py-10 text-gray-500">
              {role !== "team-lead" && role !== "superadmin"
                ? !startDate || !endDate
                  ? "Please select date range to generate report"
                  : "Click 'Generate Report' to view payment summary"
                : role === "team-lead"
                  ? !userBranchCode
                    ? "Loading branch information..."
                    : !startDate || !endDate
                      ? "Please select date range"
                      : "Click 'Generate Report' to view data"
                  : !selectedBranchCode
                    ? "Please select Branch to view available options"
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

export default BranchPaymentReport;

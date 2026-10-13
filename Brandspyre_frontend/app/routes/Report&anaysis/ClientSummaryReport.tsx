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

const ClientSummaryReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedClientCode, setSelectedClientCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
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
    { value: "client_name", label: "Client Name" },
    { value: "company_name", label: "Company Name" },
    { value: "total_projects", label: "Total Projects" },
    { value: "minor_priority_projects", label: "Minor Priority Projects" },
    { value: "major_priority_projects", label: "Major Priority Projects" },
    { value: "critical_priority_projects", label: "Critical Priority Projects" },
    { value: "blocker_priority_projects", label: "Blocker Priority Projects" },
    { value: "draft_projects", label: "Draft Projects" },
    { value: "planning_projects", label: "Planning Projects" },
    { value: "inprocess_projects", label: "In Process Projects" },
    { value: "active_projects", label: "Active Projects" },
    { value: "lead_review_projects", label: "Lead Review Projects" },
    { value: "completed_projects", label: "Completed Projects" },
    { value: "revised_projects", label: "Revised Projects" },
    { value: "client_review_projects", label: "Client Review Projects" },
    { value: "drop_projects", label: "Dropped Projects" },
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

  useEffect(() => {
    const getClientOptions = async () => {
      // For non-superadmin users, use the static branchcode
      const branchCodeToUse = userRole === "superadmin" ? selectedBranchCode : staticBranchCode;
      
      if (!branchCodeToUse) {
        setClientOptions([]);
        return;
      }
      
      setLoading(true);
      try {
        const url = `/client/overview/dropdown?branchcode=${branchCodeToUse}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((client) => ({
            value: client.client_code,
            label: `${client.client_name} (${client.client_code})`,
          }));
          setClientOptions(options);
        }
      } catch (error) {
        console.error("Error fetching client list", error);
        notify.error("Failed to fetch clients");
      } finally {
        setLoading(false);
      }
    };

    getClientOptions();
  }, [selectedBranchCode, staticBranchCode, token, userRole]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = `/report/branchsummary/read`;
      const params = new URLSearchParams();

      if (selectedClientCode) {
        params.append("client_code", selectedClientCode);
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

      const branchCodeToUse = userRole === "superadmin" ? selectedBranchCode : staticBranchCode;
      if (branchCodeToUse) {
        params.append("branchcode", branchCodeToUse);
      }

      url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.data) {
        setReportData(response.data);
        setTotalItem(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching client summary report", error);
      notify.error("Failed to fetch client summary report");
      setError("Failed to fetch report");
    } finally {
      setLoading(false);
    }
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
    setSelectedClientCode("");
    setCurrentPage(1);
  };

  const handleClientChange = (value) => {
    setSelectedClientCode(value);
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
    
    // Export client details
    const clientDetails = reportData.data.map(client => ({
      "Client Code": client.client_code,
      "Client Name": client.client_name,
      "Branch Code": client.branchcode,
      "Company Name": client.company_name,
      "Email": client.email,
      "Communication Type": client.comm_type,
      "Created On": client.created_on ? new Date(client.created_on).toLocaleDateString() : "N/A",
      "Total Projects": client.total_projects,
      "Minor Priority Projects": client.minor_priority_projects,
      "Major Priority Projects": client.major_priority_projects,
      "Critical Priority Projects": client.critical_priority_projects,
      "Blocker Priority Projects": client.blocker_priority_projects,
      "Draft Projects": client.draft_projects,
      "Planning Projects": client.planning_projects,
      "In Process Projects": client.inprocess_projects,
      "Active Projects": client.active_projects,
      "Lead Review Projects": client.lead_review_projects,
      "Completed Projects": client.completed_projects,
      "Revised Projects": client.revised_projects,
      "Client Review Projects": client.client_review_projects,
      "Dropped Projects": client.drop_projects,
      "Total Milestones": client.total_milestones,
      "Draft Milestones": client.draft_milestones,
      "In Process Milestones": client.inprocess_milestones,
      "Archived Milestones": client.archived_milestones,
      "Dropped Milestones": client.drop_milestones,
      "Verified Milestones": client.verified_milestones,
      "Total Tasks": client.total_tasks,
      "Minor Priority Tasks": client.minor_priority_task,
      "Major Priority Tasks": client.major_priority_task,
      "Critical Priority Tasks": client.critical_priority_task,
      "Blocker Priority Tasks": client.blocker_priority_task,
      "In Process Tasks": client.inprocess_tasks,
      "Archived Tasks": client.archived_tasks,
      "Verified/Closed Tasks": client.verified_closed_tasks
    }));
    
    const wsClient = XLSX.utils.json_to_sheet(clientDetails);
    XLSX.utils.book_append_sheet(wb, wsClient, "Client Summary");
    
    XLSX.writeFile(wb, "ClientSummaryReport.xlsx");
  };

  // Table headers for client summary
  const clientThead = () => [
    { data: "Client Code" },
    { data: "Client Name" },
    { data: "Company" },
    { data: "Total Projects" },
    { data: "Draft" },
    { data: "In Process" },
    { data: "Completed" },
    { data: "Total Tasks" },
    { data: "Created On" },
  ];

  // Table body for client summary
  const clientTbody = () => {
    if (!reportData?.data) return [];
    
    return reportData.data.map((client, index) => ({
      id: client.client_code,
      data: [
        { data: client.client_code },
        { data: client.client_name },
        { data: client.company_name },
        { data: client.total_projects },
        { data: client.draft_projects },
        { data: client.inprocess_projects },
        { data: client.completed_projects },
        { data: client.total_tasks },
        { data: client.created_on ? new Date(client.created_on).toLocaleDateString() : "N/A" },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow ">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
              Client Summary Report
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
              
              <Dropdown
                options={clientOptions}
                selectedValue={selectedClientCode}
                onSelect={handleClientChange}
                placeholder="Select Client"
                className="w-full"
                disabled={userRole === "superadmin" ? !selectedBranchCode : false}
                isLoading={loading}
              />
              
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
              
              <Dropdown
                options={pageSizeOptions}
                selectedValue={pageSize}
                onSelect={handlePageSizeChange}
                placeholder="Items per page"
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4">
              <button
                onClick={handleOnExport}
                className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2.5 dark:bg-gray-800 dark:text-gray-300 py-2.5 w-[285px]"
                disabled={!reportData?.data}
              >
                <FileDown className="mr-1" />
                {!isMobile && "Export Excel"}
              </button>
              
              <button
                onClick={fetchReportData}
                className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5 mr-[48px] "
                disabled={loading}
              >
                {loading ? "Loading..." : "Generate Report"}
              </button>
            </div>
          </div>

          {reportData && (
            <>
              {reportData.data.length > 0 ? (
                <>
                  <div className="mb-6">
                    <DataTable
                      thead={clientThead}
                      tbody={clientTbody}
                      responsive={true}
                      className="min-w-full"
                    />

                    <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
                      <CustomPagination
                        total={totalItem}
                        currentPage={currentPage}
                        defaultPageSize={pageSize}
                        onChange={handlePageChange}
                        paginationLabel="clients"
                        isScroll={true}
                      />
                    </div>
                  </div>

                  {/* Detailed Client Summary Section */}
                  {selectedClientCode && reportData.data.length === 1 && (
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <h3 className="text-lg text-red-700 font-semibold mb-4">Detailed Client Summary</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded shadow">
                          <p className="text-sm text-red-700 mb-1"><SquareKanban className="inline mr-2" size={16}/> Client Code</p>
                          <p className="font-medium text-lg">{reportData.data[0].client_code}</p>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded shadow">
                          <p className="text-sm text-red-700 mb-1"><SquareKanban className="inline mr-2" size={16}/> Client Name</p>
                          <p className="font-medium text-lg">{reportData.data[0].client_name}</p>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded shadow">
                          <p className="text-sm text-red-700 mb-1"><SquareKanban className="inline mr-2" size={16}/> Company</p>
                          <p className="font-medium text-lg">{reportData.data[0].company_name}</p>
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
                          <div className="bg-white dark:bg-gray-700 p-3 rounded shadow text-center">
                            <p className="text-sm text-gray-500">Dropped</p>
                            <p className="font-medium">{reportData.data[0].drop_projects}</p>
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
                ? "Please select a Branch to view available clients"
                : "Click 'Generate Report' to view data"}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientSummaryReport;
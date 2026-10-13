import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Dropdown from "src/component/DrapDown";
import {
  FileDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Layers,
  Upload,
  Calendar,
  X,
  RefreshCw,
  FolderGit2
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import { useMediaQuery } from "../hooks/use-click-outside";
import useProjectStore from "src/stores/ProjectStore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "react-router-dom";

const RevisedProjectOverall = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [roleAccess, setRoleAccess] = useState<any>(null);
  
  // Date & Type Filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedFilterType, setSelectedFilterType] = useState("");
  const [selectedPayStatus, setSelectedPayStatus] = useState("");
  const [sheetData, setSheetData] = useState<any[]>([]);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const UserRole = useAuthStore((state) => state.role);
  const UserId = useAuthStore((state) => state.staff_id);
  const branchcode = useAuthStore((state) => state.branchcode);

  const { fetchProject } = useProjectStore();
  const { branchCodeOptions, fetchBranches, isLoading: isStoreLoading } = useBranchStore();

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
    { value: 40, label: "40 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  const navigate = useNavigate();

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
          if (data.status) setRoleAccess(data.access);
        });
      fetchProject(token, branchcode);
    }
  }, [hydrated, token, UserRole]);

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

  const getBranch = async () => {
    setLoading(true);
    try {
      let url = `/getrevisions?page=${currentPage}&limit=${pageSize}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectStatus) url += `&status=${selectStatus}`;
      if (selectedPriority) url += `&priority=${selectedPriority}`;
      if (selectedBranchCode) url += `&branchcode=${encodeURIComponent(selectedBranchCode)}`;
      if (sortOrder) url += `&dec=${sortOrder}`;
      if (startDate) url += `&created_on=${formatDate(startDate)}`;
      if (endDate) url += `&end_date=${formatDate(endDate)}`;
      if (selectedFilterType) url += `&filter_type=${selectedFilterType}`;
      if (selectedPayStatus) url += `&paystatus=${selectedPayStatus}`;

      const response = await apiClient.get(url);

      setSheetData(response?.data?.revisions || []);
      setTotalItem(response?.data?.count || 0);
      setData(response?.data?.revisions || []);
    } catch (err: any) {
      console.error("Error fetching revisions list", err);
      setError("Failed to fetch revisions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "" : "desc"));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectStatus("");
    setSelectedPriority("");
    setSelectedBranchCode("");
    setSelectedFilterType("");
    setSelectedPayStatus("");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "ProjectRevisions");
    XLSX.writeFile(wb, "ProjectRevisions.xlsx");
  };

  const handleOnExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Project Milestone Revisions Report", 14, 10);
    if (sheetData.length > 0) {
      const importantCols = ["project_code", "miles_title", "previous_total_amount", "revision_reason", "base_amount", "total_amount"];
      const columns = importantCols.map((key) => ({ header: key, dataKey: key }));
      autoTable(doc, {
        columns,
        body: sheetData,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [185, 28, 28], fontSize: 9 },
        theme: "grid",
      });
    }
    doc.save("ProjectRevisions.pdf");
  };

  const columns = [
    { key: "id", label: "#" },
    { key: "branchcode", label: "Branch Code" },
    { key: "project_code", label: "Project Code" },
    { key: "miles_title", label: "Milestone Name" },
    { key: "previous_total_amount", label: "Previous Base Amount" },
    { key: "revision_reason", label: "Revision Reason" },
    { key: "base_amount", label: "Revised Base Amount" },
    { key: "additional_amount", label: "Additional Amount" },
    { key: "total_amount", label: "Revised Total Amount" },
    { key: "revised_difference", label: "Revision Delta" },
    { key: "created_on", label: "Revised Date" },
  ];

  const thead = () =>
    columns.map((col) => ({
      data: (
        <span className="font-extrabold text-slate-700 dark:text-slate-200 text-xs tracking-wider uppercase">
          {col.label}
        </span>
      ),
      className: col.key === "id" ? "w-12 text-center" : "",
    }));

  const tbody = () => {
    if (!data || data.length === 0) return [];

    return data.map((project, index) => {
      const viewUrl = `/project/${encodeURIComponent(project.project_code)}`;
      const prevAmount = project.previous_total_amount || 0;
      const revisedTotal = project.total_amount || 0;
      const difference = revisedTotal - prevAmount;

      return {
        data: [
          { data: (index + 1) + (currentPage - 1) * pageSize },
          { data: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{project.branchcode}</span> },
          { 
            data: (
              <span 
                onClick={() => navigate(viewUrl)}
                className="font-extrabold text-red-700 dark:text-red-400 hover:underline cursor-pointer font-mono"
              >
                {project.project_code}
              </span>
            ) 
          },
          { data: <span className="font-semibold text-slate-900 dark:text-white">{project.miles_title || 'N/A'}</span> },
          { data: <span className="font-bold text-slate-600 dark:text-slate-400">₹{prevAmount.toLocaleString('en-IN')}</span> },
          { data: <span className="text-slate-600 dark:text-slate-300 italic text-xs">{project.revision_reason || 'Scope Revision'}</span> },
          { data: <span className="font-bold text-slate-900 dark:text-white">₹{(project.base_amount || 0).toLocaleString('en-IN')}</span> },
          { data: <span className="font-bold text-slate-500">₹{(project.additional_amount || 0).toLocaleString('en-IN')}</span> },
          { data: <span className="font-extrabold text-slate-900 dark:text-white text-sm">₹{revisedTotal.toLocaleString('en-IN')}</span> },
          {
            data: (
              <div className="flex items-center gap-1">
                {difference > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 font-extrabold text-xs flex items-center gap-0.5">
                    <ArrowUp size={12} /> +₹{difference.toLocaleString('en-IN')}
                  </span>
                ) : difference < 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 font-extrabold text-xs flex items-center gap-0.5">
                    <ArrowDown size={12} /> -₹{Math.abs(difference).toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs">
                    ₹0
                  </span>
                )}
              </div>
            ),
          },
          { data: <span className="text-xs text-slate-400 font-mono">{project.created_on ? new Date(project.created_on).toLocaleDateString('en-IN') : 'N/A'}</span> },
        ].map((col) => ({ ...col })),
      };
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 dark:text-slate-100 min-h-screen flex flex-col justify-between">
      <div className="space-y-6">
        {/* Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-extrabold text-[10px] uppercase tracking-wider">
                Project Audit Ledger
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Revised Projects & Milestone History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit log of project milestone budget revisions, scope modifications, and cost deltas
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                showFilters
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
            </button>

            <button
              onClick={handleOnExport}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown size={14} className="text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleOnExportPDF}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown size={14} className="text-red-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Primary Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Search Input */}
          <div className="w-full md:w-80">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search project code, milestone..."
              className="w-full"
            />
          </div>

          {/* Quick Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Dropdown
              options={statusOptions}
              selectedValue={selectStatus}
              onSelect={(val) => { setSelectStatus(val); setCurrentPage(1); }}
              placeholder="Project Status"
              className="w-full sm:w-[170px]"
            />

            <Dropdown
              options={branchCodeOptions}
              selectedValue={selectedBranchCode}
              onSelect={(val) => { setSelectedBranchCode(val); setCurrentPage(1); }}
              placeholder="Branch Code"
              className="w-full sm:w-[170px]"
              isLoading={isStoreLoading}
            />

            <Dropdown
              options={pageSizeOptions}
              selectedValue={pageSize}
              onSelect={(val) => { setPageSize(val); setCurrentPage(1); }}
              placeholder="Items per page"
              className="w-full sm:w-[140px]"
            />
          </div>
        </div>

        {/* Secondary Collapsible Filter Box */}
        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Filter size={14} className="text-red-600" /> Advanced Filter Options
              </span>
              <button onClick={clearFilters} className="text-red-600 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer">
                <RefreshCw size={12} /> Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Priority</label>
                <Dropdown
                  options={managerOptions}
                  selectedValue={selectedPriority}
                  onSelect={(val) => { setSelectedPriority(val); setCurrentPage(1); }}
                  placeholder="Priority"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Filter Type</label>
                <Dropdown
                  options={filterTypeOptions}
                  selectedValue={selectedFilterType}
                  onSelect={(val) => { setSelectedFilterType(val); setCurrentPage(1); }}
                  placeholder="Filter Type"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={(d) => { setStartDate(d); setCurrentPage(1); }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs"
                  placeholderText="Select start date"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={(d) => { setEndDate(d); setCurrentPage(1); }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || undefined}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs"
                  placeholderText="Select end date"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium text-xs">
              <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading project revision log...
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <FolderGit2 size={40} className="mx-auto text-slate-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Project Revisions Recorded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No milestone budget revisions match your search criteria. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                thead={thead}
                tbody={tbody}
                responsive={true}
                className="min-w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <CustomPagination
          currentPage={currentPage}
          totalItems={totalItem}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
};

export default RevisedProjectOverall;
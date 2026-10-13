import { useEffect, useState, useMemo } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Dropdown from "src/component/DrapDown";
import { FileDown, ChevronRight, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notify } from "~/services/notificationService";
import useBranchStore from "src/stores/useBranchStore";

const EmployeePaymentsPage = () => {
  const [data, setData] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectOptions, setProjectOptions] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);

  const {
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  // Fetch project dropdown
  useEffect(() => {
    const getProjectOptions = async () => {
      if (!selectedBranchCode) {
        setProjectOptions([]);
        return;
      }

      setLoading(true);
      try {
        const url = `/project/overview/dropdown?branchcode=${selectedBranchCode}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((project) => ({
            value: project.project_code,
            label: `${project.title} (${project.project_code})`,
          }));
          setProjectOptions(options);
        }
      } catch (error) {
        console.error("Error fetching project list", error);
        notify.error("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    getProjectOptions();
  }, [selectedBranchCode, token]);

  // Fetch payments (with hierarchy)
  const getPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/getemployeepaments`;
      const params = {};
      if (projectCode) params.project_code = projectCode;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get(url, {
        params,
      });

      const resData = response?.data?.data || [];
      setData(resData);
      setSheetData(resData);
      setTotalItem(resData.length);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch employee payments");
      notify.error("Failed to fetch data" );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) getPayments();
  }, [token]);

  const handleFilter = () => getPayments();
  const clearFilters = () => {
    setProjectCode("");
    setStartDate("");
    setEndDate("");
    getPayments();
  };

  const columns = [
    { key: "month", label: "Month" },
    { key: "project_code", label: "Project Code" },
    { key: "staff_id", label: "Staff ID" },
    { key: "task_count", label: "Tasks" },
    { key: "total_duration", label: "Total Duration" },
    { key: "total_task_count", label: "Total Project Tasks" },
    { key: "project_budget", label: "Project Budget" },
    { key: "contribution_percent", label: "Contribution (%)" },
    { key: "allocated_payment", label: "Allocated Payment" },
  ];

  // Row color logic
  const getRowStyle = (row) => {
    const type = row.type?.toLowerCase?.() || "";
    switch (type) {
      case "project":
        return "bg-blue-50 border-l-4 border-blue-400";
      case "milestone":
        return "bg-green-50 border-l-4 border-green-400";
      case "task":
        return "bg-yellow-50 border-l-4 border-yellow-400";
      case "subtask":
        return "bg-orange-50 border-l-4 border-orange-400";
      default:
        return "";
    }
  };

  // Expand/collapse
  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Recursive flattening with indentation
  const buildRows = (rows, level = 0) =>
    rows.flatMap((row) => {
      const hasChildren = Array.isArray(row.children) && row.children.length > 0;
      const isExpanded = expandedRows.includes(row.id);
      const indent = { paddingLeft: `${level * 1.5}rem` };

      const mainRow = {
        className: `${getRowStyle(row)} ${hasChildren ? "cursor-pointer" : ""}`,
        data: columns.map((col, i) => {
          if (i === 1) {
            return {
              data: (
                <div
                  style={indent}
                  onClick={() => hasChildren && toggleExpand(row.id)}
                  className="flex items-center"
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="mr-1 w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="mr-1 w-4 h-4 text-gray-600" />
                    )
                  ) : (
                    <span className="w-4 mr-1" />
                  )}
                  {row[col.key]}
                </div>
              ),
            };
          }
          return { data: row[col.key] ?? "-" };
        }),
      };

      const childRows =
        hasChildren && isExpanded ? buildRows(row.children, level + 1) : [];

      return [mainRow, ...childRows];
    });

  const thead = () => columns.map((col) => ({ data: col.label }));
  const tbody = () => buildRows(data);

  // Export Excel/PDF
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "EmployeePayments");
    XLSX.writeFile(wb, "EmployeePayments.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.text("Employee Payments Report", 14, 10);
    const cols = columns.map((c) => ({ header: c.label, dataKey: c.key }));
    autoTable(doc, {
      columns: cols,
      body: sheetData,
      startY: 20,
    });
    doc.save("EmployeePayments.pdf");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 flex-grow">
        <h2 className="text-xl font-semibold mb-4">Employee Payments</h2>
{/* Filter Section */}
        <div className="flex flex-wrap gap-3 mb-5 items-end">
          <Dropdown
            options={branchCodeOptions}
            selectedValue={selectedBranchCode}
            onSelect={(v) => setSelectedBranchCode(v)}
            placeholder="Select Branch"
            isLoading={isStoreLoading}
          />

          <Dropdown
            options={projectOptions}
            selectedValue={projectCode}
            onSelect={(v) => setProjectCode(v)}
            placeholder="Select Project"
            disabled={!selectedBranchCode}
            isLoading={loading}
          />

          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            onClick={handleFilter}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Clear
          </button>
        </div>

        {/* Search + Export Section */}
        <div className="flex gap-4 mb-5 flex-wrap">
          <Dropdown
            options={pageSizeOptions}
            selectedValue={pageSize}
            onSelect={(v) => setPageSize(v)}
            placeholder="Items per page"
          />
          <SearchInput
            value={searchTerm}
            onChange={(v) => setSearchTerm(v)}
            placeholder="Search..."
          />
          <button
            onClick={handleExportExcel}
            className="px-3 py-1 border rounded-sm"
          >
            <FileDown size={16} className="inline mr-1" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1 border rounded-sm"
          >
            <FileDown size={16} className="inline mr-1" />
            Export PDF
          </button>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <DataTable thead={thead} tbody={tbody} responsive={true} />
        )}
      </div>

      <div className="bottom-0 border-t border-gray-200 p-4">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(p) => setCurrentPage(p)}
          paginationLabel="records"
          isScroll={true}
        />
      </div>
    </div>
  );
};

export default EmployeePaymentsPage;

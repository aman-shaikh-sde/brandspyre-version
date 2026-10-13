import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import { FileDown, BarChart3, FileText, CheckCircle2, XCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const ReportAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [selectedManager, setSelectedManager] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const token = useAuthStore((state) => state.accessToken);
  const { managerOptions, fetchBranches, isLoading: isStoreLoading } = useBranchStore();

  useEffect(() => {
    if (token) fetchBranches(token);
  }, [token]);

  const getReportData = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    manager = selectedManager
  ) => {
    setLoading(true);
    try {
      let url = `/branch/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (manager) url += `&manager_id=${manager}`;

      const response = await apiClient.get(url);

      setData(response?.data?.data || response?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);
    } catch (error) {
      console.error("Error fetching report analysis", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getReportData(currentPage, pageSize, searchTerm, selectedManager);
    }
  }, [token, currentPage, pageSize, searchTerm, selectedManager]);

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "OperationalReports");
    XLSX.writeFile(wb, "Operational_Analysis.xlsx");
  };

  const thead = () => [
    { data: "Staff ID & Name" },
    { data: "Branch Code" },
    { data: "Leave Type" },
    { data: "Duration (Days)" },
    { data: "Date Range" },
    { data: "Approval Status" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((item: any, idx: number) => {
      const isApproved = item.status === "approved" || item.status === "apporved";
      return {
        id: item.id || item._id || idx,
        data: [
          {
            data: (
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.staff_name || item.name || "Employee"}</span>
                <p className="text-xs font-mono text-slate-500">ID: {item.staff_id || "—"}</p>
              </div>
            ),
          },
          { data: <CrmBadge label={item.branchcode || "GLOBAL"} variant="purple" /> },
          { data: <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.LeaveType || item.leave_type || "Casual Leave"}</span> },
          { data: <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{item.LeaveDays || item.days || 1}</span> },
          {
            data: (
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                {item.FromDate ? new Date(item.FromDate).toLocaleDateString() : "—"} to{" "}
                {item.ToDate ? new Date(item.ToDate).toLocaleDateString() : "—"}
              </span>
            ),
          },
          { data: <CrmBadge label={isApproved ? "Approved" : "Pending"} variant={isApproved ? "green" : "amber"} /> },
        ],
      };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report & Operational Analysis"
        description="Comprehensive organization analytics, workforce leave statistics, and branch manager performance reports."
        secondaryActions={[
          { label: "Export Excel", onClick: handleOnExport, icon: <FileDown size={14} /> },
        ]}
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search staff ID or branch..."
        filters={[
          {
            key: "manager",
            label: "Branch Manager",
            options: (managerOptions || []).map((m: any) => ({ value: m.value || m, label: m.label || m })),
            value: selectedManager,
            onChange: (val) => {
              setSelectedManager(val);
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectedManager("");
          setCurrentPage(1);
        }}
      />

      {/* Data Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No operational report records match your query"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="records"
          isScroll={true}
        />
      </div>
    </div>
  );
};

export default ReportAnalysis;

import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import { FileDown, ShieldCheck, Activity, Clock, UserCheck } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const ActiveLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const token = useAuthStore((state) => state.accessToken);
  const { branchCodeOptions, fetchBranches } = useBranchStore();

  useEffect(() => {
    if (token) fetchBranches(token);
  }, [token]);

  const getLogs = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    branchCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/users/login/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (branchCode) url += `&branchcode=${branchCode}`;

      const response = await apiClient.get(url);

      setData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);
    } catch (error) {
      console.error("Error fetching activity logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getLogs(currentPage, pageSize, searchTerm, selectedBranchCode);
    }
  }, [token, currentPage, pageSize, searchTerm, selectedBranchCode]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "ActivityLogs");
    XLSX.writeFile(wb, "System_Activity_Logs.xlsx");
  };

  const thead = () => [
    { data: "Staff & User ID" },
    { data: "Branch Code" },
    { data: "Activity Event" },
    { data: "Login Date" },
    { data: "Timestamp" },
    { data: "Status" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((log: any, idx: number) => ({
      id: log.id || log._id || idx,
      data: [
        {
          data: (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <UserCheck size={14} />
              </div>
              <div>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{log.staff_id || log.user_id || "System User"}</span>
              </div>
            </div>
          ),
        },
        { data: <CrmBadge label={log.branchcode || "GLOBAL"} variant="purple" /> },
        {
          data: (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <Activity size={13} className="text-emerald-500" />
              <span>{log.device || log.activity || "Logged in"}</span>
            </div>
          ),
        },
        { data: <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{log.date || (log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "—")}</span> },
        {
          data: (
            <div className="flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-400">
              <Clock size={12} className="text-slate-400" />
              {log.time || (log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "—")}
            </div>
          ),
        },
        { data: <CrmBadge label="Authenticated" variant="green" /> },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & System Activity Audit"
        description="Monitor staff authentication sessions, tenant access logs, security events, and active system sign-ins."
        secondaryActions={[
          { label: "Export Excel", onClick: handleExport, icon: <FileDown size={14} /> },
        ]}
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search staff ID or activity device..."
        filters={[
          {
            key: "branch",
            label: "Branch Code",
            options: (branchCodeOptions || []).map((b: any) => ({ value: b.value || b, label: b.label || b })),
            value: selectedBranchCode,
            onChange: (val) => {
              setSelectedBranchCode(val);
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectedBranchCode("");
          setCurrentPage(1);
        }}
      />

      {/* Data Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No activity log entries match your search criteria"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="audit logs"
          isScroll={true}
        />
      </div>
    </div>
  );
};

export default ActiveLog;

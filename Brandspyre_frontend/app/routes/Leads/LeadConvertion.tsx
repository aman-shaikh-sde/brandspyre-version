import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Eye, TrendingUp, Users, CheckCircle2, Percent } from "lucide-react";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import AddNewLeadForm from "./AddNewLead";
import EditLeadForm from "./EditLeadsForm";
import LeadClientForm from "../Clients/LeadClientForm";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const LeadConvertion = () => {
  const navigate = useNavigate();
  const accesstoken = useAuthStore((state) => state.accessToken);
  const branchCodeOptions = useBranchStore((state) => state.branchCodeOptions);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectBranchCode, setSelectBranchCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const token = accesstoken;

  const [data, setData] = useState({
    overall: { total_leads: 0, converted_leads: 0, conversion_rate: "0.00%" },
    branches: [],
    convertedList: [],
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConvertClientModal, setShowConvertClientModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

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

  const getLeadConversion = async (branchCode?: string) => {
    setLoading(true);
    try {
      let url = `/getleadconvet`;
      if (branchCode && branchCode !== "ALL" && branchCode !== "") {
        url += `?branchcode=${encodeURIComponent(branchCode)}`;
      }

      const response = await apiClient.get(url);

      setData({
        overall: response.data?.overall || { total_leads: 0, converted_leads: 0, conversion_rate: "0.00%" },
        branches: response.data?.branches || [],
        convertedList: response.data?.converted_list || [],
      });
    } catch (error) {
      console.error("Error fetching lead conversion stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getLeadConversion(selectBranchCode);
    }
  }, [hydrated, token, selectBranchCode]);

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data.convertedList);
    XLSX.utils.book_append_sheet(wb, ws, "Converted Leads");
    XLSX.writeFile(wb, "ConvertedLeads.xlsx");
  };

  const thead = () => [
    { data: "Client / Lead Name" },
    { data: "Company & Code" },
    { data: "Branch Code" },
    { data: "Contact Email" },
    { data: "Conversion Date" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data.convertedList) return [];

    return data.convertedList.map((item: any) => ({
      id: item._id || item.id || item.leadcode,
      data: [
        {
          data: (
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name || item.leadname || "Converted Client"}</span>
              <p className="text-xs text-slate-500">{item.phone || item.mobile || "—"}</p>
            </div>
          ),
        },
        {
          data: (
            <div>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{item.leadcode || item.clientcode || "—"}</span>
              <p className="text-xs text-slate-500">{item.company_name || "—"}</p>
            </div>
          ),
        },
        { data: <CrmBadge label={item.branchcode || "GLOBAL"} variant="purple" /> },
        { data: <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{item.email || "—"}</span> },
        {
          data: (
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {item.converted_at || item.createdAt ? new Date(item.converted_at || item.createdAt).toLocaleDateString() : "—"}
            </span>
          ),
        },
        { data: <CrmBadge label="Converted to Client" variant="green" /> },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <Link to={`/leadsview/${item._id || item.id}`}>
                <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition" title="View Lead Detail">
                  <Eye size={16} />
                </button>
              </Link>
            </div>
          ),
        },
      ],
    }));
  };

  if (!hydrated) {
    return <div className="p-8 text-center text-slate-400">Loading conversion analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Conversion Analytics"
        description="Track lead acquisition funnel velocity, branch conversion metrics, and successfully converted enterprise accounts."
        secondaryActions={[
          { label: "Export Excel", onClick: handleOnExport, icon: <FileDown size={14} /> },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Leads Captured</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{data.overall.total_leads}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Converted Clients</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{data.overall.converted_leads}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Conversion Rate</p>
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{data.overall.conversion_rate}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        searchPlaceholder="Search converted lead or client name..."
        filters={[
          {
            key: "branch",
            label: "Branch Code",
            options: (branchCodeOptions || []).map((b: any) => ({ value: b.value || b, label: b.label || b })),
            value: selectBranchCode,
            onChange: (val) => setSelectBranchCode(val),
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectBranchCode("");
        }}
      />

      {/* Data Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No converted leads match your criteria"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={data.convertedList?.length || 0}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="converted leads"
          isScroll={true}
        />
      </div>
    </div>
  );
};

export default LeadConvertion;

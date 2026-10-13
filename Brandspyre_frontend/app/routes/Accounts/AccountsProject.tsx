import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { useNavigate } from "react-router-dom";
import AddNewProject from "../Project/AddNewProject";
import EditProjectForm from "../Project/ProjectDocuments/EditProjectForm";
import ProjectMeetingForm from "../Project/Meeting/ProjectMeetingForm";
import InvoiceList from "./InvoiceList";
import PayRequestOverallList from "./payreqest_overall";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const AccountsProject = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [sortOrder, setSortOrder] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [activeTab, setActiveTab] = useState("projectlist");
  const [hydrated, setHydrated] = useState(false);
  const [selectedPayStatus, setSelectedPayStatus] = useState("");

  const accesstoken = useAuthStore((state) => state.accessToken);
  const branchcode = useAuthStore((state) => state.branchcode);
  const token = accesstoken;
  const navigate = useNavigate();

  const { branchCodeOptions, fetchBranches } = useBranchStore();

  const tabs = [
    { id: "projectlist", label: "Project Financials" },
    { id: "payrequest", label: "Invoice Directory" },
    { id: "payrequestlist", label: "Payment Requests" },
  ];

  const statusOptions = [
    { value: "active", label: "Active Projects" },
    { value: "draft", label: "Draft Projects" },
    { value: "planning", label: "Planning Projects" },
    { value: "paused", label: "Paused Projects" },
    { value: "completed", label: "Completed Projects" },
  ];

  const payStatusOptions = [
    { value: "paid", label: "Paid" },
    { value: "partially_paid", label: "Partially Paid" },
    { value: "pending", label: "Unpaid / Pending" },
  ];

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

  const getBranch = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    bCode = selectedBranchCode,
    payStatus = selectedPayStatus
  ) => {
    setLoading(true);
    try {
      let url = `/project/overview/read?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (bCode) url += `&branchcode=${bCode}`;
      if (payStatus) url += `&paystatus=${payStatus}`;

      const response = await apiClient.get(url);
      setSheetData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || 0);
      setData(response?.data?.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching project accounts", err);
      setError("Failed to fetch project accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getBranch();
    }
  }, [hydrated, token, currentPage, searchTerm, selectStatus, selectedBranchCode, selectedPayStatus, pageSize]);

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "ProjectAccounts");
    XLSX.writeFile(wb, "Project_Accounts.xlsx");
  };

  const handleOnExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Project Financial Summary", 14, 10);
    if (sheetData.length > 0) {
      const tableColumn = ["Project Code", "Project Name", "Client", "Payment Status", "Budget"];
      const tableRows = sheetData.map((item: any) => [
        item.project_code || "",
        item.title || "",
        item.client_code || "",
        item.paystatus || "pending",
        item.budget ? `₹${item.budget}` : "-",
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    }
    doc.save("Project_Financials.pdf");
  };

  const thead = () => [
    { data: "Project Code" },
    { data: "Project Name" },
    { data: "Branch" },
    { data: "Client Code" },
    { data: "Budget" },
    { data: "Payment Status" },
    { data: "Project Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((item: any) => ({
      id: item.project_code,
      data: [
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{item.project_code}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</span> },
        { data: item.branchcode },
        { data: item.client_code },
        { data: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{item.budget ? `₹${Number(item.budget).toLocaleString()}` : "-"}</span> },
        {
          data: (
            <CrmBadge
              label={item.paystatus || "pending"}
              variant={item.paystatus === "paid" ? "green" : item.paystatus === "partially_paid" ? "amber" : "red"}
            />
          ),
        },
        {
          data: (
            <CrmBadge
              label={item.status || "active"}
              variant={item.status === "active" ? "green" : item.status === "completed" ? "blue" : "gray"}
            />
          ),
        },
        {
          data: (
            <div className="flex justify-center">
              <button
                onClick={() => navigate(`/projectaccount/${encodeURIComponent(item.project_code)}`)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
              >
                View Ledger
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Accounts Overview"
        description="Monitor project financial ledgers, billable milestones, client invoices, and payment requests."
        primaryAction={{
          label: "New Project",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "Export Excel",
            onClick: handleOnExport,
            icon: <FileDown size={14} />,
          },
          {
            label: "Export PDF",
            onClick: handleOnExportPDF,
            icon: <FileDown size={14} />,
          },
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-red-600"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "projectlist" && (
        <div className="space-y-4">
          <FilterBar
            searchQuery={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search project code, title, client..."
            filters={[
              {
                key: "status",
                label: "Project Status",
                options: statusOptions,
                value: selectStatus,
                onChange: (val) => {
                  setSelectStatus(val);
                  setCurrentPage(1);
                },
              },
              {
                key: "paystatus",
                label: "Payment Status",
                options: payStatusOptions,
                value: selectedPayStatus,
                onChange: (val) => {
                  setSelectedPayStatus(val);
                  setCurrentPage(1);
                },
              },
              {
                key: "branchcode",
                label: "Branch",
                options: branchCodeOptions.map((b: any) => ({ label: b.label || b.value, value: b.value })),
                value: selectedBranchCode,
                onChange: (val) => {
                  setSelectedBranchCode(val);
                  setCurrentPage(1);
                },
              },
            ]}
            onClearAll={() => {
              setSearchTerm("");
              setSelectStatus("");
              setSelectedPayStatus("");
              setSelectedBranchCode("");
              setCurrentPage(1);
            }}
          />

          <DataTable
            thead={thead}
            tbody={tbody}
            isLoading={loading}
            noDataText="No project financial records found"
            enableSorting={true}
            onRowDoubleClick={(row: any) =>
              navigate(`/projectaccount/${encodeURIComponent(row.id)}`)
            }
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <CustomPagination
              total={totalItem}
              currentPage={currentPage}
              defaultPageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              paginationLabel="project financial ledgers"
              isScroll={true}
            />
          </div>
        </div>
      )}

      {activeTab === "payrequest" && <InvoiceList />}
      {activeTab === "payrequestlist" && <PayRequestOverallList />}

      <Modal
        isVisible={showCreateModal}
        maxWidth="4xl"
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        closeOnOutsideClick={false}
      >
        <AddNewProject onSuccess={() => { setShowCreateModal(false); getBranch(); }} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal
        isVisible={showEditModal}
        maxWidth="4xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Project Details"
        closeOnOutsideClick={false}
      >
        <EditProjectForm project={selectedBranch} onSuccess={() => { setShowEditModal(false); getBranch(); }} onCancel={() => setShowEditModal(false)} />
      </Modal>
    </div>
  );
};

export default AccountsProject;

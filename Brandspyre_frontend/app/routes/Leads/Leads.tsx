import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, GitBranchPlus, Plus, Eye, SquarePen, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import useLeadsStore from "src/stores/LeadsStore";
import AddNewLeadForm from "./AddNewLead";
import EditLeadForm from "./EditLeadsForm";
import LeadClientForm from "../Clients/LeadClientForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CrmBadge from "src/component/ui/CrmBadge";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import ConfirmDialog from "app/components/ConfirmDialog";

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConvertClientModal, setShowConvertClientModal] = useState(false);
  const [deleteLead, setDeleteLead] = useState<any>();
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [file, setFile] = useState<File | null>(null);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const { fetchLeads } = useLeadsStore();
  const branchCodeOptions = useBranchStore((state) => state.branchCodeOptions);
  const branchcode = useAuthStore((state) => state.branchcode);
  const [hydrated, setHydrated] = useState(false);

  const navigate = useNavigate();
  const token = accesstoken;

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

  useEffect(() => {
    if (hydrated && token) {
      fetchLeads(token, branchcode);
    }
  }, [hydrated, token, branchcode]);

  const getBranch = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    bCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/campaign/leads/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (bCode) url += `&branchcode=${bCode}`;

      const response = await apiClient.get(url);
      setTotalItem(response?.data?.totalDocuments || 0);
      setData(response?.data?.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching lead list", error);
      setError("Failed to fetch lead records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getBranch();
    }
  }, [hydrated, token, currentPage, searchTerm, selectStatus, selectedBranchCode, pageSize]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Lead created successfully!");
    fetchLeads(token, branchcode);
    getBranch();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Lead updated successfully!");
    getBranch();
  };

  const handleConvertSuccess = () => {
    setShowConvertClientModal(false);
    notify.success("Lead converted to client successfully!");
    getBranch();
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleConvertLead = (lead: any) => {
    setSelectedLead(lead);
    setShowConvertClientModal(true);
  };

  const handleDeleteLead = (lead: any) => {
    setShowDeleteModal(true);
    setDeleteLead(lead);
  };

  const handleDeleteSubmit = async () => {
    const id = deleteLead._id || deleteLead.id;
    const payload = {
      data: {
        branchcode: deleteLead.branchcode,
        campaign_code: deleteLead.campaign_code,
      },
    };

    try {
      setLoading(true);
      const response = await apiClient.delete(`/campaign/leads/delete/${id}`, {
        data: payload,
      });

      if (response?.status === 200 || response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Lead deleted successfully!");
        fetchLeads(token, branchcode);
        getBranch();
      }
    } catch (error) {
      console.error("Error deleting Lead", error);
      notify.error("Failed to delete Lead");
    } finally {
      setLoading(false);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        branchcode: "BR001",
        lead_name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        assignee_id: "EMP001",
        comm_type: "Call",
        proj_type: "Residential",
        summary: "Interested in 3BHK",
        status: "active",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lead_Template");
    XLSX.writeFile(workbook, "Lead_Upload_Template.xlsx");
  };

  // Handle Excel Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error("Please select an Excel file to upload");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      await apiClient.post(`/campaign/leads/import`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      notify.success("Leads imported successfully!");
      setFile(null);
      getBranch();
    } catch (err) {
      console.error("Upload error:", err);
      notify.error("Failed to import leads");
    } finally {
      setLoading(false);
    }
  };

  // Export Excel
  const handleOnExport = () => {
    if (!data.length) return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, "Leads_Export.xlsx");
  };

  // Export PDF
  const handleOnExportPDF = () => {
    if (!data.length) return;
    const doc = new jsPDF();
    const tableColumn = ["S.No.", "Branch", "Lead Name", "Phone", "Email", "Status"];
    const tableRows = data.map((item: any, idx) => [
      idx + 1,
      item.branchcode || "",
      item.lead_name || "",
      item.phone || "",
      item.email || "",
      item.status || "active",
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows });
    doc.save("Leads_Report.pdf");
  };

  const thead = () => [
    { data: "S.No." },
    { data: "Branch Code" },
    { data: "Lead Name" },
    { data: "Phone" },
    { data: "Email" },
    { data: "Assignee" },
    { data: "Comm Type" },
    { data: "Project Type" },
    { data: "Summary" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((branch: any, index) => ({
      id: branch._id || branch.id,
      data: [
        { data: (currentPage - 1) * pageSize + index + 1 },
        { data: branch.branchcode },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{branch.lead_name}</span> },
        { data: branch.phone },
        { data: branch.email },
        { data: branch.assignee_id },
        { data: branch.comm_type },
        { data: branch.proj_type },
        { data: branch.summary },
        {
          data: (
            <CrmBadge
              label={branch.status || "active"}
              variant={
                branch.status === "active" || branch.status === "converted" || branch.status === "won"
                  ? "green"
                  : branch.status === "lost"
                  ? "red"
                  : "blue"
              }
            />
          ),
        },
        {
          data: (
            <div className="flex justify-center items-center gap-1.5">
              <button
                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                onClick={() => handleConvertLead(branch)}
                title="Convert Lead to Client"
              >
                <GitBranchPlus size={16} />
              </button>
              <Link to={`/leadsview/${branch._id || branch.id}`}>
                <button
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                  title="View Lead Details"
                >
                  <Eye size={16} />
                </button>
              </Link>
              <button
                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => handleEditLead(branch)}
                title="Edit Lead"
              >
                <SquarePen size={16} />
              </button>
              <button
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                onClick={() => handleDeleteLead(branch)}
                title="Delete Lead"
              >
                <Trash2 size={16} />
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
        title="Lead Management"
        description="Track sales prospects, manage follow-ups, and convert leads into clients."
        primaryAction={{
          label: "New Lead",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "Lead Conversion",
            onClick: () => navigate("/leadscovert"),
            icon: <GitBranchPlus size={14} />,
          },
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

      {/* Filter & Action Tools */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search leads by name, phone, email..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Converted", value: "converted" },
              { label: "Won", value: "won" },
              { label: "Lost", value: "lost" },
            ],
            value: selectStatus,
            onChange: (val) => {
              setSelectStatus(val);
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
          setSelectedBranchCode("");
          setCurrentPage(1);
        }}
      >
        {/* File Import Tools */}
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
            title="Download Bulk Lead Excel Template"
          >
            Template
          </button>

          <label className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition">
            <Upload size={14} />
            <span>{file ? file.name.slice(0, 10) + "..." : "Import Excel"}</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
          </label>

          {file && (
            <button
              onClick={handleUpload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
            >
              Upload
            </button>
          )}
        </div>
      </FilterBar>

      {/* Main Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No leads available"
        enableSorting={true}
        onRowDoubleClick={(row: any) => navigate(`/leadsview/${row.id}`)}
      />

      {/* Pagination */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="leads"
          isScroll={true}
        />
      </div>

      {/* Create Lead Modal */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="4xl"
        onClose={() => setShowCreateModal(false)}
        title="Create New Lead"
        subtitle="Fill in prospect details to register a new sales lead."
        closeOnOutsideClick={false}
      >
        <AddNewLeadForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* Edit Lead Modal */}
      <Modal
        isVisible={showEditModal}
        maxWidth="4xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Lead Information"
        subtitle="Update lead contact details or communication status."
        closeOnOutsideClick={false}
      >
        <EditLeadForm lead={selectedLead} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
      </Modal>

      {/* Convert to Client Modal */}
      <Modal
        isVisible={showConvertClientModal}
        maxWidth="4xl"
        onClose={() => setShowConvertClientModal(false)}
        title="Convert Lead to Active Client"
        subtitle="Promote this lead to an official client profile."
        closeOnOutsideClick={false}
      >
        <LeadClientForm lead={selectedLead} onSuccess={handleConvertSuccess} onCancel={() => setShowConvertClientModal(false)} />
      </Modal>

      {/* Delete Lead Confirm Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Lead Record"
        message="Are you sure you want to permanently delete this lead? This action cannot be undone."
        confirmLabel="Delete Lead"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDeleteSubmit}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default Leads;

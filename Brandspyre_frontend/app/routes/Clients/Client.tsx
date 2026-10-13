import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus, Eye, SquarePen, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import ClientAddForm from "./ClientAddForm";
import ClientEditForm from "./ClientEditForm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import ConfirmDialog from "app/components/ConfirmDialog";
import CrmBadge from "src/component/ui/CrmBadge";

const Client = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [deleteType, setDeleteType] = useState("permanent");
  const [hydrated, setHydrated] = useState(false);
  const [roleAccess, setRoleAccess] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const UserRole = useAuthStore((state) => state.role);
  const { branchCodeOptions } = useBranchStore();
  const navigate = useNavigate();
  const token = accesstoken;

  useEffect(() => {
    if (token) {
      fetchCustomFieldDefs();
    }
  }, [token]);

  const fetchCustomFieldDefs = async () => {
    try {
      const res = await apiClient.get(`/config/entities/CUSTOMER/fields`);
      if (res.data?.success) {
        const customDefs = (res.data.data || []).filter((f: any) => f.is_system === false || f.scope === 'ORGANIZATION');
        setCustomFieldDefs(customDefs);
      }
    } catch (err) {
      console.warn("Could not fetch customer custom field definitions:", err);
    }
  };

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
      fetch(`/get-roleaccessdetail/${UserRole}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.status) setRoleAccess(resData.access);
        })
        .catch(() => {});
    }
  }, [hydrated, token, UserRole]);

  const getClients = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    bCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/client/overview/read?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (bCode) url += `&branchcode=${bCode}`;

      const response = await apiClient.get(url);
      setTotalItem(response?.data?.totalDocuments || 0);
      setData(response?.data?.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching clients", err);
      setError("Failed to load client records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getClients();
    }
  }, [hydrated, token, currentPage, searchTerm, selectStatus, selectedBranchCode, pageSize]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Client added successfully!");
    getClients();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Client updated successfully!");
    getClients();
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleDeleteClient = (client: any) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    const deleteData = {
      data: {
        branchcode: selectedClient.branchcode,
        client_code: selectedClient.client_code,
        status: "inactive",
        delete_type: deleteType,
      },
    };
    try {
      await apiClient.delete(`/client/overview/delete`, {
        data: deleteData,
      });

      setShowDeleteModal(false);
      notify.success("Client deleted successfully!");
      getClients();
    } catch (err: any) {
      console.error("Delete client error:", err);
      notify.error(err.response?.data?.message || "Failed to delete client");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "Client_List.xlsx");
  };

  const handleOnExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Client Directory", 14, 10);
    if (data.length > 0) {
      const tableColumn = ["Client Code", "Client Name", "Company", "Phone", "Email", "Status"];
      const tableRows = data.map((item: any) => [
        item.client_code || "",
        item.client_name || "",
        item.company_name || "",
        item.primary_phone || item.mobile || "",
        item.email || "",
        item.status || "active",
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    }
    doc.save("Client_List.pdf");
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "client_code",
      "branchcode",
      "client_name",
      "company_name",
      "primary_phone",
      "email",
      "office_address",
      "website",
      "status",
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, "ClientTemplate");
    XLSX.writeFile(wb, "Client_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error("Please select an Excel file");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await apiClient.post(`/clientimport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      notify.success("Clients imported successfully!");
      setFile(null);
      getClients();
    } catch (err: any) {
      console.error("Upload error:", err);
      notify.error(err.response?.data?.message || "Failed to import clients");
    } finally {
      setLoading(false);
    }
  };

  const thead = () => [
    { data: "S.No." },
    { data: "Client Code" },
    { data: "Branch Code" },
    { data: "Client Name" },
    { data: "Company Name" },
    { data: "Phone" },
    ...customFieldDefs.map(def => ({ data: def.label })),
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((client: any, index: number) => ({
      id: client._id || client.id,
      data: [
        { data: (currentPage - 1) * pageSize + index + 1 },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{client.client_code}</span> },
        { data: client.branchcode },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{client.client_name}</span> },
        { data: client.company_name || "-" },
        { data: client.primary_phone || client.mobile || "-" },
        ...customFieldDefs.map(def => ({
          data: <span className="font-semibold text-slate-700 dark:text-slate-300">{client.custom_fields?.[def.field_code] || "-"}</span>
        })),
        {
          data: (
            <CrmBadge
              label={client.status || "active"}
              variant={client.status === "active" ? "green" : "gray"}
            />
          ),
        },
        {
          data: (
            <div className="flex justify-center items-center gap-1.5">
              <Link to={`/client_view?id=${client._id || client.id}&code=${client.client_code}`}>
                <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors" title="View Profile">
                  <Eye size={16} />
                </button>
              </Link>
              <button className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={() => handleEditClient(client)} title="Edit Client">
                <SquarePen size={16} />
              </button>
              <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors" onClick={() => handleDeleteClient(client)} title="Delete Client">
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
        title="Client Management"
        description="Directory of accounts, corporate clients, contact representatives, and project contracts."
        primaryAction={
          roleAccess?.client?.create !== false
            ? {
                label: "Add Client",
                onClick: () => setShowCreateModal(true),
                icon: <Plus size={16} />,
              }
            : undefined
        }
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

      {/* Filter & Import Controls */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search clients by name, company, code, phone..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
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
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
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
        noDataText="No clients registered"
        enableSorting={true}
        onRowDoubleClick={(row: any) =>
          navigate(`/client_view?id=${row.id}`)
        }
      />

      {/* Pagination */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="clients"
          isScroll={true}
        />
      </div>

      {/* Create Client Modal */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="4xl"
        onClose={() => setShowCreateModal(false)}
        title="Add New Client"
        subtitle="Register a new corporate or individual client account."
        closeOnOutsideClick={false}
      >
        <ClientAddForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isVisible={showEditModal}
        maxWidth="4xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Client Details"
        subtitle="Update client contact, designation, or branch details."
        closeOnOutsideClick={false}
      >
        <ClientEditForm client={selectedClient} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
      </Modal>

      {/* Delete Client Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        title="Delete Client Account"
        message="Are you sure you want to delete this client record? This action cannot be undone."
        confirmLabel="Delete Client"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDeleteSubmit}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default Client;

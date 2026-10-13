import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus, Eye, SquarePen, Trash2, Upload, ArrowUpDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import AddNewCampaignForm from "./AddNewCampaignForm";
import EditCampaignForm from "./EditCampaignForm";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const Campaign = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<any>();
  const [sortOrder, setSortOrder] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const navigate = useNavigate();

  const {
    branches,
    managerOptions,
    branchCodeOptions,
    fetchBranches,
  } = useBranchStore();

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
      fetchBranches(token);
    }
  }, [hydrated, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error("Please select an Excel file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await apiClient.post(`/campaign/overview/excelimport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 200 || res.status === 201) {
        notify.success("Campaign Excel imported successfully!");
        setFile(null);
        getCampaign();
      }
    } catch (error: any) {
      console.error("Excel import error", error);
      notify.error(error.response?.data?.message || "Failed to import Excel");
    } finally {
      setLoading(false);
    }
  };

  const getCampaign = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    branch = selectedBranchCode,
    manager = selectedManager,
    sort = sortOrder
  ) => {
    setLoading(true);
    try {
      let url = `/campaign/overview/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (branch) url += `&branchcode=${branch}`;
      if (manager) url += `&manager=${manager}`;
      if (sort) url += `&sort=${sort}`;

      const response = await apiClient.get(url);

      setData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);
      setSheetData(response?.data?.data || []);
    } catch (err) {
      console.error("Error fetching campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getCampaign(currentPage, pageSize, searchTerm, selectStatus, selectedBranchCode, selectedManager, sortOrder);
    }
  }, [hydrated, token, currentPage, pageSize, searchTerm, selectStatus, selectedBranchCode, selectedManager, sortOrder]);

  const handleEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (branch: any) => {
    setDeleteData({
      id: branch.id,
      campaign_code: branch.campaign_code,
    });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    try {
      setLoading(true);
      const response = await apiClient.delete(`/campaign/overview/delete`, {
        data: deleteData,
      });
      if (response?.status === 201 || response?.status === 200) {
        setShowDeleteModal(false);
        notify.success("Campaign deleted successfully!");
        getCampaign();
      }
    } catch (error) {
      console.error("Error deleting campaign", error);
      notify.error("Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Campaigns");
    XLSX.writeFile(wb, "CampaignList.xlsx");
  };

  const thead = () => [
    { data: "Campaign Name" },
    { data: "Campaign Code" },
    { data: "Branch Code" },
    { data: "Type" },
    { data: "Timeline" },
    { data: "Leads" },
    { data: "Goal Leads" },
    { data: "Conversion Rate" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((item: any) => {
      const isCompleted = item.status === "completed" || item.status === "active";
      return {
        id: item.id || item.campaign_code,
        data: [
          {
            data: (
              <div>
                <Link
                  to={`/campaignview/${encodeURIComponent(item.campaign_code)}`}
                  className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition"
                >
                  {item.campaignname}
                </Link>
                <p className="text-xs text-slate-500">Manager: {item.managername || item.branchcode || "—"}</p>
              </div>
            ),
          },
          { data: <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{item.campaign_code}</span> },
          { data: <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{item.branchcode}</span> },
          { data: <CrmBadge label={item.campaigntype || "Outreach"} variant="purple" /> },
          {
            data: (
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                {item.startdate ? new Date(item.startdate).toLocaleDateString() : "—"} to{" "}
                {item.enddate ? new Date(item.enddate).toLocaleDateString() : "—"}
              </span>
            ),
          },
          { data: <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{item.leads?.length ?? 0}</span> },
          { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{item.goallead || 0}</span> },
          { data: <span className="font-mono text-xs font-bold text-emerald-600">{item.conversationrate || "0%"}</span> },
          { data: <CrmBadge label={item.status || "active"} variant={isCompleted ? "green" : "gray"} /> },
          {
            data: (
              <div className="flex justify-center gap-1.5">
                <Link to={`/campaignview/${encodeURIComponent(item.campaign_code)}`}>
                  <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition" title="View Campaign Details">
                    <Eye size={16} />
                  </button>
                </Link>
                <button onClick={() => handleEditBranch(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition" title="Edit Campaign">
                  <SquarePen size={16} />
                </button>
                <button onClick={() => handleDeleteBranch(item)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition" title="Delete Campaign">
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ],
      };
    });
  };

  if (!hydrated) {
    return <div className="p-8 text-center text-slate-400">Loading campaign manager...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing & Campaign Operations"
        description="Track digital ad performance, lead capture goals, budget conversion rates, and branch outreach campaigns."
        primaryAction={{
          label: "New Campaign",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          { label: "Export Excel", onClick: handleOnExport, icon: <FileDown size={14} /> },
        ]}
      />

      {/* Excel Batch Imports */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
            <Upload size={14} /> Choose Excel File
          </label>
          {file && <span className="text-xs font-mono font-semibold text-emerald-600 truncate max-w-[200px]">{file.name}</span>}
          {file && (
            <button onClick={handleUpload} disabled={loading} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs">
              {loading ? "Uploading..." : "Upload File"}
            </button>
          )}
        </div>

        <a href="/sample_campaigns.xlsx" download className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
          <FileDown size={14} /> Download Sample Template
        </a>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search campaign name or code..."
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
          {
            key: "manager",
            label: "Manager",
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
          setSelectedBranchCode("");
          setSelectedManager("");
          setSelectStatus("");
          setCurrentPage(1);
        }}
      />

      {/* Data Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No active marketing campaigns match your search filters"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="campaigns"
          isScroll={true}
        />
      </div>

      {/* Create Modal */}
      <Modal isVisible={showCreateModal} maxWidth="2xl" onClose={() => setShowCreateModal(false)} title="Create New Marketing Campaign" closeOnOutsideClick={false}>
        <AddNewCampaignForm
          onSuccess={() => {
            setShowCreateModal(false);
            notify.success("Campaign created successfully!");
            getCampaign();
          }}
          onClose={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isVisible={showEditModal} maxWidth="2xl" onClose={() => setShowEditModal(false)} title="Edit Campaign Details" closeOnOutsideClick={false}>
        {selectedBranch && (
          <EditCampaignForm
            campaign={selectedBranch}
            onSuccess={() => {
              setShowEditModal(false);
              notify.success("Campaign updated successfully!");
              getCampaign();
            }}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isVisible={showDeleteModal} maxWidth="sm" onClose={() => setShowDeleteModal(false)} title="Delete Campaign Confirmation">
        <div className="space-y-4 p-2 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete campaign <strong className="font-mono text-slate-900 dark:text-slate-100">{deleteData?.campaign_code}</strong>?
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button onClick={confirmDelete} disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs">{loading ? "Deleting..." : "Delete Campaign"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Campaign;

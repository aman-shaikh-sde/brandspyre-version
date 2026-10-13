import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus, MessageSquareText, Eye, SquarePen, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import CreateBranchForm from "./CreateBranchForm";
import { notify } from "~/services/notificationService";
import EditBranchForm from "./EditFormData";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import BranchMeetingForm from "./Meeting/BranchMeetingForm";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const BranchList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const token = accesstoken;

  const { managerOptions, branchCodeOptions, fetchBranches, isLoading: isStoreLoading } = useBranchStore();

  const statusOptions = [
    { value: "active", label: "Active Branches" },
    { value: "inactive", label: "Inactive Branches" },
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

  useEffect(() => {
    if (hydrated && token) {
      fetchBranches(token);
    }
  }, [hydrated, token]);

  const getBranch = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    manager = selectedManager,
    branchCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/branch/read?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (manager) url += `&manager_id=${manager}`;
      if (branchCode) url += `&branchcode=${branchCode}`;

      const response = await apiClient.get(url);
      setSheetData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);
      setData(response?.data?.data || response?.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching branches", err);
      setError("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getBranch();
    }
  }, [hydrated, token, currentPage, searchTerm, selectStatus, selectedManager, selectedBranchCode, pageSize]);

  const handleEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await apiClient.delete(`/branch/delete/${deleteId}`);
      notify.success("Branch deleted successfully!");
      setShowDeleteModal(false);
      getBranch();
    } catch (err) {
      console.error("Error deleting branch", err);
      notify.error("Failed to delete branch");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Branch created successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Branch updated successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Branches");
    XLSX.writeFile(wb, "BranchList.xlsx");
  };

  const thead = () => [
    { data: "Branch Code" },
    { data: "Branch Name" },
    { data: "Manager" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((branch: any) => ({
      id: branch.branchcode || branch.id,
      data: [
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{branch.branchcode}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{branch.branchname || branch.name}</span> },
        { data: branch.manager_name || branch.manager_id || "-" },
        {
          data: (
            <CrmBadge
              label={branch.status || "active"}
              variant={branch.status === "active" ? "green" : "gray"}
            />
          ),
        },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <Link to={`/branch/${encodeURIComponent(branch.branchcode)}`} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition" title="View Detail">
                <Eye size={16} />
              </Link>
              <button onClick={() => handleEditBranch(branch)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition" title="Edit Branch">
                <SquarePen size={16} />
              </button>
              <button onClick={() => handleDeleteBranch(branch.id || branch.branchcode)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition" title="Delete Branch">
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
        title="Branch Management"
        description="Manage organization branch locations, assigned branch managers, and office details."
        primaryAction={{
          label: "New Branch",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "New Meeting",
            onClick: () => setShowMeetingModal(true),
            icon: <MessageSquareText size={14} />,
          },
          {
            label: "Export Excel",
            onClick: handleOnExport,
            icon: <FileDown size={14} />,
          },
        ]}
      />

      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search branch code or name..."
        filters={[
          {
            key: "status",
            label: "Branch Status",
            options: statusOptions,
            value: selectStatus,
            onChange: (val) => {
              setSelectStatus(val);
              setCurrentPage(1);
            },
          },
          {
            key: "branchcode",
            label: "Branch Code",
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
          setSelectedManager("");
          setCurrentPage(1);
        }}
      />

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No branch locations found"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="branches"
          isScroll={true}
        />
      </div>

      <Modal isVisible={showCreateModal} maxWidth="4xl" onClose={() => setShowCreateModal(false)} title="Create New Branch" closeOnOutsideClick={false}>
        <CreateBranchForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal isVisible={showEditModal} maxWidth="4xl" onClose={() => setShowEditModal(false)} title="Edit Branch Details" closeOnOutsideClick={false}>
        <EditBranchForm branch={selectedBranch} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
      </Modal>

      <Modal isVisible={showMeetingModal} maxWidth="4xl" onClose={() => setShowMeetingModal(false)} title="Create Branch Meeting" closeOnOutsideClick={false}>
        <BranchMeetingForm branch={selectedBranch} onSuccess={() => { setShowMeetingModal(false); notify.success("Meeting created successfully!"); }} onCancel={() => setShowMeetingModal(false)} />
      </Modal>

      <Modal isVisible={showDeleteModal} maxWidth="lg" onClose={() => setShowDeleteModal(false)} title="Confirm Branch Deletion" closeOnOutsideClick={false}>
        <div className="space-y-4 p-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this branch? This action will archive or permanently remove the branch record.</p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Cancel</button>
            <button onClick={handleDeleteSubmit} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs transition">{loading ? "Deleting..." : "Confirm Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BranchList;

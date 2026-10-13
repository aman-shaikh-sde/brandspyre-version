import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import {
  FileDown,
  Plus,
  MessageSquareText,
  ArrowLeft,
  Building2,
  Award,
  SquarePen,
  MapPin,
  Phone,
  UserCheck,
  Briefcase
} from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import EditBranchForm from "./EditFormData";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import BranchMeetingForm from "./Meeting/BranchMeetingForm";
import CreateBranchRole from "./CreateBranchRole";
import CreateBranchDepartment from "./CreateBranchDepartment";
import CreateBranchDesignation from "./CreateBranchDesignation";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const BranchViewPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatedepModal, setShowCreatedepModal] = useState(false);
  const [showCreatedesModal, setShowCreatedesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const token = useAuthStore((state) => state.accessToken);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    managerOptions,
    fetchBranches,
  } = useBranchStore();

  const statusOptions = [
    { value: "active", label: "Active Branches" },
    { value: "inactive", label: "Inactive Branches" },
  ];

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  // wait for Zustand persist to hydrate
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
    manager = selectedManager
  ) => {
    setLoading(true);
    try {
      let url = `/branch/read?branchcode=${encodeURIComponent(id || "")}&page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (manager) url += `&manager_id=${manager}`;

      const response = await apiClient.get(url);

      const responseData = response?.data?.data || response?.data || [];
      setSheetData(Array.isArray(responseData) ? responseData : [responseData]);
      setTotalItem(response?.data?.totalDocuments || (Array.isArray(responseData) ? responseData.length : 1));
      setData(Array.isArray(responseData) ? responseData : [responseData]);
      setError(null);
    } catch (err) {
      console.error("Error fetching branch details", err);
      setError("Failed to fetch branch details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getBranch();
    }
  }, [hydrated, token, currentPage, searchTerm, selectStatus, selectedManager, pageSize, id]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Role created successfully!");
    if (token) fetchBranches(token);
    getBranch();
  };

  const handleCreatedepSuccess = () => {
    setShowCreatedepModal(false);
    notify.success("Department created successfully!");
    if (token) fetchBranches(token);
    getBranch();
  };

  const handleCreatedesSuccess = () => {
    setShowCreatedesModal(false);
    notify.success("Designation created successfully!");
    if (token) fetchBranches(token);
    getBranch();
  };

  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Branch meeting created successfully!");
  };

  const handleEditBranch = (branch: any) => {
    setSelectedBranch(branch);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Branch updated successfully!");
    if (token) fetchBranches(token);
    getBranch();
  };

  const handleDeleteBranch = (targetId: string) => {
    setDeleteId(targetId);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      await apiClient.delete(`/branch/delete/${deleteId}`);

      setShowDeleteModal(false);
      notify.success("Branch status updated successfully!");
      if (token) fetchBranches(token);
      getBranch();
    } catch (err) {
      console.error("Error updating branch status", err);
      notify.error("Failed to update branch status");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "BranchDetails");
    XLSX.writeFile(wb, `Branch_${id || "details"}.xlsx`);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const primaryBranch = data && data.length > 0 ? data[0] : null;

  const thead = () => [
    { data: "#", className: "w-12 text-center" },
    { data: "Branch Code" },
    { data: "Branch Name" },
    { data: "Location" },
    { data: "Mobile" },
    { data: "Manager" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((branch: any, index: number) => ({
      id: branch._id || branch.id || index,
      data: [
        { data: <span className="text-slate-400 font-mono text-xs text-center block">{(currentPage - 1) * pageSize + index + 1}</span> },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{branch.branchcode}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{branch.name || branch.branchname}</span> },
        { data: <span className="text-slate-600 dark:text-slate-400 capitalize">{branch.location || "-"}</span> },
        { data: <span className="text-slate-600 dark:text-slate-400">{branch.mobile || "-"}</span> },
        { data: <span className="text-slate-600 dark:text-slate-400">{branch.managername || branch.manager_name || "-"}</span> },
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
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleEditBranch(branch)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                title="Edit Branch"
              >
                <SquarePen size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBranch(branch._id || branch.id || branch.branchcode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  branch.status === "active" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
                title={branch.status === "active" ? "Deactivate branch" : "Activate branch"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    branch.status === "active" ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ),
          className: "action-cell text-center",
        },
      ],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Unified CRM Page Header */}
      <PageHeader
        title={`Branch Details: ${id || "Overview"}`}
        description="Manage branch details, operational settings, roles, departments, and designations."
        breadcrumbs={[
          { label: "Administration", path: "/branch" },
          { label: "Branches", path: "/branch" },
          { label: id || "Branch Detail" }
        ]}
        primaryAction={{
          label: "New Role",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "New Department",
            onClick: () => setShowCreatedepModal(true),
            icon: <Building2 size={14} />,
          },
          {
            label: "New Designation",
            onClick: () => setShowCreatedesModal(true),
            icon: <Award size={14} />,
          },
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
          {
            label: "Go Back",
            onClick: handleGoBack,
            icon: <ArrowLeft size={14} />,
          }
        ]}
      />

      {/* KPI / Branch Quick Info Cards */}
      {primaryBranch && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Branch Name</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize truncate">
                  {primaryBranch.name || primaryBranch.branchname || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Location</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize truncate">
                  {primaryBranch.location || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Phone size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Contact Mobile</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {primaryBranch.mobile || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <UserCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</p>
                <div className="mt-0.5">
                  <CrmBadge
                    label={primaryBranch.status || "active"}
                    variant={primaryBranch.status === "active" ? "green" : "gray"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search branch details..."
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
            key: "manager",
            label: "Branch Manager",
            options: (managerOptions || []).map((m: any) => ({ label: m.label || m.value, value: m.value })),
            value: selectedManager,
            onChange: (val) => {
              setSelectedManager(val);
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectStatus("");
          setSelectedManager("");
          setCurrentPage(1);
        }}
      >
        <div className="min-w-[130px]">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      {/* Clean Modern Data Table */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No branch details found"
        enableSorting={true}
      />

      {/* Pagination Footer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page: number) => setCurrentPage(page)}
          paginationLabel="branches"
          isScroll={true}
        />
      </div>

      {/* Modal: Create Role */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="4xl"
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        closeOnOutsideClick={false}
      >
        <CreateBranchRole
          branch={data}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal: Create Designation */}
      <Modal
        isVisible={showCreatedesModal}
        maxWidth="4xl"
        onClose={() => setShowCreatedesModal(false)}
        title="Create New Designation"
        closeOnOutsideClick={false}
      >
        <CreateBranchDesignation
          branch={data}
          onSuccess={handleCreatedesSuccess}
          onCancel={() => setShowCreatedesModal(false)}
        />
      </Modal>

      {/* Modal: Create Department */}
      <Modal
        isVisible={showCreatedepModal}
        maxWidth="4xl"
        onClose={() => setShowCreatedepModal(false)}
        title="Create New Department"
        closeOnOutsideClick={false}
      >
        <CreateBranchDepartment
          branch={data}
          onSuccess={handleCreatedepSuccess}
          onCancel={() => setShowCreatedepModal(false)}
        />
      </Modal>

      {/* Modal: Edit Branch */}
      <Modal
        isVisible={showEditModal}
        maxWidth="4xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Branch"
        closeOnOutsideClick={false}
      >
        <EditBranchForm
          branch={selectedBranch}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Modal: Branch Meeting */}
      <Modal
        isVisible={showMeetingModal}
        maxWidth="4xl"
        onClose={() => setShowMeetingModal(false)}
        title="Create Branch Meeting"
        closeOnOutsideClick={false}
      >
        <BranchMeetingForm
          branch={selectedBranch || primaryBranch}
          onSuccess={handleMeetingSuccess}
          onCancel={() => setShowMeetingModal(false)}
        />
      </Modal>

      {/* Modal: Inactivate Branch Confirmation */}
      <Modal
        isVisible={showDeleteModal}
        maxWidth="lg"
        onClose={() => setShowDeleteModal(false)}
        title="Inactivate Branch"
        closeOnOutsideClick={false}
      >
        <div className="flex flex-col gap-5 p-2">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to inactivate this branch? Active employees and branch roles may be impacted.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="crm-btn-secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="crm-btn-danger"
              onClick={handleDeleteSubmit}
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Confirm Inactivate"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BranchViewPage;

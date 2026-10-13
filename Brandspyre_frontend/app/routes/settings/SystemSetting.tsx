import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus, SquarePen, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import CreateSoftwareForm from "./systemSetting/CreateSoftwareForm";
import EditSoftwareForm from "./systemSetting/EditSoftwareForm";
import Language from "./language/Language";
import LeaveTy from "./leave/LeaveTy";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const SystemSetting = () => {
  const [activeTab, setActiveTab] = useState("software");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetData, setSheetData] = useState([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const token = useAuthStore((state) => state.accessToken);
  const { branchCodeOptions, fetchBranches } = useBranchStore();

  const tabs = [
    { id: "software", label: "Software Management" },
    { id: "languages", label: "Languages" },
    { id: "leaves", label: "Leave Types" },
  ];

  useEffect(() => {
    fetchBranches(token);
  }, [token]);

  const getSoftware = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    branchCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/master/software/read?branchcode=${branchCode}&page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await apiClient.get(url);
      setSheetData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);
      setData(response?.data?.data || response?.data || []);
    } catch (error) {
      console.error("Error fetching software list", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getSoftware();
    }
  }, [token, currentPage, searchTerm, selectedBranchCode, pageSize]);

  const handleEditSoftware = (software: any) => {
    setSelectedBranch(software);
    setShowEditModal(true);
  };

  const handleDeleteSoftware = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await apiClient.delete(`/master/software/delete/${deleteId}`);
      notify.success("Software entry deleted successfully!");
      setShowDeleteModal(false);
      getSoftware();
    } catch (err) {
      console.error("Error deleting software", err);
      notify.error("Failed to delete software");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Software entry created successfully!");
    getSoftware();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Software entry updated successfully!");
    getSoftware();
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Software");
    XLSX.writeFile(wb, "SoftWareList.xlsx");
  };

  const thead = () => [
    { data: "#" },
    { data: "Branch Code" },
    { data: "Software Name" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((software: any, index: number) => ({
      id: software.id || software._id || index,
      data: [
        { data: index + 1 },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{software.branchcode}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{software.softwarename}</span> },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => handleEditSoftware(software)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                title="Edit Software"
              >
                <SquarePen size={16} />
              </button>
              <button
                onClick={() => handleDeleteSoftware(software.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title="Delete Software"
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
        title="System Settings & Master Configurations"
        description="Configure software catalogs, system languages, and leave policy types across branches."
        primaryAction={
          activeTab === "software"
            ? {
                label: "New Software",
                onClick: () => setShowCreateModal(true),
                icon: <Plus size={16} />,
              }
            : undefined
        }
        secondaryActions={
          activeTab === "software"
            ? [
                {
                  label: "Export Excel",
                  onClick: handleOnExport,
                  icon: <FileDown size={14} />,
                },
              ]
            : []
        }
      />

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-red-700 dark:text-red-400 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-red-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "software" && (
        <div className="space-y-4">
          <FilterBar
            searchQuery={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search software name..."
            filters={[
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
              setSelectedBranchCode("");
              setCurrentPage(1);
            }}
          />

          <DataTable
            thead={thead}
            tbody={tbody}
            isLoading={loading}
            noDataText="No software records configured for this branch"
            enableSorting={true}
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <CustomPagination
              total={totalItem}
              currentPage={currentPage}
              defaultPageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              paginationLabel="software records"
              isScroll={true}
            />
          </div>
        </div>
      )}

      {activeTab === "languages" && <Language />}
      {activeTab === "leaves" && <LeaveTy />}

      <Modal isVisible={showCreateModal} maxWidth="4xl" onClose={() => setShowCreateModal(false)} title="Add New Software Catalog Entry" closeOnOutsideClick={false}>
        <CreateSoftwareForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal isVisible={showEditModal} maxWidth="4xl" onClose={() => setShowEditModal(false)} title="Edit Software Entry" closeOnOutsideClick={false}>
        <EditSoftwareForm branch={selectedBranch} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
      </Modal>

      <Modal isVisible={showDeleteModal} maxWidth="lg" onClose={() => setShowDeleteModal(false)} title="Confirm Software Deletion" closeOnOutsideClick={false}>
        <div className="space-y-4 p-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to remove this software item from the catalog?</p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition">Cancel</button>
            <button onClick={handleDeleteSubmit} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs transition">{loading ? "Deleting..." : "Confirm Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemSetting;

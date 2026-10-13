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
import CreateLeaveForm from "./CreateLeaveForm";
import EditLeaveForm from "./EditLeaveForm";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const LeaveTy = () => {
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
      let url = `/master/leavetypes/read?branchcode=${branchCode}&page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await apiClient.get(url);
      setSheetData(response?.data?.data || []);
      setTotalItem(response?.data?.data?.totalDocuments || response?.data?.data?.length || 0);
      setData(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching leave types", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      getSoftware();
    }
  }, [token, currentPage, searchTerm, selectedBranchCode, pageSize]);

  const handleEditLeave = (item: any) => {
    setSelectedBranch(item);
    setShowEditModal(true);
  };

  const handleDeleteLeave = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await apiClient.delete(`/master/leavetypes/delete/${deleteId}`);
      notify.success("Leave type deleted successfully!");
      setShowDeleteModal(false);
      getSoftware();
    } catch (err) {
      console.error("Error deleting leave type", err);
      notify.error("Failed to delete leave type");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Leave type created successfully!");
    getSoftware();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Leave type updated successfully!");
    getSoftware();
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "LeaveTypes");
    XLSX.writeFile(wb, "LeaveTypeList.xlsx");
  };

  const thead = () => [
    { data: "#" },
    { data: "Branch Code" },
    { data: "Leave Type" },
    { data: "Total Days" },
    { data: "Year" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((item: any, index: number) => ({
      id: item.id || item._id || index,
      data: [
        { data: index + 1 },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{item.branchcode}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{item.leavetype}</span> },
        { data: <CrmBadge label={`${item.totaldays || 0} Days`} variant="blue" /> },
        { data: item.year || new Date().getFullYear() },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => handleEditLeave(item)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                title="Edit Leave Type"
              >
                <SquarePen size={16} />
              </button>
              <button
                onClick={() => handleDeleteLeave(item.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title="Delete Leave Type"
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
    <div className="space-y-4">
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search leave type..."
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
        noDataText="No leave types configured for this branch"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="leave types"
          isScroll={true}
        />
      </div>

      <Modal isVisible={showCreateModal} maxWidth="4xl" onClose={() => setShowCreateModal(false)} title="Create New Leave Type Policy" closeOnOutsideClick={false}>
        <CreateLeaveForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal isVisible={showEditModal} maxWidth="4xl" onClose={() => setShowEditModal(false)} title="Edit Leave Type Policy" closeOnOutsideClick={false}>
        <EditLeaveForm branch={selectedBranch} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
      </Modal>

      <Modal isVisible={showDeleteModal} maxWidth="lg" onClose={() => setShowDeleteModal(false)} title="Confirm Leave Type Deletion" closeOnOutsideClick={false}>
        <div className="space-y-4 p-2">
          <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this leave type policy?</p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button onClick={handleDeleteSubmit} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white">{loading ? "Deleting..." : "Confirm Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeaveTy;

import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus, Eye, SquarePen, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import EditSalaryForm from "./EditSalaryForm";
import CreateSalaryForm from "./AddSalary";

const SalaryList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<any>();
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(20);

  const token = useAuthStore((state) => state.accessToken);
  const {
    branchCodeOptions,
    fetchBranches,
  } = useBranchStore();

  useEffect(() => {
    if (token) {
      fetchBranches(token);
    }
  }, [token]);

  const getSalary = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    branchCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/users/salary/read?page=${page}&limit=${limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (branchCode) url += `&branchcode=${branchCode}`;

      const response = await apiClient.get(url);

      setSheetData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || 0);
      setData(response?.data?.data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching salary records", err);
      setError("Failed to fetch salary records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSalary();
  }, [currentPage, searchTerm, selectStatus, selectedBranchCode, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEditSalary = (salary: any) => {
    setSelectedSalary(salary);
    setShowEditModal(true);
  };

  const handleDeleteSalary = (salary: any) => {
    setShowDeleteModal(true);
    setDeleteId(salary);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteId) return;
    const id = Number(deleteId.id);
    const deleteData = {
      userData: {
        staff_id: deleteId.staff_id,
      },
    };

    try {
      setLoading(true);
      const response = await apiClient.delete(
        `/users/salary/delete/${id}`,
        {
          data: deleteData,
        }
      );

      if (response?.status === 200 || response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Salary record deleted successfully!");
        getSalary();
      }
    } catch (err: any) {
      console.error("Error deleting salary", err);
      notify.error(err?.response?.data?.error || "Failed to delete salary record");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData.length ? sheetData : data);
    XLSX.utils.book_append_sheet(wb, ws, "Salaries");
    XLSX.writeFile(wb, "SalaryList.xlsx");
  };

  const thead = () => [
    { data: "ID" },
    { data: "Staff ID" },
    { data: "Basic Salary" },
    { data: "HRA" },
    { data: "LPA" },
    { data: "Deductions" },
    { data: "Gross Salary" },
    { data: "Net Salary" },
    { data: "Bonus" },
    { data: "Processed Date" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data || data.length === 0) return [];

    return data.map((salary: any, index: number) => ({
      id: salary.id || index,
      data: [
        { data: <span className="font-mono text-xs text-slate-500">#{salary.id || index + 1}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{salary.staff_id || "-"}</span> },
        { data: <span className="font-mono text-xs">{salary.basicsalary ? `₹${Number(salary.basicsalary).toLocaleString()}` : "-"}</span> },
        { data: <span className="font-mono text-xs">{salary.hra ? `₹${Number(salary.hra).toLocaleString()}` : "-"}</span> },
        { data: <span className="font-mono text-xs font-semibold">{salary.lpa ? `₹${Number(salary.lpa).toLocaleString()}` : "-"}</span> },
        { data: <span className="font-mono text-xs text-red-600">{salary.deductions ? `₹${Number(salary.deductions).toLocaleString()}` : "-"}</span> },
        { data: <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{salary.gross_salary ? `₹${Number(salary.gross_salary).toLocaleString()}` : "-"}</span> },
        { data: <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{salary.net_salary ? `₹${Number(salary.net_salary).toLocaleString()}` : "-"}</span> },
        { data: <span className="font-mono text-xs">{salary.bonus ? `₹${Number(salary.bonus).toLocaleString()}` : "-"}</span> },
        { data: <span className="text-xs text-slate-500">{salary.processondate ? new Date(salary.processondate).toLocaleDateString() : "-"}</span> },
        {
          data: (
            <CrmBadge
              label={salary.status ? salary.status.toUpperCase() : "ACTIVE"}
              variant={salary.status?.toLowerCase() === "active" ? "green" : "red"}
            />
          ),
        },
        {
          data: (
            <div className="flex items-center justify-center gap-1.5">
              <Link to={`/employee/salary_slip/${salary.id}`}>
                <button
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition"
                  title="View Salary Slip"
                >
                  <Eye size={14} />
                </button>
              </Link>
              <button
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                onClick={() => handleEditSalary(salary)}
                title="Edit Salary"
              >
                <SquarePen size={14} />
              </button>
              <button
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-600 transition"
                onClick={() => handleDeleteSalary(salary)}
                title="Delete Salary"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ),
          className: "action-cell",
        },
      ],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Salary & Compensation Registry</h3>
          <p className="text-xs text-slate-500">Manage employee payroll structures, monthly salary setups, and compensations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOnExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-2xs transition"
          >
            <FileDown size={14} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs transition"
          >
            <Plus size={14} />
            <span>New Salary</span>
          </button>
        </div>
      </div>

      {/* Clean FilterBar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search staff ID, salary, status..."
        filters={[
          {
            key: "branchcode",
            label: "Branch",
            options: (Array.isArray(branchCodeOptions) ? branchCodeOptions : [])
              .map((b: any) => ({
                label: (typeof b === "object" ? b?.label || b?.value : b) || "",
                value: (typeof b === "object" ? b?.value : b) || "",
              }))
              .filter((opt: any) => Boolean(opt.value)),
            value: selectedBranchCode,
            onChange: (val) => {
              setSelectedBranchCode(val);
              setCurrentPage(1);
            },
          },
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
            key: "pageSize",
            label: "Items Per Page",
            options: [
              { label: "10 per page", value: "10" },
              { label: "20 per page", value: "20" },
              { label: "50 per page", value: "50" },
              { label: "100 per page", value: "100" },
            ],
            value: String(pageSize),
            onChange: (val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectStatus("");
          setSelectedBranchCode("");
          setPageSize(20);
          setCurrentPage(1);
        }}
      />

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Modern DataTable */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No salary records found"
        enableSorting={true}
        enableFilters={false}
      />

      {/* Card Pagination */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={handlePageChange}
          paginationLabel="salary records"
          isScroll={true}
        />
      </div>

      {/* Create Salary Modal */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="3xl"
        onClose={() => setShowCreateModal(false)}
        title="Create New Salary Record"
        closeOnOutsideClick={false}
      >
        <CreateSalaryForm
          onSuccess={() => {
            setShowCreateModal(false);
            notify.success("Salary added successfully!");
            getSalary();
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Salary Modal */}
      <Modal
        isVisible={showEditModal}
        maxWidth="3xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Salary Record"
      >
        <EditSalaryForm
          salary={selectedSalary}
          onSuccess={() => {
            setShowEditModal(false);
            notify.success("Salary updated successfully!");
            getSalary();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isVisible={showDeleteModal}
        maxWidth="sm"
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Salary Deletion"
      >
        <div className="space-y-4 p-2">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete the salary record for staff member{" "}
            <strong>"{deleteId?.staff_id}"</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs transition"
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalaryList;

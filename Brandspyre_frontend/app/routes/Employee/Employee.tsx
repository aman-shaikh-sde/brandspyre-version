import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import {
  FileDown,
  Plus,
  Eye,
  SquarePen,
  Trash2,
  Upload,
  PlusSquare,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import EmployeeForm from "./AddEmployeeForm";
import EmployeeSalary from "./Salary/Salary";
import Documents from "./Documents/Documts";
import OfferLettersGenerative from "./offerletters/OfferLettersGenerative";
import Termination from "./termination/Termination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import ConfirmDialog from "app/components/ConfirmDialog";

const Employee = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectStatus, setSelectStatus] = useState("");
  const [data, setData] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStaffId, setDeleteStaffId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [activeTab, setActiveTab] = useState("employee");
  const [file, setFile] = useState<File | null>(null);
  const [inActiveData, setInActiveData] = useState({ type: "", status: "" });
  const [createdStaffId, setCreatedStaffId] = useState<string | null>(null);
  const [showPostCreateModal, setShowPostCreateModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const accesstoken = useAuthStore((state) => state.accessToken);
  const roleOptions = useEmployeeStore((state) => state.roleOptions);
  const branchCodeOptions = useBranchStore((state) => state.branchCodeOptions);
  const branchcode = useAuthStore((state) => state.branchcode);
  const token = accesstoken;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const getEmployee = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    role = selectedRole,
    bCode = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/users/read?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (role) url += `&role=${role}`;
      if (bCode) url += `&branchcode=${bCode}`;

      const response = await apiClient.get(url);
      const rawData = response?.data;
      const empList: any[] = Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData?.result)
        ? rawData.result
        : Array.isArray(rawData)
        ? rawData
        : [];
      const total = rawData?.totalDocuments ?? rawData?.total ?? empList.length;

      setSheetData(empList);
      setTotalItem(total);
      setData(empList as any);
      setError(null);
    } catch (err) {
      console.error("Error fetching employees", err);
      setError("Failed to fetch employee list");
      setData([]);
      setSheetData([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch branch & role options for filter dropdowns on mount
  useEffect(() => {
    if (hydrated && token) {
      try {
        useBranchStore.getState().fetchBranches?.(token);
        useEmployeeStore.getState().fetchEmployee?.(token);
      } catch (e) {
        console.warn("[Employee] Error pre-fetching filter stores:", e);
      }
    }
  }, [hydrated, token]);

  // Auto-open create modal when coming from Dashboard shortcut (/employee?create=true)
  useEffect(() => {
    if (hydrated && searchParams.get("create") === "true") {
      setShowCreateModal(true);
      navigate("/employee", { replace: true });
    }
  }, [hydrated, searchParams]);

  useEffect(() => {
    if (hydrated && token) {
      getEmployee();
    }
  }, [hydrated, token, currentPage, searchTerm, selectStatus, selectedRole, selectedBranchCode, pageSize]);

  const handleCreateSuccess = (newStaffId?: string) => {
    setShowCreateModal(false);
    notify.success("Employee created successfully!");
    getEmployee();
    if (newStaffId) {
      setCreatedStaffId(newStaffId);
      setShowPostCreateModal(true);
    }
  };

  const handleDeleteEmployee = (staff_id: string) => {
    setDeleteStaffId(staff_id);
    setShowDeleteModal(true);
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    const deleteData = {
      data: {
        staff_id: deleteStaffId,
        type: inActiveData.type,
        status: inActiveData.status,
      },
    };
    try {
      const response = await apiClient.delete(`/users/delete`, {
        data: deleteData,
      });
      if (response?.status === 200) {
        setShowDeleteModal(false);
        notify.success("Employee status updated successfully!");
        getEmployee();
        setInActiveData({ type: "", status: "" });
      }
    } catch (err) {
      console.error("Error deleting employee", err);
      notify.error("Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_Directory.xlsx");
  };

  const handleOnExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Employee Roster Summary", 14, 10);
    if (sheetData.length > 0) {
      const tableColumn = ["Staff ID", "First Name", "Last Name", "Role", "Email", "Status"];
      const tableRows = sheetData.map((item: any) => [
        item.staff_id || "",
        item.firstname || "",
        item.lastname || "",
        item.role || "",
        item.email || "",
        item.status || "active",
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    }
    doc.save("Employee_List.pdf");
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "staff_id",
      "firstname",
      "lastname",
      "branchcode",
      "role",
      "department",
      "designation",
      "email",
      "phonenumber",
      "status",
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, "EmployeeTemplate");
    XLSX.writeFile(wb, "Employee_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error("Please select an Excel file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await apiClient.post(`/staffimport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      notify.success("Employee list imported successfully!");
      setFile(null);
      getEmployee();
    } catch (err: any) {
      console.error("Upload error:", err);
      notify.error(err.response?.data?.message || "Failed to import employee list");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "employee", label: "Employee Roster" },
    { id: "salary", label: "Salary & Payroll" },
    { id: "termination", label: "Separation & Exit" },
    { id: "interview", label: "Offer Letters" },
  ];

  const thead = () => [
    { data: "Staff ID" },
    { data: "First Name" },
    { data: "Last Name" },
    { data: "Branch Code" },
    { data: "Role" },
    { data: "Email" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!Array.isArray(data)) return [];
    return data
      .filter(Boolean)
      .map((employee: any) => ({
        id: employee.staff_id || employee._id || "",
        data: [
          { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{employee.staff_id || "—"}</span> },
          { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{employee.firstname || "—"}</span> },
          { data: employee.lastname || "—" },
          { data: employee.branchcode || "—" },
          { data: <span className="capitalize">{employee.role || "—"}</span> },
          { data: employee.email || "—" },
          {
            data: (
              <CrmBadge
                label={employee.status || "active"}
                variant={employee.status === "active" ? "green" : employee.status === "relive" ? "amber" : "red"}
              />
            ),
          },
          {
            data: (
              <div className="flex justify-center items-center gap-1.5">
                <button
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                  title="View Profile"
                  onClick={() => navigate(`/employee_profile/${encodeURIComponent(employee.staff_id || "")}`)}
                >
                  <Eye size={16} />
                </button>
                <button
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Add Details"
                  onClick={() => navigate(`/employee/addpage/${encodeURIComponent(employee.staff_id || "")}`)}
                >
                  <PlusSquare size={16} />
                </button>
                <button
                  className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit Details"
                  onClick={() => navigate(`/employee/editpage/${encodeURIComponent(employee.staff_id || "")}`)}
                >
                  <SquarePen size={16} />
                </button>
                <button
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Deactivate / Delete"
                  onClick={() => handleDeleteEmployee(employee.staff_id || "")}
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
        title="Human Resources & People"
        description="Employee directory, salary setup, offer letter generation, and separation management."
        primaryAction={
          activeTab === "employee"
            ? {
                label: "Add New Employee",
                onClick: () => setShowCreateModal(true),
                icon: <Plus size={16} />,
              }
            : undefined
        }
        secondaryActions={
          activeTab === "employee"
            ? [
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
              ]
            : undefined
        }
      />

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-t-2 border-x border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-slate-100 font-bold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "employee" && (
        <div className="space-y-4">
          <FilterBar
            searchQuery={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Search staff ID, name, role, email..."
            filters={[
              {
                key: "status",
                label: "Status",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Relived", value: "relive" },
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
                key: "role",
                label: "Role",
                options: (Array.isArray(roleOptions) ? roleOptions : [])
                  .map((r: any) => ({
                    label: (typeof r === "object" ? r?.label || r?.value : r) || "",
                    value: (typeof r === "object" ? r?.value : r) || "",
                  }))
                  .filter((opt: any) => Boolean(opt.value)),
                value: selectedRole,
                onChange: (val) => {
                  setSelectedRole(val);
                  setCurrentPage(1);
                },
              },
            ]}
            onClearAll={() => {
              setSearchTerm("");
              setSelectStatus("");
              setSelectedBranchCode("");
              setSelectedRole("");
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

          <DataTable
            thead={thead}
            tbody={tbody}
            isLoading={loading}
            noDataText="No employees found"
            enableSorting={true}
            onRowDoubleClick={(row: any) =>
              navigate(`/employee_profile/${encodeURIComponent(row.id)}`)
            }
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
            <CustomPagination
              total={totalItem}
              currentPage={currentPage}
              defaultPageSize={pageSize}
              onChange={(page) => setCurrentPage(page)}
              paginationLabel="employees"
              isScroll={true}
            />
          </div>
        </div>
      )}

      {activeTab === "salary" && <EmployeeSalary />}
      {activeTab === "termination" && <Termination />}
      {activeTab === "interview" && <OfferLettersGenerative />}

      {/* Create Employee Modal */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="4xl"
        onClose={() => setShowCreateModal(false)}
        title="Add New Employee"
        subtitle="Register employee profile, contact information, and job parameters."
        closeOnOutsideClick={false}
      >
        <EmployeeForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* Post-Creation Action Modal */}
      <Modal
        isVisible={showPostCreateModal}
        maxWidth="md"
        onClose={() => setShowPostCreateModal(false)}
        title="Employee Created Successfully"
        subtitle={`Staff ID: ${createdStaffId || ""}`}
        closeOnOutsideClick={false}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Employee account <strong className="text-slate-900 dark:text-slate-100">{createdStaffId}</strong> has been registered in the system.
            Would you like to add secondary details (education, employment history, references, and emergency contacts) now?
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowPostCreateModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Done / Return to Roster
            </button>
            <button
              onClick={() => {
                setShowPostCreateModal(false);
                if (createdStaffId) {
                  navigate(`/employee/addpage/${encodeURIComponent(createdStaffId)}`);
                }
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition"
            >
              Add Employee Details
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete/Deactivate Dialog */}
      <Modal
        isVisible={showDeleteModal}
        maxWidth="md"
        onClose={() => setShowDeleteModal(false)}
        title="Update Staff Access / Deactivate"
        closeOnOutsideClick={false}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Deactivate access or relieve employee <strong className="text-slate-800 dark:text-slate-200">{deleteStaffId}</strong>.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Deactivation Type</label>
              <select
                value={inActiveData.type}
                onChange={(e) => setInActiveData({ ...inActiveData, type: e.target.value })}
                className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="">Select Type</option>
                <option value="temp">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Status</label>
              <select
                value={inActiveData.status}
                onChange={(e) => setInActiveData({ ...inActiveData, status: e.target.value })}
                className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="inactive">Inactive</option>
                <option value="relive">Relived</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSubmit}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Update"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employee;

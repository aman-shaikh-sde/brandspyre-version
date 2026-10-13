import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Calendar as CalendarIcon,
  Tag,
  ClipboardType,
  Network,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import AddNewProject from "./AddNewProject";
import EditProjectForm from "./ProjectDocuments/EditProjectForm";
import useProjectStore from "src/stores/ProjectStore";
import ProjectMeetingForm from "./Meeting/ProjectMeetingForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const Project = () => {
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
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<any>(null);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedFilterType, setSelectedFilterType] = useState("");
  const [selectedPayStatus, setSelectedPayStatus] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [inActiveData, setInActiveData] = useState({ delete_type: "", status: "" });
  const [hydrated, setHydrated] = useState(false);
  const [roleAccess, setRoleAccess] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  const token = useAuthStore((state) => state.accessToken);
  const UserRole = useAuthStore((state) => state.role);
  const UserId = useAuthStore((state) => state.userId);
  const branchcode = useAuthStore((state) => state.branchcode);

  const { fetchProject } = useProjectStore();
  const { branchCodeOptions, fetchBranches } = useBranchStore();
  const navigate = useNavigate();

  const priorityOptions = [
    { value: "minor", label: "Minor Projects" },
    { value: "major", label: "Major Project" },
    { value: "critical", label: "Critical Project" },
    { value: "blocker", label: "Blocker Project" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "draft", label: "Draft" },
    { value: "planning", label: "Planning" },
    { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" },
    { value: "revised", label: "Revised" },
    { value: "client_review", label: "Client Review" },
    { value: "drop", label: "Dropped" },
  ];

  const filterTypeOptions = [
    { value: "create_by", label: "Created By Me" },
    { value: "participated", label: "Participated Projects" },
  ];

  const payStatusOptions = [
    { value: "advance_paid", label: "Advance Paid" },
    { value: "milestone_started", label: "Activities Initiated" },
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
      fetch(`/get-roleaccessdetail/${UserRole}`)
        .then((res) => res.json())
        .then((resData) => {
          if (resData.status) setRoleAccess(resData.access);
        })
        .catch(() => {});
    }
  }, [hydrated, token, UserRole]);

  useEffect(() => {
    if (!branchcode || !token) return;
    const fetchTeams = async () => {
      try {
        const url = branchcode ? `/team/read?branchcode=${encodeURIComponent(branchcode)}` : `/team/read`;
        const response = await apiClient.get(url);
        if (response?.data?.status || response?.data?.data) {
          setTeams(response.data.data || []);
        }
      } catch (error) {
        // Silently default to empty teams list if unavailable
        setTeams([]);
      }
    };
    fetchTeams();
  }, [branchcode, token]);

  useEffect(() => {
    if (hydrated && token) {
      fetchProject(token, branchcode);
    }
  }, [hydrated, token]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
  };

  const getBranch = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    status = selectStatus,
    priority = selectedPriority,
    bCode = selectedBranchCode,
    filterStartDate = startDate,
    filterEndDate = endDate,
    filterType = selectedFilterType,
    payStatus = selectedPayStatus,
    canCreate = roleAccess?.project?.create,
    staff_id = UserId,
    team_id = selectedTeam
  ) => {
    setLoading(true);
    try {
      let url = `/project/overview/read?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status) url += `&status=${status}`;
      if (priority) url += `&priority=${priority}`;
      if (bCode) url += `&branchcode=${encodeURIComponent(bCode)}`;
      if (filterStartDate) url += `&start_date=${formatDate(filterStartDate)}`;
      if (filterEndDate) url += `&end_date=${formatDate(filterEndDate)}`;
      if (filterType) url += `&filter_type=${filterType}`;
      if (payStatus) url += `&paystatus=${payStatus}`;
      if (canCreate !== undefined) url += `&create=${canCreate}`;
      if (staff_id !== undefined) url += `&staff_id=${staff_id}`;
      if (team_id) url += `&team_id=${team_id}`;

      const response = await apiClient.get(url);

      const today = new Date();
      const transformed = (response?.data?.data || []).map((project: any) => {
        const endD = new Date(project.end_date);
        const updatedOn = project.updated_on ? new Date(project.updated_on) : null;
        let rawStatus = project.status ? project.status.toLowerCase() : "";
        let statusStr = rawStatus;

        if (rawStatus !== "completed") {
          if (today > endD) statusStr = "Overdue";
        } else {
          if (updatedOn && updatedOn > endD) statusStr = "Completed with Delay";
          else statusStr = "Completed";
        }
        return { ...project, derived_status: statusStr };
      });

      setSheetData(transformed);
      setTotalItem(response?.data?.totalDocuments || 0);
      setData(transformed);
      setError(null);
    } catch (err) {
      console.error("Error fetching project list", err);
      setError("Failed to fetch project records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getBranch();
    }
  }, [
    hydrated,
    token,
    currentPage,
    searchTerm,
    selectStatus,
    selectedPriority,
    selectedBranchCode,
    selectedTeam,
    pageSize,
    startDate,
    endDate,
    selectedFilterType,
    selectedPayStatus,
  ]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Project added successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Project updated successfully!");
    fetchBranches(token);
    getBranch();
  };

  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Meeting and Document Created successfully!");
  };

  const handleEditBranch = (project: any) => {
    setSelectedBranch(project);
    setShowEditModal(true);
  };

  const handleDeleteBranch = (project: any) => {
    setShowDeleteModal(true);
    setDeleteData(project);
  };

  const handleDeleteSubmit = async () => {
    const deletedPayload = {
      data: {
        branchcode: deleteData.branchcode,
        project_code: deleteData.project_code,
        delete_type: inActiveData.delete_type,
        status: inActiveData.status,
      },
    };
    try {
      setLoading(true);
      const response = await apiClient.delete(`/project/overview/delete`, {
        data: deletedPayload,
      });
      if (response?.status === 200 || response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Project Deleted Successfully!");
        getBranch();
        setInActiveData({ delete_type: "", status: "" });
      }
    } catch (err) {
      console.error("Error deleting project", err);
      notify.error("Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "ProjectList.xlsx");
  };

  const handleOnExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Project Directory Summary", 14, 10);
    if (sheetData.length > 0) {
      const tableColumn = ["Project Code", "Title", "Priority", "Status", "Budget", "Start Date", "End Date"];
      const tableRows = sheetData.map((item: any) => [
        item.project_code || "",
        item.title || "",
        item.priority || "",
        item.derived_status || item.status || "",
        item.budget || "",
        item.start_date ? formatDate(item.start_date) : "",
        item.end_date ? formatDate(item.end_date) : "",
      ]);
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    }
    doc.save("ProjectList.pdf");
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "project_code",
      "branchcode",
      "title",
      "priority",
      "type",
      "budget",
      "start_date",
      "end_date",
      "status",
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, "ProjectTemplate");
    XLSX.writeFile(wb, "ProjectTemplate.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      notify.error("Please select a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      await apiClient.post(`/projectimport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      notify.success("Projects imported successfully!");
      setFile(null);
      getBranch();
    } catch (err: any) {
      console.error("Upload failed:", err);
      notify.error(err.response?.data?.message || "Failed to import projects");
    } finally {
      setLoading(false);
    }
  };

  const teamOptions = teams.map((team: any) => ({
    value: team.team_id,
    label: team.team_name,
  }));

  const thead = () => [
    { data: "S.No." },
    { data: "Branch Code" },
    { data: "Project Code" },
    { data: "Project Name" },
    { data: "Client Code" },
    { data: "Type" },
    { data: "Budget" },
    { data: "Duration (Days)" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((project: any, index: number) => {
      const viewUrl = `/project/${encodeURIComponent(project.project_code)}`;
      const statusVariant =
        project.derived_status === "Overdue"
          ? "amber"
          : project.derived_status === "Completed with Delay" || project.derived_status === "Completed" || project.status === "active"
          ? "green"
          : "gray";

      return {
        id: project.id || project._id,
        data: [
          { data: (currentPage - 1) * pageSize + index + 1 },
          { data: project.branchcode },
          { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{project.project_code}</span> },
          { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{project.title}</span> },
          { data: project.client_code },
          { data: project.type || "-" },
          { data: project.budget ? `₹${Number(project.budget).toLocaleString()}` : "-" },
          { data: project.duration_days || "-" },
          {
            data: <CrmBadge label={project.derived_status || project.status} variant={statusVariant} />,
          },
          {
            data: (
              <div className="flex justify-center items-center gap-1.5">
                <Link to={viewUrl}>
                  <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors" title="View Overview">
                    <Eye size={16} />
                  </button>
                </Link>
                {roleAccess?.project?.edit !== false && (
                  <button className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={() => handleEditBranch(project)} title="Edit Project">
                    <SquarePen size={16} />
                  </button>
                )}
                {roleAccess?.project?.delete !== false && (
                  <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors" onClick={() => handleDeleteBranch(project)} title="Delete Project">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ),
          },
        ],
      };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        description="Monitor project lifecycles, milestone progression, budget allocations, and execution status."
        primaryAction={
          roleAccess?.project?.create !== false
            ? {
                label: "New Project",
                onClick: () => setShowCreateModal(true),
                icon: <Plus size={16} />,
              }
            : undefined
        }
        secondaryActions={[
          {
            label: "Cumulative View",
            onClick: () => navigate("/cumulative"),
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

      {/* Filters Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search projects by title, code, branch..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions,
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
          {
            key: "priority",
            label: "Priority",
            options: priorityOptions,
            value: selectedPriority,
            onChange: (val) => {
              setSelectedPriority(val);
              setCurrentPage(1);
            },
          },
          {
            key: "team",
            label: "Team",
            options: teamOptions,
            value: selectedTeam,
            onChange: (val) => {
              setSelectedTeam(val);
              setCurrentPage(1);
            },
          },
          {
            key: "filterType",
            label: "Ownership",
            options: filterTypeOptions,
            value: selectedFilterType,
            onChange: (val) => {
              setSelectedFilterType(val);
              setCurrentPage(1);
            },
          },
          {
            key: "payStatus",
            label: "Payment Stage",
            options: payStatusOptions,
            value: selectedPayStatus,
            onChange: (val) => {
              setSelectedPayStatus(val);
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectStatus("");
          setSelectedBranchCode("");
          setSelectedPriority("");
          setSelectedTeam("");
          setSelectedFilterType("");
          setSelectedPayStatus("");
          setStartDate(null);
          setEndDate(null);
          setCurrentPage(1);
        }}
      >
        {/* Date Pickers */}
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              setCurrentPage(1);
            }}
            placeholderText="Start Date"
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 w-[110px]"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => {
              setEndDate(date);
              setCurrentPage(1);
            }}
            placeholderText="End Date"
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 w-[110px]"
          />
        </div>

        {/* File Tools */}
        {(UserRole === "superadmin" || UserRole === "admin" || UserRole === "hr") && (
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
        )}
      </FilterBar>

      {/* Table Component */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No projects found"
        enableSorting={true}
        onRowDoubleClick={(row: any) => {
          const matched = data.find((p) => (p.id || p._id) === row.id);
          if (matched) navigate(`/project/${encodeURIComponent(matched.project_code)}`);
        }}
      />

      {/* Pagination */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="projects"
          isScroll={true}
        />
      </div>

      {/* Create Project Modal */}
      <Modal
        isVisible={showCreateModal}
        maxWidth="4xl"
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        subtitle="Specify project parameters, client association, and duration."
        closeOnOutsideClick={false}
      >
        <AddNewProject onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isVisible={showEditModal}
        maxWidth="4xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Project Details"
        subtitle="Update project schedule, budget, or assignee settings."
        closeOnOutsideClick={false}
      >
        <EditProjectForm project={selectedBranch} onSuccess={handleEditSuccess} onCancel={() => setShowEditModal(false)} />
      </Modal>

      {/* Meeting Modal */}
      <Modal
        isVisible={showMeetingModal}
        maxWidth="4xl"
        onClose={() => setShowMeetingModal(false)}
        title="Schedule Project Meeting"
        closeOnOutsideClick={false}
      >
        <ProjectMeetingForm project={selectedBranch} onSuccess={handleMeetingSuccess} onCancel={() => setShowMeetingModal(false)} />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isVisible={showDeleteModal}
        maxWidth="md"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
        subtitle="Configure status or deletion options."
        closeOnOutsideClick={false}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Are you sure you want to delete project <strong className="text-slate-800 dark:text-slate-200">{deleteData?.title}</strong>?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Delete Type</label>
              <select
                value={inActiveData.delete_type}
                onChange={(e) => setInActiveData({ ...inActiveData, delete_type: e.target.value })}
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
                <option value="draft">Draft</option>
                <option value="planning">Planning</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="drop">Dropped</option>
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
              {loading ? "Processing..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Project;
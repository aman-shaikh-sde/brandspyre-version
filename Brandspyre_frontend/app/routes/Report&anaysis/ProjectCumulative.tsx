import React, { useEffect, useState } from "react";
import { FileDown, FileText, ChevronDown, ChevronRight, Search, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import { TableSkeleton } from "src/component/ui/SkeletonLoader";
import EmptyState from "src/component/ui/EmptyState";

// ---------- Utility Functions ----------
const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString() : "-";

const formatHoursToHHMM = (hours: number | undefined | null) => {
  if (!hours || isNaN(Number(hours))) return "00:00:00";
  const totalSeconds = Math.round(Number(hours) * 3600);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

// ---------- Interfaces ----------
interface Subtask {
  participants_id: number;
  subtask_title: string;
  task_duration: number;
  is_delayed: boolean;
  is_completed?: boolean;
  first_check_in?: string;
  last_check_out?: string;
  start_date: string | null;
  end_date: string | null;
  firstname: string;
  lastname: string;
  status: string;
  total_hours_worked: number;
}

interface Participant {
  staff_id: string;
  firstname: string;
  lastname: string;
}

interface Task {
  task_id: number;
  task_title: string;
  task_status: string;
  participants: Participant[];
  subtasks?: Subtask[];
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number;
  duration?: number;
  total_hours_worked?: number;
}

interface Milestone {
  milestone_code: string;
  miles_title: string;
  milestone_status: string;
  total_amount: string;
  handler_by: string;
  tasks: Task[];
  start_date?: string | null;
  end_date?: string | null;
}

interface Project {
  project_code: string;
  title: string;
  status: string;
  budget: string;
  revised_cost: string;
  overallcost: number;
  handler_by: string;
  start_date?: string | null;
  end_date?: string | null;
  milestones: Milestone[];
}

const statusOptions = [
  { value: "", label: "All Project Statuses" },
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
];

const CumulativeReport = () => {
  const token = useAuthStore((state) => state.accessToken);

  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let url = `/cumulative?search=${encodeURIComponent(searchTerm)}`;
      if (selectedStatus) url += `&status=${encodeURIComponent(selectedStatus)}`;
      if (startDate) url += `&start_date=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&end_date=${encodeURIComponent(endDate)}`;

      const res = await apiClient.get(url);
      setData(res.data.data || []);
    } catch (err) {
      console.error("Cumulative report fetch error:", err);
      notify.error("Failed to load cumulative report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token]);

  const toggleProject = (code: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleMilestone = (code: string) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleTask = (id: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportExcelFull = () => {
    const wb = XLSX.utils.book_new();
    const ws_data: any[][] = [];

    ws_data.push([
      "Project",
      "Milestone",
      "Task",
      "Subtask",
      "Status",
      "Handler/Assigned",
      "Start Date",
      "End Date",
      "Budget/Amount",
      "Revised/Duration",
      "Hours Worked",
      "Delayed",
      "Level",
    ]);

    data.forEach((p) => {
      ws_data.push([
        p.title,
        "",
        "",
        "",
        p.status,
        p.handler_by,
        formatDate(p.start_date || null),
        formatDate(p.end_date || null),
        p.budget,
        p.revised_cost,
        "",
        "",
        "Project",
      ]);

      p.milestones.forEach((m) => {
        ws_data.push([
          "",
          m.miles_title,
          "",
          "",
          m.milestone_status,
          m.handler_by,
          formatDate(m.start_date || null),
          formatDate(m.end_date || null),
          m.total_amount,
          "",
          "",
          "",
          "Milestone",
        ]);

        m.tasks.forEach((t) => {
          ws_data.push([
            "",
            "",
            t.task_title,
            "",
            t.task_status,
            t.participants.map((pt) => pt.firstname).join(", "),
            formatDate(t.start_date || null),
            formatDate(t.end_date || null),
            "",
            t.duration || t.duration_days || "",
            "",
            "",
            "Task",
          ]);

          t.subtasks?.forEach((s) => {
            ws_data.push([
              "",
              "",
              "",
              s.subtask_title,
              s.status,
              `${s.firstname} ${s.lastname}`,
              formatDate(s.start_date),
              formatDate(s.end_date),
              "",
              s.task_duration,
              formatHoursToHHMM(s.total_hours_worked),
              s.is_delayed ? "Yes" : "No",
              "Subtask",
            ]);
          });
        });
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "CumulativeReport");
    XLSX.writeFile(wb, "CumulativeReport.xlsx");
  };

  const handleExportPDFFull = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const body: any[] = [];

    data.forEach((p) => {
      body.push([p.title, "", "", p.status, p.handler_by, formatDate(p.start_date || null), formatDate(p.end_date || null), p.budget]);
      p.milestones.forEach((m) => {
        body.push(["", m.miles_title, "", m.milestone_status, m.handler_by, formatDate(m.start_date || null), formatDate(m.end_date || null), m.total_amount]);
      });
    });

    autoTable(doc, {
      head: [["Project", "Milestone", "Task", "Status", "Handler", "Start", "End", "Budget"]],
      body,
      startY: 20,
    });
    doc.save("CumulativeReport.pdf");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Cumulative Report"
        description="Hierarchical breakdown of Projects, Milestones, Tasks, and Subtask execution metrics."
        secondaryActions={[
          {
            label: "Export Excel",
            onClick: handleExportExcelFull,
            icon: <FileDown size={14} />,
          },
          {
            label: "Export PDF",
            onClick: handleExportPDFFull,
            icon: <FileText size={14} />,
          },
        ]}
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        searchPlaceholder="Search project, milestone or task titles..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: statusOptions.slice(1),
            value: selectedStatus,
            onChange: (val) => setSelectedStatus(val),
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectedStatus("");
          setStartDate("");
          setEndDate("");
          fetchReport();
        }}
      >
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          />
          <button
            onClick={fetchReport}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs transition"
          >
            Apply Filters
          </button>
        </div>
      </FilterBar>

      {/* Table Content */}
      <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider select-none">
              <th className="px-4 py-3">Level / Type</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Budget / Amount</th>
              <th className="px-4 py-3">Revised / Duration</th>
              <th className="px-4 py-3">Handler / Assigned</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <TableSkeleton rows={5} cols={8} />
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((project) => (
                <React.Fragment key={project.project_code}>
                  {/* Project Level Row */}
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium border-b border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3 cursor-pointer text-red-700 dark:text-red-400 font-bold" onClick={() => toggleProject(project.project_code)}>
                      <div className="flex items-center gap-1.5">
                        {expandedProjects.has(project.project_code) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>Project</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{project.title}</td>
                    <td className="px-4 py-3 font-mono">{project.budget ? `₹${Number(project.budget).toLocaleString()}` : "-"}</td>
                    <td className="px-4 py-3 font-mono">{project.revised_cost ? `₹${Number(project.revised_cost).toLocaleString()}` : "-"}</td>
                    <td className="px-4 py-3">{project.handler_by || "-"}</td>
                    <td className="px-4 py-3">{formatDate(project.start_date || null)}</td>
                    <td className="px-4 py-3">{formatDate(project.end_date || null)}</td>
                    <td className="px-4 py-3">
                      <CrmBadge label={project.status || "active"} variant={project.status === "active" ? "green" : "gray"} />
                    </td>
                  </tr>

                  {/* Milestones Nested Table */}
                  {expandedProjects.has(project.project_code) && (
                    <tr>
                      <td colSpan={8} className="p-0 bg-slate-50/40 dark:bg-slate-900/40">
                        <div className="p-3 pl-8">
                          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                            <thead className="bg-blue-50 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-blue-950 dark:text-blue-300 font-semibold">
                              <tr>
                                <th className="px-3 py-2">Milestone</th>
                                <th className="px-3 py-2">Title</th>
                                <th className="px-3 py-2">Amount</th>
                                <th className="px-3 py-2">Handler</th>
                                <th className="px-3 py-2">Start</th>
                                <th className="px-3 py-2">End</th>
                                <th className="px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {project.milestones.map((ms) => (
                                <React.Fragment key={ms.milestone_code}>
                                  <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
                                    <td className="px-3 py-2 cursor-pointer font-semibold text-blue-700 dark:text-blue-400" onClick={() => toggleMilestone(ms.milestone_code)}>
                                      <div className="flex items-center gap-1">
                                        {expandedMilestones.has(ms.milestone_code) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span>Milestone</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{ms.miles_title}</td>
                                    <td className="px-3 py-2 font-mono">{ms.total_amount ? `₹${Number(ms.total_amount).toLocaleString()}` : "-"}</td>
                                    <td className="px-3 py-2">{ms.handler_by || "-"}</td>
                                    <td className="px-3 py-2">{formatDate(ms.start_date || null)}</td>
                                    <td className="px-3 py-2">{formatDate(ms.end_date || null)}</td>
                                    <td className="px-3 py-2">
                                      <CrmBadge label={ms.milestone_status || "pending"} variant="blue" />
                                    </td>
                                  </tr>

                                  {/* Tasks Nested Table */}
                                  {expandedMilestones.has(ms.milestone_code) && (
                                    <tr>
                                      <td colSpan={7} className="p-0">
                                        <div className="p-2 pl-8">
                                          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                                            <thead className="bg-amber-50 dark:bg-amber-950/40 border-b border-slate-200 dark:border-slate-800 text-amber-950 dark:text-amber-300 font-semibold">
                                              <tr>
                                                <th className="px-3 py-2">Task</th>
                                                <th className="px-3 py-2">Title</th>
                                                <th className="px-3 py-2">Participants</th>
                                                <th className="px-3 py-2">Start / End</th>
                                                <th className="px-3 py-2">Duration</th>
                                                <th className="px-3 py-2">Hours Worked</th>
                                                <th className="px-3 py-2">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                              {ms.tasks.map((t) => (
                                                <React.Fragment key={t.task_id}>
                                                  <tr className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                                                    <td className="px-3 py-2 cursor-pointer font-semibold text-amber-700 dark:text-amber-400" onClick={() => toggleTask(t.task_id)}>
                                                      <div className="flex items-center gap-1">
                                                        {expandedTasks.has(t.task_id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                                        <span>Task</span>
                                                      </div>
                                                    </td>
                                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{t.task_title}</td>
                                                    <td className="px-3 py-2">{t.participants.map((p) => `${p.firstname} ${p.lastname}`).join(", ") || "-"}</td>
                                                    <td className="px-3 py-2">{formatDate(t.start_date || null)} - {formatDate(t.end_date || null)}</td>
                                                    <td className="px-3 py-2">{t.duration_days ?? t.duration ?? "-"} Days</td>
                                                    <td className="px-3 py-2 font-mono">{formatHoursToHHMM(t.total_hours_worked)}</td>
                                                    <td className="px-3 py-2">
                                                      <CrmBadge label={t.task_status || "pending"} variant="amber" />
                                                    </td>
                                                  </tr>

                                                  {/* Subtasks Nested */}
                                                  {expandedTasks.has(t.task_id) && (
                                                    <tr>
                                                      <td colSpan={7} className="p-0">
                                                        <div className="p-2 pl-8">
                                                          <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                                                            <thead className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-slate-200 dark:border-slate-800 text-emerald-950 dark:text-emerald-300 font-semibold">
                                                              <tr>
                                                                <th className="px-3 py-2">Subtask Title</th>
                                                                <th className="px-3 py-2">Assigned Staff</th>
                                                                <th className="px-3 py-2">Hours Worked</th>
                                                                <th className="px-3 py-2">Check In / Out</th>
                                                                <th className="px-3 py-2">Status</th>
                                                                <th className="px-3 py-2">Delayed</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                              {t.subtasks && t.subtasks.length > 0 ? (
                                                                t.subtasks.map((s) => (
                                                                  <tr key={s.participants_id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10">
                                                                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{s.subtask_title}</td>
                                                                    <td className="px-3 py-2">{s.firstname} {s.lastname}</td>
                                                                    <td className="px-3 py-2 font-mono">{formatHoursToHHMM(s.total_hours_worked)}</td>
                                                                    <td className="px-3 py-2">{s.first_check_in || "-"} / {s.last_check_out || "-"}</td>
                                                                    <td className="px-3 py-2">
                                                                      <CrmBadge label={s.is_completed ? "completed" : "in progress"} variant={s.is_completed ? "green" : "blue"} />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                      <CrmBadge label={s.is_delayed ? "Yes" : "No"} variant={s.is_delayed ? "red" : "gray"} />
                                                                    </td>
                                                                  </tr>
                                                                ))
                                                              ) : (
                                                                <tr>
                                                                  <td colSpan={6} className="px-3 py-2 text-center text-slate-400 italic">No subtasks assigned</td>
                                                                </tr>
                                                              )}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </React.Fragment>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-6">
                  <EmptyState title="No cumulative report records found" description="Adjust your status or date filters to display project data." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CumulativeReport;

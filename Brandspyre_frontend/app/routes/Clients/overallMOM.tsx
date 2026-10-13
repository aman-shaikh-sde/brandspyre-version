import { useEffect, useState } from "react";
import { Eye, Pencil, FileDown, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import { useNavigate } from "react-router-dom";
import Modal from "src/component/Modal";
import BranchMeetingForm from "../Branch/Meeting/BranchMeetingForm";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";

interface MeetingData {
  id: string;
  title: string;
  name: string;
  organized_by: string;
  status: string;
  lastdate: string;
}

const OverallMOM = () => {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState("");

  const token = useAuthStore((state) => state.accessToken);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
  const staff_id = useAuthStore((state) => state.staff_id);
  const navigate = useNavigate();

  const UserRole = (Array.isArray(permission) && permission.length > 0 ? permission[0]?.role : null) || userStoreRole || "staff";

  const fetchMeetings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/doc_meet/read?comm_type=meeting`);

      const apiData = res.data.data || [];
      let filteredData = apiData;

      if (UserRole !== "superadmin" && UserRole !== "master_super_admin") {
        filteredData = apiData.filter(
          (item: any) =>
            item.createdby === staff_id ||
            item.participants?.some((p: any) => p.person_id === staff_id)
        );
      }

      const transformed: MeetingData[] = filteredData.map((item: any) => ({
        id: `ASC_${item.meet_id}`,
        title: item.title || "No Title",
        name: item.notes || "-",
        organized_by: item.organizer_firstname || "-",
        status: item.status || "scheduled",
        lastdate: item.start_date_time
          ? new Date(item.start_date_time).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "-",
      }));

      setMeetings(transformed);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [token, UserRole, staff_id]);

  const handleView = (id: string) => {
    const numericId = id.replace("ASC_", "");
    navigate(`/meeting_view/${numericId}`);
  };

  const handleEdit = (id: string) => {
    const numericIds = id.replace("ASC_", "");
    navigate(`/meetings/${numericIds}`);
  };

  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Meeting and MOM created successfully!");
    fetchMeetings();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Minutes of Meetings (MOM) List", 14, 15);
    const tableColumn = ["ID", "Title", "Organized By", "Status", "Meeting Date"];
    const tableRows = meetings.map((m) => [m.id, m.title, m.organized_by, m.status, m.lastdate]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("MOM_Meeting_List.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(meetings);
    XLSX.utils.book_append_sheet(wb, ws, "MOM_Meetings");
    XLSX.writeFile(wb, "MOM_Meeting_List.xlsx");
  };

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.organized_by.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus ? m.status.toLowerCase() === selectedStatus.toLowerCase() : true;
    return matchesSearch && matchesStatus;
  });

  const thead = () => [
    { data: "Meeting ID" },
    { data: "Meeting Title" },
    { data: "Organized By" },
    { data: "Status" },
    { data: "Meeting Date" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    const startIdx = (currentPage - 1) * pageSize;
    const paginated = filteredMeetings.slice(startIdx, startIdx + pageSize);
    return paginated.map((m) => ({
      id: m.id,
      data: [
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{m.id}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{m.title}</span> },
        { data: m.organized_by },
        {
          data: (
            <CrmBadge
              label={m.status}
              variant={m.status === "completed" ? "green" : m.status === "scheduled" ? "blue" : "amber"}
            />
          ),
        },
        { data: m.lastdate },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <button
                onClick={() => handleView(m.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                title="View MOM Detail"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => handleEdit(m.id)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                title="Edit Meeting"
              >
                <Pencil size={16} />
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
        title="Events & Minutes of Meetings (MOM)"
        description="Directory of organizational client meetings, discussion notes, and action items."
        primaryAction={{
          label: "New Meeting",
          onClick: () => setShowMeetingModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          {
            label: "Export Excel",
            onClick: exportExcel,
            icon: <FileDown size={14} />,
          },
          {
            label: "Export PDF",
            onClick: exportPDF,
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
        searchPlaceholder="Search meeting ID, title, or organizer..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Scheduled", value: "scheduled" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
            value: selectedStatus,
            onChange: (val) => {
              setSelectedStatus(val);
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectedStatus("");
          setStartDate("");
          setEndDate("");
          setCurrentPage(1);
        }}
      />

      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No meeting minutes or event records found"
        enableSorting={true}
        onRowDoubleClick={(row: any) => handleView(row.id)}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={filteredMeetings.length}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="meetings"
          isScroll={true}
        />
      </div>

      <Modal
        isVisible={showMeetingModal}
        maxWidth="4xl"
        onClose={() => setShowMeetingModal(false)}
        title="Create Branch Meeting & MOM"
        closeOnOutsideClick={false}
      >
        <BranchMeetingForm
          branch={selectedBranch}
          onSuccess={handleMeetingSuccess}
          onCancel={() => setShowMeetingModal(false)}
        />
      </Modal>
    </div>
  );
};

export default OverallMOM;

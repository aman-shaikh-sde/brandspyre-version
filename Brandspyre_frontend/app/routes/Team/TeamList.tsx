import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Modal from "src/component/Modal";
import { FileDown, Plus, Eye, SquarePen, Trash2, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
import CreateTeamForm from "./CreateTeamForm";
import EditTeamForm from "./EditTeamForm";
import PageHeader from "src/component/ui/PageHeader";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";

const TeamList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState("");
  const [deleteBranchcode, setDeleteBranchcode] = useState("");
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [hydrated, setHydrated] = useState(false);

  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);

  const { branchCodeOptions, fetchBranches } = useBranchStore();

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

  const getTeams = async (
    page = currentPage,
    limit = pageSize,
    search = searchTerm,
    branch = selectedBranchCode
  ) => {
    setLoading(true);
    try {
      let url = `/teams/read?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (branch) url += `&branchcode=${branch}`;

      const response = await apiClient.get(url);

      setData(response?.data?.data || []);
      setTotalItem(response?.data?.totalDocuments || response?.data?.length || 0);
    } catch (err) {
      console.error("Error fetching teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated && token) {
      getTeams(currentPage, pageSize, searchTerm, selectedBranchCode);
    }
  }, [hydrated, token, currentPage, pageSize, searchTerm, selectedBranchCode]);

  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    setShowEditModal(true);
  };

  const handleDeleteTeam = (team: any) => {
    setDeleteTeamId(team.team_id);
    setDeleteBranchcode(team.branchcode);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTeamId) return;
    try {
      setLoading(true);
      const response = await apiClient.delete(`/teams/delete`, {
        data: { team_id: deleteTeamId, branchcode: deleteBranchcode },
      });
      if (response?.status === 200 || response?.status === 201) {
        setShowDeleteModal(false);
        notify.success("Team deleted successfully!");
        getTeams();
      }
    } catch (error) {
      console.error("Error deleting team", error);
      notify.error("Failed to delete team");
    } finally {
      setLoading(false);
    }
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, "TeamList.xlsx");
  };

  const thead = () => [
    { data: "Team Name & ID" },
    { data: "Team Lead ID" },
    { data: "Branch Code" },
    { data: "Created Date" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    if (!data) return [];

    return data.map((team: any) => ({
      id: team.team_id,
      data: [
        {
          data: (
            <div>
              <Link
                to={`/teamview/${encodeURIComponent(team.team_id)}`}
                className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition"
              >
                {team.team_name}
              </Link>
              <p className="text-xs font-mono text-slate-500">ID: {team.team_id}</p>
            </div>
          ),
        },
        { data: <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{team.team_lead || "Unassigned"}</span> },
        { data: <CrmBadge label={team.branchcode || "GLOBAL"} variant="purple" /> },
        {
          data: (
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {team.created_on ? new Date(team.created_on).toLocaleDateString() : "—"}
            </span>
          ),
        },
        {
          data: (
            <div className="flex justify-center gap-1.5">
              <Link to={`/teamview/${encodeURIComponent(team.team_id)}`}>
                <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition" title="View Team Hierarchy">
                  <Eye size={16} />
                </button>
              </Link>
              <button onClick={() => handleEditTeam(team)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition" title="Edit Team">
                <SquarePen size={16} />
              </button>
              <button onClick={() => handleDeleteTeam(team)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition" title="Delete Team">
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  if (!hydrated) {
    return <div className="p-8 text-center text-slate-400">Loading team manager...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizational Teams & Hierarchy"
        description="Structure enterprise departments, assign team leads, track branch allocations, and manage staff operations."
        primaryAction={{
          label: "New Team",
          onClick: () => setShowCreateModal(true),
          icon: <Plus size={16} />,
        }}
        secondaryActions={[
          { label: "Export Excel", onClick: handleOnExport, icon: <FileDown size={14} /> },
        ]}
      />

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search team name or ID..."
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
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setSelectedBranchCode("");
          setCurrentPage(1);
        }}
      />

      {/* Data Table */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No organizational teams match your search filters"
        enableSorting={true}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={totalItem}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={(page) => setCurrentPage(page)}
          paginationLabel="teams"
          isScroll={true}
        />
      </div>

      {/* Create Modal */}
      <Modal isVisible={showCreateModal} maxWidth="2xl" onClose={() => setShowCreateModal(false)} title="Create New Department Team" closeOnOutsideClick={false}>
        <CreateTeamForm
          onSuccess={() => {
            setShowCreateModal(false);
            notify.success("Team created successfully!");
            getTeams();
          }}
          onClose={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isVisible={showEditModal} maxWidth="2xl" onClose={() => setShowEditModal(false)} title="Edit Team Configuration" closeOnOutsideClick={false}>
        {selectedTeam && (
          <EditTeamForm
            team={selectedTeam}
            onSuccess={() => {
              setShowEditModal(false);
              notify.success("Team updated successfully!");
              getTeams();
            }}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isVisible={showDeleteModal} maxWidth="sm" onClose={() => setShowDeleteModal(false)} title="Delete Team Confirmation">
        <div className="space-y-4 p-2 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete team <strong className="font-mono text-slate-900 dark:text-slate-100">{deleteTeamId}</strong>?
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">Cancel</button>
            <button onClick={confirmDelete} disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-2xs">{loading ? "Deleting..." : "Delete Team"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamList;

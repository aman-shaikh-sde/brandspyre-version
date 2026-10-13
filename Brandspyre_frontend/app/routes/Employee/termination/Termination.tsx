import { notify } from "~/services/notificationService";
import React, { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import moment from "moment";
import DataTable from "src/component/DataTable";
import FilterBar from "src/component/ui/FilterBar";
import CrmBadge from "src/component/ui/CrmBadge";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import AddTerminationForm from "./AddTerminationForm;";
import Modal from "src/component/Modal";
import { Eye, SquarePen, Plus } from "lucide-react";
import EditTerminationForm from "./EditTerminationForm";
import { Link } from "react-router";

const Termination = () => {
  const token = useAuthStore((state) => state.accessToken);
  const [data, setData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTermination, setSelectedTermination] = useState<any>(null);

  const fetchTerminations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/user_resign_form/read`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (Array.isArray(res?.data?.data)) {
        setData(res.data.data);
      } else {
        notify.error("Invalid data received");
      }
    } catch (err) {
      notify.error("Failed to fetch termination data");
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTermination = (item: any) => {
    setSelectedTermination(item);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Separation record updated successfully!");
    fetchTerminations();
  };

  useEffect(() => {
    if (token) fetchTerminations();
  }, [token]);

  const filteredData = data.filter((item: any) =>
    (item.staff_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.designation || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.termination_type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thead = () => [
    { data: "ID" },
    { data: "Staff Name" },
    { data: "Designation" },
    { data: "Team" },
    { data: "Termination Type" },
    { data: "Last Working Day" },
    { data: "Relieving Date" },
    { data: "Status" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () =>
    filteredData.map((item: any, index: number) => ({
      id: item.resign_id || index,
      data: [
        { data: <span className="font-mono text-xs text-slate-500">#{index + 1}</span> },
        { data: <span className="font-semibold text-slate-900 dark:text-slate-100">{item.staff_name}</span> },
        { data: <span className="text-xs text-slate-600 dark:text-slate-300">{item.designation || "-"}</span> },
        { data: <span className="text-xs text-slate-600 dark:text-slate-300">{item.team_name || "-"}</span> },
        { data: <span className="capitalize text-xs font-medium">{item.termination_type || "-"}</span> },
        { data: <span className="text-xs text-slate-500">{item.last_working_day ? moment(item.last_working_day).format("YYYY-MM-DD") : "-"}</span> },
        { data: <span className="text-xs text-slate-500">{item.reliving_date ? moment(item.reliving_date).format("YYYY-MM-DD") : "-"}</span> },
        {
          data: (
            <CrmBadge
              label={(item.status || "PENDING").toUpperCase()}
              variant={
                item.status === "approved"
                  ? "green"
                  : item.status === "rejected"
                  ? "red"
                  : "yellow"
              }
            />
          ),
        },
        {
          data: (
            <div className="flex items-center justify-center gap-1.5">
              <Link to={`/View-certificate/${encodeURIComponent(item.staff_id)}/${encodeURIComponent(item.resign_id)}`}>
                <button
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 transition"
                  title="View Certificate"
                >
                  <Eye size={14} />
                </button>
              </Link>
              <button
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                onClick={() => handleEditTermination(item)}
                title="Edit Record"
              >
                <SquarePen size={14} />
              </button>
            </div>
          ),
          className: "action-cell",
        },
      ],
    }));

  const defaultTerminationData = {
    staff_id: "",
    staff_name: "",
    branchcode: "",
    branch_name: "",
    department: "",
    designation: "",
    team_id: "",
    team_name: "",
    team_lead_id: "",
    team_lead_name: "",
    termination_type: "resignation",
    termination_reason: "",
    last_working_day: new Date().toISOString().split("T")[0],
    reliving_date: new Date().toISOString().split("T")[0],
    exit_notes: "",
    created_by: "HR_ADMIN",
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Separation & Exit Records</h3>
          <p className="text-xs text-slate-500">Manage employee resignations, exit interviews, relieving dates, and certificates.</p>
        </div>
        <div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs transition"
          >
            <Plus size={14} />
            <span>Record Separation</span>
          </button>
        </div>
      </div>

      {/* Clean FilterBar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => setSearchTerm(val)}
        searchPlaceholder="Search by staff name, designation, type..."
        onClearAll={() => setSearchTerm("")}
      />

      {/* Modern DataTable */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No separation records found"
        enableSorting={true}
        enableFilters={false}
      />

      {/* Modal for AddTerminationForm */}
      <Modal
        isVisible={showForm}
        onClose={() => setShowForm(false)}
        title="Record Employee Separation"
        maxWidth="3xl"
        closeOnOutsideClick={false}
      >
        <AddTerminationForm
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchTerminations();
          }}
          defaultData={defaultTerminationData}
        />
      </Modal>

      {/* Modal for EditTerminationForm */}
      <Modal
        isVisible={showEditModal}
        maxWidth="3xl"
        onClose={() => setShowEditModal(false)}
        title="Edit Separation Record"
      >
        <EditTerminationForm
          termination={selectedTermination}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
};

export default Termination;

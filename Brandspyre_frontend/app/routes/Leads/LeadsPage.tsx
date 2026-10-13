import {
  AlarmClockCheck,
  CalendarCheck2,
  CalendarClock,
  LogOut,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { Dot, Eye, FileDown, PenBox } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import AddSalaryForm from "~/routes/Employee/Salary/AddSalary";
import AddNewLeadForm from "./AddNewLead";
import AddNewRecordForm from "./AddNewRecord";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import CreateFollowupForm from "./AddNewRecord";
import EditFollowupForm from "./EditFollowup";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { notify } from "~/services/notificationService";
import { DotsLoader } from "src/component/Loaders/PageLoader";
import DotSpinner from "src/component/Loaders/LegLoader";

import CrmBadge from "src/component/ui/CrmBadge";

const LeadsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [activeTab, setActiveTab] = useState("salaryList");
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const accesstoken = useAuthStore((state) => state.accessToken);
  const { id } = useParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const filterOptions = [
    { value: "client", label: "Client" },
    { value: "Project", label: "Project" },
    { value: "Leads", label: "Leads" },
    { value: "Employee", label: "Employee" },
  ];

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Paid", label: "Paid" },
    { value: "Un Paid", label: "Un-Paid" },
  ];


  const [hydrated, setHydrated] = useState(false);



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


const token = accesstoken;


  const getLead = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/campaign/leads/read/profile?lead_id=${id}`
      );
      setLeadData(response.data.data);
      setSheetData(response.data.data.followup || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  const handleDeleteData = (followup) => {
    console.log("forlloowwdata", followup);
    setSelectedFollowup(followup);
    setShowDeleteModal(true);
  };
  const handleDelete = async () => {
    const followid = selectedFollowup.id;
    console.log("floowdeletedata", selectedFollowup);
    setLoading(true);
    try {
      const response = await apiClient.delete(
        `/campaign/followup/delete/${followid}`,
        {
          data: {
            data: {
              branchcode: selectedFollowup.branchcode,
              campaign_code: selectedFollowup.campaign_code,
              lead_id: id,
            },
          },
        }
      );

      if (response.status === 201) {
        notify.success("Followup deleted successfully!");
      } else {
        setError(response.data.message || "Failed to delete followup");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error deleting followup");
    } finally {
      setLoading(false);
    }
  };
  const thead = () => [
    { data: "ID" },
    { data: "Next Follow Date" },
    { data: "Status" },
    { data: "Notes" },
    { data: "Last Updated" },
    { data: "Action" },
  ];

  const tbody = () => {
    if (!leadData?.followup) return [];
    return leadData.followup.map((followup) => ({
      id: followup.id,
      data: [
        { data: followup.id },
        { data: followup.next_date },
        {
          data: (
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                followup.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/25 dark:text-yellow-400"
              }`}
            >
              <AlarmClockCheck size={20} className="mr-2" />
              {followup.status.charAt(0).toUpperCase() +
                followup.status.slice(1)}
            </div>
          ),
        },
        { data: followup.notes || "N/A" },
        { data: new Date(followup.lastupdate).toLocaleString() },
        {
          data: (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedFollowup(followup);
                  setShowEditModal(true);
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <PenBox size={18} />
              </button>

              <button
                onClick={() => handleDeleteData(followup)}
                className="text-red-800 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ),
        },
      ],
    }));
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "LeadFollowups");
    XLSX.writeFile(wb, "LeadFollowups.xlsx");
  };

  const Project = {
    status: "New",
    progress: 70,
  };

  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (hydrated && token) {
    getLead();
  }
  }, [hydrated,token,id]);

  if (loading)
    return (
      <div className="p-4 flex items-center">
        <DotSpinner />
      </div>
    );
  if (!leadData) return <div className="p-4">No data found</div>;

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex justify-between">
          <div className="p-4 text-red-700 mb-5">
            <div className="flex gap-5">
              <h1 className="text-2xl font-bold">Leads View Page</h1>
              <CrmBadge
                label={leadData.status || "new"}
                variant={
                  leadData.status === "active" || leadData.status === "converted" || leadData.status === "won"
                    ? "green"
                    : leadData.status === "lost"
                    ? "red"
                    : "blue"
                }
              />
            </div>
          </div>
          <div>
            <button
              className="text-gray-500 bg-gray-200 px-3 py-1 rounded-lg mt-6"
              onClick={handleGoBack}
            >
              <LogOut className="inline rotate-180 text-gray-500 mr-3" />
              Go Back
            </button>
          </div>
        </div>
        <div className="w-full max-w-full mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-gray-600 dark:text-white">
            Lead Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-red-800/5 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                  Lead Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Lead Name:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {leadData.lead_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Phone Number:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {leadData.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Email ID:
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {leadData.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      Status:
                    </span>
                    <CrmBadge
                      label={leadData.status || "new"}
                      variant={
                        leadData.status === "active" || leadData.status === "converted" || leadData.status === "won"
                          ? "green"
                          : leadData.status === "lost"
                          ? "red"
                          : "blue"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-800/5 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                  Project Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Assigned To:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {leadData.assignee_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Project Type:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {leadData.proj_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Lead Date:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {new Date(leadData.lead_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Communication Type:
                    </span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {leadData.comm_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="p-4 flex-grow">
              <div className="flex items-end justify-end">
                <button
                  onClick={handleOnExport}
                  className="text-gray-400 bg-white focus:outline-non font-medium text-xs rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-1 text-center mr-5 mb-5 flex items-center"
                >
                  <FileDown />
                  Export Excel
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-white text-xs bg-red-700 focus:outline-non font-medium rounded px-3 py-2.5 text-center mr-5 mb-5 flex items-center"
                >
                  + Add Followup
                </button>
              </div>

              <div className="flex justify-between">
                <Dropdown
                  options={filterOptions}
                  selectedValue={selectedFilter}
                  onSelect={setSelectedFilter}
                  placeholder="Filter By"
                  className="w-[150px]"
                />
                <Dropdown
                  options={statusOptions}
                  selectedValue={selectStatus}
                  onSelect={setSelectStatus}
                  placeholder="Payment Status"
                  className="w-[150px]"
                />
                <Dropdown
                  options={filterOptions}
                  selectedValue={selectedFilter}
                  onSelect={setSelectedFilter}
                  placeholder="Sort by"
                  className="w-[150px]"
                />
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search followups..."
                />
              </div>

              <DataTable thead={thead} tbody={tbody} />
              <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 mt-10">
                <CustomPagination
                  total={leadData.followup?.length || 0}
                  currentPage={currentPage}
                  defaultPageSize={10}
                  onChange={setCurrentPage}
                  paginationLabel="followups"
                  isScroll={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isVisible={showCreateModal}
        className="w-full max-w-2xl"
        onClose={() => setShowCreateModal(false)}
        title="Add New Followup"
      >
        <CreateFollowupForm
          leadId={id}
          leadData={leadData}
          onSuccess={() => {
            getLead();
            setShowCreateModal(false);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isVisible={showEditModal}
        className="w-full max-w-2xl"
        onClose={() => {
          setShowEditModal(false);
          setSelectedFollowup(null);
        }}
        title="Edit Followup"
      >
        <EditFollowupForm
          leadId={id}
          followupId={selectedFollowup?.id}
          onSuccess={() => {
            getLead();
            setShowEditModal(false);
            setSelectedFollowup(null);
          }}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedFollowup(null);
          }}
        />
      </Modal>
      <Modal
        isVisible={showModal}
        className="w-[200px]"
        onClose={() => setShowModal(false)}
        title="Add New Followup"
      >
        <AddNewRecordForm
          leadData={leadData}
          onCancel={() => setShowCreateModal(false)}
          leadId={id}
          onSuccess={getLead}
        />
      </Modal>

      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Branch"
      >
        <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Are you sure you want to delete this Followup? This action cannot
              be undone.
            </p>
          </div>

          <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Delete Branhch"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LeadsPage;

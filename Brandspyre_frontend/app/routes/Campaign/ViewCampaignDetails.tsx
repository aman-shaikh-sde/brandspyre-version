
import {
  AlarmClockCheck,
  CalendarCheck2,
  CalendarClock,
  LogOut,
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
import AddNewLeadForm from "../Leads/AddNewLead";
import AddNewRecordForm from "../Leads/AddNewRecord";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";

const CampaignPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const accesstoken = useAuthStore((state) => state.accessToken);
  const { id } = useParams();
  const campaign_code = decodeURIComponent(id);
  const [hydrated, setHydrated] = useState(false);
  
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

  const getCampaign = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/campaign/overview/read/profile?campaign_code=${campaign_code}`
      );
      setCampaignData(response.data.data);
      setSheetData(response.data.data.leads || []);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
    } finally {
      setLoading(false);
    }
  };

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




  useEffect(() => {
      if (hydrated && token) {
    getCampaign();
  }
  }, [hydrated,token,campaign_code]);

  const thead = () => [
    { data: "Lead ID" },
    { data: "Lead Name" },
    { data: "Phone" },
    { data: "Email" },
    { data: "Assignee" },
    { data: "Communication Type" },
    { data: "Status" },
  ];

  const tbody = () => {
    if (!campaignData?.leads) return [];
    return campaignData.leads.map((lead) => ({
      id: lead.id,
      data: [
        { data: lead.id },
        { data: lead.lead_name },
        { data: lead.phone },
        { data: lead.email },
        { data: lead.assignee_name },
        { data: lead.comm_type },
        {
          data: (
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                lead.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-800/25 dark:text-red-400"
              }`}
            >
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </div>
          ),
        },
      ],
    }));
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "CampaignLeads");
    XLSX.writeFile(wb, `Campaign_${campaign_code}_Leads.xlsx`);
  };

  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading campaign data...</div>;
  }

  if (!campaignData) {
    return <div className="p-4 text-center">Failed to load campaign data</div>;
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="flex justify-between">
          <div className="p-4 text-red-700 mb-5">
            <div className="flex gap-5">
              <h1 className="text-2xl font-bold">Campaign View Page</h1>
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-3 mt-2 ${
                  campaignData.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-800/25 dark:text-red-400"
                }`}
              >
                <Dot />
                {campaignData.status.toUpperCase()}
              </div>
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
            Campaign Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-red-800/5 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                  Campaign Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Campaign Name:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.campaginName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Campaign Code:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.campaign_code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Branch Code:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.branchcode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Campaign Type:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.campaigntype || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Status:
                    </span>
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        campaignData.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-800/25 dark:text-red-400"
                      }`}
                    >
                      <Dot />
                      {campaignData.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-800/5 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                  Campaign Timeline & Goals
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Start Date:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {new Date(campaignData.startdate).toLocaleDateString() || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      End Date:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {new Date(campaignData.enddate).toLocaleDateString() || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Current Leads:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.leads?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Goal Leads:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.goallead || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Conversion Rate:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {campaignData.conversationrate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {campaignData.summary && (
            <div className="p-4 bg-red-800/5 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                Campaign Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {campaignData.summary}
              </p>
            </div>
          )}

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
                  + Add New Lead
                </button>
              </div>

              <div className="flex justify-between mb-4">
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
                  placeholder="Lead Status"
                  className="w-[150px]"
                />
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search leads..."
                />
              </div>

              <DataTable thead={thead} tbody={tbody} />
              <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 mt-10">
                <CustomPagination
                  total={campaignData.leads?.length || 0}
                  currentPage={currentPage}
                  defaultPageSize={10}
                  onChange={setCurrentPage}
                  paginationLabel="leads"
                  isScroll={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Modal
        isVisible={showModal}
        className="w-[200px]"
        onClose={() => setShowModal(false)}
        title="Add New Lead"
      >
        <AddNewLeadForm 
          campaignCode={campaignData.campaign_code} 
          onSuccess={() => {
            setShowModal(false);
            getCampaign(); 
          }} 
        />
      </Modal>
    </>
  );
};

export default CampaignPage;

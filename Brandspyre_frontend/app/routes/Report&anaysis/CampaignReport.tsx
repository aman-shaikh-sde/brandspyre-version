import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import Dropdown from "src/component/DrapDown";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import DynamicBarChart from "src/component/graphComponents/DynamicBarChart";
import { useMediaQuery } from "../hooks/use-click-outside";
import { CgArrowsExchange } from "react-icons/cg";
import { FaHandsHelping } from "react-icons/fa";

const CampaignReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  // Get auth store values
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const staticBranchCode = useAuthStore((state) => state.branchcode);

  // Chart data state
  const [chartData, setChartData] = useState({
    title: "Campaign Performance",
    labels: [],
    datasets: [
      {
        label: "Conversion Rate (%)",
        data: [],
        backgroundColor: "rgba(34, 197, 94, 0.7)",
      },
    ],
  });

  // Fetch all branches (for superadmin only)
  useEffect(() => {
    if (userRole === "superadmin") {
      const fetchBranches = async () => {
        try {
          const response = await apiClient.get(
            `/branch/dropdown`
          );
          if (response.data && response.data.data) {
            setBranchOptions(
              response.data.data.map((branch) => ({
                value: branch.branchcode,
                label: `${branch.branchcode} - ${branch.name}`,
              }))
            );
          }
        } catch (error) {
          console.error("Error fetching branches", error);
          notify.error("Failed to fetch branches");
        }
      };
      fetchBranches();
    }
  }, [token, userRole]);

  // Fetch campaigns based on selected branch
  useEffect(() => {
    const fetchCampaigns = async () => {
      // For non-superadmin users, use the static branchcode
      const branchCodeToUse =
        userRole === "superadmin" ? selectedBranchCode : staticBranchCode;

      if (!branchCodeToUse) {
        setCampaignOptions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.get(
          `/campaign/overview/dropdown?branchcode=${branchCodeToUse}`
        );

        if (response.data && response.data.data) {
          const options = response.data.data.map((campaign) => ({
            value: campaign.campaign_code,
            label: `${campaign.campaignname} (${campaign.campaign_code})`,
          }));
          setCampaignOptions(options);
        }
      } catch (error) {
        console.error("Error fetching campaigns", error);
        notify.error("Failed to fetch campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [selectedBranchCode, staticBranchCode, token, userRole]);

  // Fetch campaign report data
  useEffect(() => {
    const fetchCampaignReport = async () => {
      // For non-superadmin users, use the static branchcode
      const branchCodeToUse =
        userRole === "superadmin" ? selectedBranchCode : staticBranchCode;

      if (!branchCodeToUse) {
        setReportData([]);
        return;
      }

      setLoading(true);
      try {
        let url = `/campaign/report/read/profile?branchcode=${branchCodeToUse}`;

        if (selectedCampaign) {
          url += `&campaign_code=${selectedCampaign}`;
        }

        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          setReportData(response.data.data);

          // Prepare chart data
          const labels = response.data.data.map(
            (campaign) => campaign.campaignname
          );
          const conversionRates = response.data.data.map(
            (campaign) => parseFloat(campaign.conversion_rate) || 0
          );

          setChartData({
            title: "Campaign Conversion Rates",
            labels: labels,
            datasets: [
              {
                label: "Conversion Rate (%)",
                data: conversionRates,
                backgroundColor: "rgba(34, 197, 94, 0.7)",
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching campaign report", error);
        notify.error("Failed to fetch campaign report");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignReport();
  }, [selectedBranchCode, staticBranchCode, selectedCampaign, token, userRole]);

  const handleBranchChange = (value) => {
    setSelectedBranchCode(value);
    setSelectedCampaign(""); // Reset campaign selection when branch changes
  };

  const handleCampaignChange = (value) => {
    setSelectedCampaign(value);
  };

  const handleOnExport = () => {
    if (!reportData || reportData.length === 0) {
      notify.error("No data to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      reportData.map((campaign) => ({
        "Branch Code": campaign.branchcode,
        "Campaign Code": campaign.campaign_code,
        "Campaign Name": campaign.campaignname,
        "Total Leads": campaign.total_leads,
        "Leads Assigned": campaign.leads_assigned,
        "Total Followups": campaign.total_followups,
        "Active Followups": campaign.active_followups,
        "Goal Leads": campaign.goallead,
        "Conversion Rate (%)": campaign.conversion_rate,
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Campaign Report");
    XLSX.writeFile(wb, "CampaignReport.xlsx");
  };

  // Table headers for campaign report
  const thead = () => [
    { data: "Branch Code" },
    { data: "Campaign Code" },
    { data: "Campaign Name" },
    { data: "Total Leads" },
    { data: "Leads Assigned" },
    { data: "Conversion Rate" },
    { data: "Goal Leads" },
  ];

  // Table body for campaign report
  const tbody = () => {
    return reportData.map((campaign) => ({
      id: campaign.campaign_code,
      data: [
        { data: campaign.branchcode },
        { data: campaign.campaign_code },
        { data: campaign.campaignname },
        { data: campaign.total_leads },
        { data: campaign.leads_assigned },
        {
          data: (
            <div
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
                parseFloat(campaign.conversion_rate) >= 50
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  parseFloat(campaign.conversion_rate) >= 50
                    ? "bg-green-800"
                    : "bg-red-700"
                }`}
              ></span>
              {campaign.conversion_rate} %
            </div>
          ),
        },
        { data: campaign.goallead },
      ],
    }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
            Campaign Report
          </h2>
        </div>
<div className="flex flex-col gap-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userRole === "superadmin" && (
              <Dropdown
                options={branchOptions}
                selectedValue={selectedBranchCode}
                onSelect={handleBranchChange}
                placeholder="Select Branch"
                className="w-[250px]"
                disabled={loading}
              />
            )}

            <Dropdown
              options={campaignOptions}
              selectedValue={selectedCampaign}
              onSelect={handleCampaignChange}
              placeholder="Select Campaign"
              className="w-[250px]"
              disabled={
                loading || (userRole === "superadmin" && !selectedBranchCode)
              }
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleOnExport}
              className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
              disabled={loading || reportData.length === 0}
            >
              <FileDown className="mr-1" />
              {!isMobile && "Export Excel"}
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-4">Loading...</div>}

        {!loading && reportData.length > 0 && (
          <>
            <div className="md:flex text-gray-700 mb-5 justify-between gap-3">
              <div className="bg-white w-[250px] h-[230px] flex flex-col justify-items-start justify-evenly rounded-lg shadow-lg ps-8">
                <div>
                  <h1 className="text-bold font-bold text-xl text-gray-700">
                    Total Client & Leads
                  </h1>
                </div>
                <div className="flex gap-6">
                  <div className="bg-green-400 w-[40px] h-[40px] rounded-full p-1">
                    <FaHandsHelping
                      className="text-gray-50 text-center"
                      size={28}
                    />
                  </div>
                  <p className="text-gray-500 font-xl mt-2">2 | 50</p>
                </div>
                <div>
                  <p className="font-light text-sm">Branch Detail</p>
                </div>
              </div>

              <div className="bg-white w-[250px] h-[230px] flex flex-col justify-items-start justify-evenly rounded-lg shadow-lg ps-8">
                <div>
                  <h1 className="text-bold font-bold text-xl text-gray-700">
                    Lead Conversion Rate
                  </h1>
                </div>
                <div className="flex gap-6">
                  <div className="bg-indigo-500 w-[40px] h-[40px] rounded-full p-1">
                    <CgArrowsExchange
                      className="text-gray-50 text-center"
                      size={28}
                    />
                  </div>
                  <p className="text-gray-500 font-xl mt-2">2%</p>
                </div>
                <div>
                  <p className="font-light text-sm">Leads Detail</p>
                </div>
              </div>

              <div>
                <DynamicBarChart
                  data={chartData}
                  theme="light"
                  className="h-[250px]  w-[550px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <DataTable
                thead={thead}
                tbody={tbody}
                responsive={true}
                className="min-w-full"
              />
            </div>
          </>
        )}

        {!loading && reportData.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {userRole === "superadmin" && !selectedBranchCode
              ? "Please select a branch to view campaign reports"
              : "No campaign data available for the selected filters"}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignReport;

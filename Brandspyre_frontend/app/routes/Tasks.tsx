import { useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { FaHandsHelping } from "react-icons/fa";
import { CgArrowsExchange } from "react-icons/cg";
import { Eye, Trash2 } from "lucide-react";
import { useMediaQuery } from "./hooks/use-click-outside";
import DynamicBarChart from "src/component/graphComponents/DynamicBarChart";
import ProjectAnaysis from "./Report&anaysis/ProjectAnaysis";
import PaymentInsight from "./Report&anaysis/PaymentInsight";
import EmployeeReport from "./Report&anaysis/EmployeeReport";


const Task = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("leadAnalysis");
  const [loading, setLoading] = useState(false);

  const LeaveData = [
    {
      id: "1",
      campaignName: "Summar camp",
      totalLead: "45",
      clientcovert: "35",
      convertrate: 76,
      avgFollow: "26",
    },
    {
      id: "2",
      campaignName: "Event",
      totalLead: "140",
      clientcovert: "35",
      convertrate: 30,
      avgFollow: "26",
    },
  ];

  const thead = () => [
    { data: "id" },
    { data: "Campaign Name" },
    { data: "Total Leads" },
    { data: "Convert to Client" },
    { data: "Conversion Rate" },
    { data: "Avg.Followup" },
    { data: "View Details", className: "text-center" },
  ];

  const tbody = () => {
    return LeaveData.map((branch) => ({
      id: branch.id,
      data: [
        { data: branch.id },
        { data: branch.campaignName },
        { data: branch.totalLead },
        { data: branch.clientcovert },
        {
          data: (
            <div
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${branch.convertrate >= 50 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${branch.convertrate >= 50 ? "bg-green-800" : "bg-red-700"}`}
              ></span>
              {branch.convertrate} %
            </div>
          ),
        },
        { data: branch.avgFollow },
        {
          data: (
            <div className="flex flex-wrap justify-between">
              <button
                className="p-1 text-blue-900 rounded hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => setShowEditModal(true)}
                title="View"
              >
                <Eye size={18} />
              </button>
              <button
                className="p-1 text-red-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
                onClick={() => setShowDeleteModal(true)}
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ),
          className: "action-cell",
        },
      ],
    }));
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(LeaveData);
    XLSX.utils.book_append_sheet(wb, ws, "LeadData");
    XLSX.writeFile(wb, "LeadAnalysis.xlsx");
  };

  const tabs = [
    { id: "leadAnalysis", label: "Lead Analysis" },
    { id: "projectsts", label: "Project Status" },
    { id: "paymentinsight", label: "Payment Insight" },
    { id: "EmployeeReport", label: "Employee Report" },
  ];

  const chartData = {
    title: "Monthly Sales",
    labels: ["January", "February", "March", "April"],
    datasets: [
      {
        label: "Sales",
        data: [150, 200, 180, 220],
        backgroundColor: "rgba(34, 197, 94, 0.7)",
      },
    ],
  };

  const theme = "light";
  const pageSizeOptions = [
    { value: 20, label: "20 per page" },
    { value: 40, label: "30 per page" },
    { value: 50, label: "40 per page" },
    { value: 80, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 200, label: "100 per page" },
  ];

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="dark:border-gray-700">
        <nav className="flex justify-evenly -mb-px">
          {tabs.map((tab, index) => (
            <>
              {index > 0 && (
                <span className="bg-gray-300 dark:bg-red-700 w-[50px] h-[2px] mt-5 items-center"></span>
              )}
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-medium text-sm ${
                  activeTab === tab.id
                    ? "text-gray-200 dark:bg-gray-800 dark:text-red-800 hover:border-gray-300 bg-red-700 w-[120px] h-[40px] rounded-sm"
                    : "border-transparent text-gray-700 hover:text-red-700 dark:bg-gray-600 dark:text-gray-100 hover:border-gray-300 bg-gray-200 w-[120px] h-[40px] rounded-sm"
                }`}
              >
                {tab.label}
              </button>
            </>
          ))}
        </nav>
      </div>
      <div className="p-4 flex-grow">
        {activeTab === "leadAnalysis" && (
          <>
            <div className="flex flex-col min-h-screen">
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-center mt-4">
                  <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)] mb-10">
                    Lead Analysis
                  </h2>
                </div>
<div className="md:flex text-gray-700 mb-5 justify-between gap-3">
                  <div className="bg-white dark:bg-gray-800 w-[250px] h-[230px] flex flex-col justify-items-start justify-evenly rounded-lg shadow-lg ps-8">
                    <div>
                      <h1 className="text-bold font-bold text-xl text-gray-700 dark:text-gray-200">
                        Todal Client & Leads
                      </h1>
                    </div>
                    <div className="flex gap-6">
                      <div className="bg-green-400 w-[40px] h-[40px] dark:bg-green-400/55 rounded-full p-1">
                        <FaHandsHelping
                          className="text-gray-50 text-center"
                          size={28}
                        />
                      </div>
                      <p className="text-gray-500 font-xl mt-2 darktext-gray-400">
                        230 | 300
                      </p>
                    </div>
                    <div>
                      <p className="font-light text-sm dark:text-gray-300">
                        Branch Detail
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 w-[250px] h-[230px] flex flex-col justify-items-start justify-evenly rounded-lg shadow-lg ps-8">
                    <div>
                      <h1 className="text-bold font-bold text-xl text-gray-700 dark:text-gray-200">
                        Lead Conversion Rate
                      </h1>
                    </div>
                    <div className="flex gap-6">
                      <div className="bg-indigo-500 dark:bg-indigo-600/25 w-[40px] h-[40px] rounded-full p-1">
                        <CgArrowsExchange
                          className="text-gray-50 text-center dark:text-gray-300"
                          size={28}
                        />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-xl mt-2">
                        60%
                      </p>
                    </div>
                    <div>
                      <p className="font-light text-sm dark:text-gray-300">
                        Leads Detail
                      </p>
                    </div>
                  </div>

                  <div>
                    <DynamicBarChart
                      data={chartData}
                      theme={theme}
                      className="h-[230px] w-[600px]"
                    />
                  </div>
                </div>
                <div className={`flex items-end justify-end gap-4 mt-[30px]`}>
                  <div className={`flex flex-row gap-4`}>
                    <Dropdown
                      options={pageSizeOptions}
                      selectedValue={pageSize}
                      onSelect={handlePageSizeChange}
                      placeholder="Items per page"
                      className="w-full md:w-[150px]"
                    />
                    <button
                      onClick={handleOnExport}
                      className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
                    >
                      <FileDown className="mr-1" />
                      Export Excel
                    </button>
                  </div>
                </div>

                <div
                  className={`${isMobile ? "hidden" : "block"} mb-4`}
                >
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="w-[200px] mt-3">
                      <SearchInput
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Search branches..."
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {loading && <div className="text-center py-4">Loading...</div>}
                <div className="overflow-x-auto">
                  <DataTable
                    thead={thead}
                    tbody={tbody}
                    responsive={true}
                    className="min-w-full"
                  />
                </div>
              </div>

              <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
                <CustomPagination
                  total={LeaveData.length}
                  currentPage={currentPage}
                  defaultPageSize={pageSize}
                  onChange={handlePageChange}
                  paginationLabel="branches"
                  isScroll={true}
                />
              </div>
            </div>
          </>
        )}
{/* 
        {activeTab === "projectsts" && (
          <div>
            <ProjectAnaysis />
          </div>
        )}

        {activeTab === "paymentinsight" && <PaymentInsight />}
        {activeTab === "EmployeeReport" && <EmployeeReport />} */}
      </div>
      <Modal
        isVisible={showEditModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowEditModal(false)}
        title="Update Leave Request"
      >
        <div>Edit Modal Content</div>
      </Modal>

      <Modal
        isVisible={showDeleteModal}
        className="w-full md:w-[600px]"
        onClose={() => setShowDeleteModal(false)}
        title="Delete Branch"
      >
        <div className="flex flex-col gap-6 justify-center items-center">
          <p className="text-gray-500 text-lg font-bold text-center">
            Are you sure you want to delete this Leave Details?
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              type="button"
              className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-hover-secondary)] text-gray-800 hover-effect dark:text-gray-700 rounded dark:hover:bg-gray-500 transition"
              disabled={loading}
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-hover)] hover-effect transition"
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Task;
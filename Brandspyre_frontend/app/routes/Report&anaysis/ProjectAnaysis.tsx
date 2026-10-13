import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import AddSalaryForm from "../Employee/Salary/AddSalary";
import SalaryRevisionTracker from "../Employee/Salary/SalaryRevision"; // New component we'll create
import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
import { FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
import DynamicLineGraph from "src/component/graphComponents/DynamicLineGraph";
import BranchWiseReport from "./BranchwiseReport";
import ClientwiseReport from "./ClientwiseReport";

const ProjectAnaysis = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [activeTab, setActiveTab] = useState("projectreport"); 
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

  const data = [
    {
      id: "1",
      projecttype: "commercial",
      active: "70",
      delay: "15",
      completed: "55",
      
    },
        {
      id: "2",
      projecttype: "Recidential",
      active: "50",
      delay: "5",
      completed: "45",
      
    },
  ];

  const tabs = [
    { id: "projectreport", label: "Projects Report" },
    { id: "Branchwise", label: "Branchwise Report" },
    { id: "clientreport", label: "Client Report" },
  ];

  // const getData = () => {
  //   return data;
  // };

  // useEffect(() => {
  //   setSheetData(getData());
  // }, []);

  const thead = () => [
    { data: "id" },
    { data: "Project Type" },
    { data: "Active" },
    { data: "Delayed" },
    { data: "Completed" },
    { data: "View" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((user) => ({
      id: user.id,
      data: [
        { data: user.id },
        { data: user.projecttype },
        { data: user.active},
        { data: user.delay },
        { data: user.completed},
       
        {
          data: (
            <Link to={`/employee/salary_slip/${user.id}`}>
              <button className="bg-red-400/25 dark:bg-red-700/15 px-4 py-2 dark:text-red-200 text-red-700 rounded-sm">
                View
              </button>
            </Link>
          ),
        },
      ],
    }));
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "BRANDSPYRE");
    XLSX.writeFile(wb, "EmployeeList.xlsx");
  };
  const progressItems = [
    {
      type: "Completed",
      value: 350,
      color: "bg-green-500",
      icon: <FaCheckCircle className="text-green-500 mr-2" />,
      label: "Paid",
    },
    {
      type: "pending",
      value: 450,
      color: "bg-yellow-500",
      icon: <FaClock className="text-yellow-500 mr-2" />,
      label: "Pending",
    },
    {
      type: "overdue",
      value: 200,
      color: "bg-red-500",
      icon: <FaExclamationCircle className="text-red-500 mr-2" />,
      label: "Overdue",
    },
  ];
  const lineGraphData = {
    title: "Monthly Project Data",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      { label: "Paid", data: [65, 59, 80, 81, 56, 55] },
      { label: "Un_Paid", data: [28, 48, 40, 19, 86, 27] },
      { label: "Pending", data: [45, 25, 60, 91, 76, 35] },
      { label: "OverDue", data: [35, 55, 30, 71, 66, 45] },
    ],
  };
  const theme = "light";

  return (
    <>
      <div className="flex flex-col min-h-screen mt-[30px]">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex justify-around -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 flex-grow ">
          {activeTab === "projectreport" && (
            <>
              <div className="flex mt-6" >
                <div className="w-[40%]">
                <PaymentProgressCard
                  items={progressItems}
                  className="dark:bg-gray-800 bg-white w-[400px] h-[300px]"
                  title={"Project status"}
                />
                </div>
                <div className="w-[60%]">
                <DynamicLineGraph
                  data={lineGraphData}
                  theme={theme}
                  className="h-[300px] w-[700px]"
                />
                </div>
              </div>
              <div className="flex items-end justify-end mt-8">
                <button
                  onClick={handleOnExport}
                  className="text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5 text-center mr-5 mb-5 flex items-center"
                >
                  <FileDown />
                  Export Excel
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-white bg-red-700 focus:outline-non font-medium text-sm rounded-sm px-9 py-2.5 text-center  mb-5 flex items-center"
                >
                  Add Project
                </button>
              </div>

              <div className="flex justify-between">
                <Dropdown
                  options={filterOptions}
                  selectedValue={selectedFilter}
                  onSelect={setSelectedFilter}
                  placeholder="Filter By"
                  className="w-[200px]"
                />
                <Dropdown
                  options={statusOptions}
                  selectedValue={selectStatus}
                  onSelect={setSelectStatus}
                  placeholder="Payment Status"
                  className="w-[200px]"
                />
                <Dropdown
                  options={filterOptions}
                  selectedValue={selectedFilter}
                  onSelect={setSelectedFilter}
                  placeholder="Sort by"
                  className="w-[200px]"
                />
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search users..."
                />
              </div>

              <DataTable thead={thead} tbody={tbody} isSearch />
              <div className=" bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
                <CustomPagination
                  total={100}
                  currentPage={currentPage}
                  defaultPageSize={10}
                  onChange={setCurrentPage}
                  paginationLabel="employees"
                  isScroll={true}
                />
              </div>
            </>
          )}
          {/* {activeTab === "Branchwise" && <BranchWiseReport/>}
          {activeTab === "clientreport" && <ClientwiseReport/>} */}

        </div>
      </div>

      <Modal
        isVisible={showModal}
        className="w-[200px]"
        onClose={() => setShowModal(false)}
        title="Add Salary Form"
      >
        <AddSalaryForm onCancel={() => setShowModal(false)} />
      </Modal>
    </>
  );
};

export default ProjectAnaysis;

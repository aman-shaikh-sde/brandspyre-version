import { useEffect, useState } from "react";
import { CalendarCheck2, CalendarClock, LogOut, Star } from "lucide-react";

import { useNavigate } from "react-router";
import Modal from "../../../src/component/Modal";
import AddSalaryForm from "../Employee/Salary/AddSalary";
import DataTable from "../../../src/component/DataTable";
import CustomPagination from "../../../src/component/CustomPagination";
import SearchInput from "../../../src/component/SearchInput";
import Dropdown from "../../../src/component/DrapDown";
import { Dot, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { IoIosStar } from "react-icons/io";
import StarRating from "src/component/StarRating";


const ClientFeedbacks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [activeTab, setActiveTab] = useState("salaryList");

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
      id: "ASC_12",
      date: "Agenda_1",
      name: "ABC 1",
      summary: "Requested font change",
rating:5
    },
   {
      id: "ASC_13",
      date: "Agenda_1",
      name: "ABC 1",
      summary: "Requested font change",
rating:3
    },
  ];

  const getData = () => {
    return data;
  };

  useEffect(() => {
    setSheetData(getData());
  }, []);

  const thead = () => [
    {data:"Id"},
    { data: "Date" },
    { data: "Rating" },
    { data: "FeedBack" },
    { data: "view" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((user) => ({
      id: user.id,
      data: [
        { data: user.id },
         { data: user.date },
       { 
        data: <StarRating rating={user.rating} /> 
      },
        {data:user.summary},
       
    
    
        {
          data: (
            <Link to="/project_tasklist">
              <button className="bg-red-400/25 text-xs dark:bg-red-700/15 px-3 py-1 dark:text-red-200 text-red-700 rounded-sm">
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
  const Project = {
    status: "completed",
    progress: 70,
  };
  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1); 
  };

  return (
    <>
     <div className="text-red-600 text-2xl font-bold mt-5">Client MOM</div>
      <div className="flex justify-between">
        {" "}
       
     <div className="w-full mt-5">
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

              <DataTable thead={thead} tbody={tbody}  maxHeight="500px"/>
              <div className=" bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 mt-10">
                <CustomPagination
                  total={100}
                  currentPage={currentPage}
                  defaultPageSize={10}
                  onChange={setCurrentPage}
                  paginationLabel="employees"
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
        title="Add Salary Form"
      >
        <AddSalaryForm onCancel={()=>setShowModal(false)}/>
      </Modal>
    
   </>
  );
};
export default ClientFeedbacks;

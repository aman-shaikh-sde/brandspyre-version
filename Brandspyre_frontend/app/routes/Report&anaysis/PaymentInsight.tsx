import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { Eye, FileDown, SquarePen, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import AddSalaryForm from "../Employee/Salary/AddSalary";
import SalaryRevisionTracker from "../Employee/Salary/SalaryRevision"; // New component we'll create
import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
import { FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";
import DynamicLineGraph from "src/component/graphComponents/DynamicLineGraph";
import BranchWiseReport from "./BranchwiseReport";
import ClientwiseReport from "./ClientwiseReport";
import IncomeExpenseReport from "./IncomeExpenseReport";
import TeamPaymentReport from "./TeamPaymentReport";

const PaymentInsight = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [activeTab, setActiveTab] = useState("invoices"); 


  const tabs = [
    { id: "branchwise", label: "Branchwise Payment Summay" },
    { id: "teamwise", label: "Teamwise Payment Summay" },
    
  ];




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
          {activeTab === "invoices" && (
       
            <>
            <h1>payment</h1>
            </>
           
          )}
          {activeTab === "teamwise" && <TeamPaymentReport/>}

        </div>
      </div>

    
    </>
  );
};

export default PaymentInsight;

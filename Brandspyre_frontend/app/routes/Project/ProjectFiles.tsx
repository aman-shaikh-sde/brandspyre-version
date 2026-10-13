import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";

import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";

import DocumentViewer from "src/component/DocumentViewer";
import Salary from "~/routes/Salary";
import SalaryRevision from "../Employee/Salary/SalaryRevision";
import AddSalaryForm from "../Employee/Salary/AddSalary";
import ClientDocument from "./ProjectDocuments/ClientDocuments";
import DraftDocument from "./ProjectDocuments/DraftDocuments";
import FinalDocument from "./ProjectDocuments/FinalDocuments";
import MeetingDocuments from "./MeetingDocuments";

const ProjectFiles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [activeTab, setActiveTab] = useState("clientdocuments");

  const [documents] = useState([
    {
      id: "1",
      name: "Production Department Structure Charts.pdf",
      type: "PDF",
      size: "2.4 MB",
      url: "/documents/Production%20Department%20Structure%20Chart.pdf",
      category: "HR",
    },
    {
      id: "2",
      name: "Salary Structure.docx",
      type: "Word",
      size: "1.2 MB",
      url: "/documents/Interview Evaluation Form.docx",
      category: "Finance",
    },
  ]);

  const tabs = [
    { id: "clientdocuments", label: "Client Documents" },
    { id: "finaldocument", label: "Final Documents" },
    { id: "draftdocuments", label: "Draft Documents" },
      // { id: "meetingdocuments", label: "Meeting Documents" },
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
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

        <div className="p-4 flex-grow">
          {activeTab === "clientdocuments" && <ClientDocument />}

          {activeTab === "finaldocument" && <FinalDocument  />}
          {activeTab === "draftdocuments" && <DraftDocument/>}
            {/*{activeTab === "meetingdocuments" && <MeetingDocuments />}*/}
        </div>
      </div>

      <Modal
        isVisible={showModal}
        className="w-[200px]"
        onClose={() => setShowModal(false)}
        title="Add Salary Form"
      >
        <AddSalaryForm />
      </Modal>
    </>
  );
};

export default ProjectFiles;

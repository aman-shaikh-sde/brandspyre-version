// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";

// import { FileDown } from "lucide-react";
// import * as XLSX from "xlsx";
// import { Link } from "react-router-dom";
// import AddSalaryForm from "../Salary/AddSalary";
// import SalaryRevisionTracker from "../Salary/SalaryRevision";
// import DocumentViewer from "src/component/DocumentViewer";
// import Salary from "~/routes/Salary";

// const Documents = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState("");
//   const [sheetData, setSheetData] = useState([]);
//   const [selectStatus, setSelectStatus] = useState("");
//   const [activeTab, setActiveTab] = useState("salaryList");

//   const [documents] = useState([
//     {
//       id: "1",
//       name: "Production Department Structure Charts.pdf",
//       type: "PDF",
//       size: "2.4 MB",
//       url:"http://localhost:5173/documents/Production%20Department%20Structure%20Chart.pdf",
//       category: "HR"
//     },
//     {
//       id: "2",
//       name: "Salary Structure.docx",
//       type: "Word",
//       size: "1.2 MB",
//       url: "/documents/Interview Evaluation Form.docx",
//       category: "Finance"
//     },
//   ]);


//   // Add a new tab for documents
//   const tabs = [
   
//     { id: "termination", label: "Employee Termination Manage" },
//     { id: "documents", label: "Company Documents" },

//   ];

//   return (
//     <>
//       <div className="flex flex-col min-h-screen mt-[-30px]">
//         <div className="border-b border-gray-200 dark:border-gray-700">
//           <nav className="flex -mb-px">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
//                   activeTab === tab.id
//                     ? "border-red-500 text-red-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </nav>
//         </div>

//         <div className="p-4 flex-grow mt[-50px]">
//       { activeTab === "termination" ? (
//             <SalaryRevisionTracker />
//           ) : (
//             <DocumentViewer documents={documents} />
//           )}
//         </div>
//       </div>

//       <Modal
//         isVisible={showModal}
//         className="w-[200px]"
//         onClose={() => setShowModal(false)}
//         title="Add Salary Form"
//       >
//         <AddSalaryForm />
//       </Modal>
//     </>
//   );
// };

// export default Documents;


import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";

import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";

import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";
import AddSalaryForm from "../Salary/AddSalary";
import SalaryRevisionTracker from "../Salary/SalaryRevision";
import DocumentViewer from "src/component/DocumentViewer";
import Salary from "~/routes/Salary";
import { useAuthStore } from "src/stores/authStore";
import {
  Building,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  IndianRupee,
  Percent,
  User,
}from "lucide-react";


import useEmployeeStore from "src/stores/useEmployeeStore";
const departmentOptions = [
  "architecture",
  "visualization",
  "structural",
  "drafting",
  "hr",
  "sales",
  "consulting",
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [activeTab, setActiveTab] = useState("salaryList");
  const [isModelOpen,setIsModelOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);

  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);

  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = storeRole || (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : "") || "";
  const branchcodeForNor = useAuthStore((state) => state.branchcode);

  const [formData, setFormData] = useState({
    staffId: '',
    department: '',
    document: null
  });

  const [documents] = useState([
    {
      id: "1",
      name: "Production Department Structure Charts.pdf",
      type: "PDF",
      size: "2.4 MB",
      url:"/documents/Production%20Department%20Structure%20Chart.pdf",
      category: "HR"
    },
    {
      id: "2",
      name: "Salary Structure.docx",
      type: "Word",
      size: "1.2 MB",
      url: "/documents/Interview Evaluation Form.docx",
      category: "Finance"
    },
  ]);

 useEffect(() => {
    if (selectedDepartment) {
      fetchStaffOptions();
    }
  }, [selectedDepartment]);

  const fetchStaffOptions = async () => {
    setIsFetchingStaff(true);
    try {
      let url = `/users/dropdown?department=${selectedDepartment}`;
      
      // If user is not superadmin, add branchcode to the URL
      if (userRole !== "superadmin") {
        url += `&branchcode=${branchcodeForNor}`;
      }

      const response = await apiClient.get(url);

      if (response.data && response.data.data) {
        const options = response.data.data.map(user => ({
          value: user.staff_id,
          label: `${user.firstname + user.lastname} - ${user.designation}`
        }));
        setStaffOptions(options);
      }
    } catch (err) {
      notify.error("Failed to fetch staff options", {
        style: {
          border: "1px solid rgb(185 28 28)",
          padding: "14px",
          color: "rgb(185 28 28)",
        },
        iconTheme: {
          primary: "rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
    } finally {
      setIsFetchingStaff(false);
    }
  };
   const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    // Reset staff_id when department changes
    setFormData(prev => ({ ...prev, staff_id: "" }));
  };



const handleSubmit = () => {
  console.log()
}

const handleClosePopup = () => {
    setIsModelOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      document: file
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add a new tab for documents
  const tabs = [
   
    { id: "termination", label: "Employee Termination Manage" },
    { id: "documents", label: "Company Documents" },
    
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen mt-[-30px]">
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
        <div>
          {/*<button 
            className='p-4 mt-4 bg-red-500 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus-ring-red-300'
            onClick = {() => setIsModelOpen(true)}
          >
            Add Documents
          </button>*/}
        </div>

        <div className="p-4 flex-grow mt[-50px]">
      { activeTab === "termination" ? (
            <SalaryRevisionTracker />
          ) : (
            <DocumentViewer documents={documents} />
          )}
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

      {isModelOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Popup Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Employee Information</h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-6 space-y-4">

              {/* Staff ID */}
              

              {/* Department */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Building className="inline mr-1" size={14} /> Department <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Staff ID <span className="text-red-700 text-lg m-2">*</span>
            </p>
            {isFetchingStaff ? (
              <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
            ) : (
              <select
                name="staff_id"
                value={formData.staff_id}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!selectedDepartment || staffOptions.length === 0}
              >
                <option value="">Select Staff</option>
                {staffOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {selectedDepartment && staffOptions.length === 0 && !isFetchingStaff && (
              <div className="text-xs text-gray-500 mt-1">No staff found in this department</div>
            )}
          </div>



              {/* Document Upload */}
              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                  Document
                </label>
                <input
                  type="file"
                  id="document"
                  name="document"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {formData.document && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {formData.document.name}
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Documents;
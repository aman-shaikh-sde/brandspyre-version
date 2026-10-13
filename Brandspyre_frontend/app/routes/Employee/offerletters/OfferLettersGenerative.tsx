// import React, { useState, useEffect } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";
// import Dropdown from "src/component/DrapDown";
// import { FileDown, Eye, Plus } from "lucide-react";
// import * as XLSX from "xlsx";
// import toast, { Toaster } from "react-hot-toast";
// import { useMediaQuery } from "~/routes/hooks/use-click-outside";
// import { useNavigate } from "react-router-dom";
// import AsyncSelect from "react-select/async";
// import { useAuthStore } from "src/stores/authStore";
// import { BASE_URL } from "~/constants/api";
// // import { useStaffFilter } from "../../routes/hooks/UseStaffFilter";
// import useBranchStore from "src/stores/useBranchStore";


// const OfferLettersGenerative = () => {
//   const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [totalItem, setTotalItem] = useState(0);
//   const [error, setError] = useState(null);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [pageSize, setPageSize] = useState(8);
//   const [showFilters, setShowFilters] = useState(false);
//   const [sheetData, setSheetData] = useState([]);
//   const navigate = useNavigate();


// const permissions = useAuthStore((state) => state.permissions);
//   const userRole = permissions[0].role;
//   const branchCode = useBranchStore((state) => state.branchCodeOptions);
//   const branchcodeForNor = useAuthStore((state) => state.branchcode);
//   const branchCodeOptions =
//     userRole === "superadmin"
//       ? branchCode
//       : [{ value: branchcodeForNor, label: branchcodeForNor }];
 


//     const [campaignOptions, setCampaignOptions] = useState([]);
//   const [clientOptions, setClientOptions] = useState([]);
//   const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
//   const [isFetchingClients, setIsFetchingClients] = useState(false);
// // const [loading, setLoading] = useState(false);
//   // const [error, setError] = useState(null);
//   const token = useAuthStore((state) => state.accessToken);


//    const [departments, setDepartments] = useState<Department[]>([]);
//   const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
//   const [departmentDesignations, setDepartmentDesignations] = useState<
//     Record<string, string[]>
//   >({});
//   const [designationOptions, setDesignationOptions] = useState<string[]>([]);

//   const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
//   const [isFetchingStaff, setIsFetchingStaff] = useState(false);

//   const [selectedDepartment, setSelectedDepartment] = useState("");

//   // Form state
//   const [formData, setFormData] = useState({
//     name: "",
//     position: "",
//     department: "",
//     location: "",
//     startDate: "",
//     monthlySalary: "",
//     otherAllowances: "",
//     contactEmail: "",
//     contactPhone: "",
//   });

//   const pageSizeOptions = [
//     { value: 20, label: "20 per page" },
//     { value: 40, label: "30 per page" },
//     { value: 50, label: "40 per page" },
//     { value: 80, label: "50 per page" },
//     { value: 100, label: "100 per page" },
//     { value: 200, label: "100 per page" },
//   ];

//   // Load saved offer letters from localStorage
//   useEffect(() => {
//     const savedLetters = localStorage.getItem("offerLetters");
//     if (savedLetters) {
//       const letters = JSON.parse(savedLetters);
//       setData(letters);
//       setSheetData(letters);
//       setTotalItem(letters.length);
//     }
//   }, []);


// useEffect(() => {
//   async function fetchData() {
//     try {
//       if (!formData.branchcode) return; // ✅ prevent empty requests

//       const [deptRes, desigRes] = await Promise.all([
//         fetch(
//           `http://localhost:3000/api/getDepartments`
//         ),
//         fetch("http://localhost:3000/api/getDesignations"),
//       ]);

//       const deptData = await deptRes.json();
//       const desigData = await desigRes.json();

//       // set full dept list
//       setDepartments(deptData.data);

//       // ✅ Department options converted to {value, label}
//       const deptNames = deptData.data
//         .map((d: Department) => d.name)
//         .filter(Boolean)
//         .map((name: string) => ({ value: name, label: name }));

//       setDepartmentOptions(deptNames);

//       // Build mapping { departmentName: [{value, label}, {value, label}] }
//       const deptDesigs: Record<string, { value: string; label: string }[]> = {};
//       desigData.data.forEach((item: Designation) => {
//         const dept = item.department;
//         if (!deptDesigs[dept]) {
//           deptDesigs[dept] = [];
//         }
//         deptDesigs[dept].push({
//           value: item.designation,
//           label: item.designation,
//         });
//       });
//       setDepartmentDesignations(deptDesigs);
//     } catch (err) {
//       console.error("Error fetching data", err);
//     }
//   }

//   fetchData();
// }, [formData.branchcode]);




//   // ✅ Update designation options when department changes
//   useEffect(() => {
//     if (formData.department) {
//       setDesignationOptions(departmentDesignations[formData.department] || []);
//     } else {
//       setDesignationOptions([]);
//     }
//   }, [formData.department, departmentDesignations]);



//   //  const handleDepartmentChange = (e) => {
//   //   setSelectedDepartment(e.target.value);
//   //   // Reset staff_id when department changes
//   //   setFormData(prev => ({ ...prev, staff_id: "" }));
//   // };






//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const newOfferLetter = {
//       ...formData,
//       id: Date.now().toString(),
//       generatedDate: new Date().toISOString(),
//     };
    
//     const updatedLetters = [...data, newOfferLetter];
//     setData(updatedLetters);
//     setSheetData(updatedLetters);
//     setTotalItem(updatedLetters.length);
//     localStorage.setItem("offerLetters", JSON.stringify(updatedLetters));
    
//     // Reset form
//     setFormData({
//       name: "",
//       position: "",
//       department: "",
//       location: "",
//       startDate: "",
//       monthlySalary: "",
//       otherAllowances: "",
//       contactEmail: "",
//       contactPhone: "",
//     });
    
//     setShowCreateModal(false);
//     notify.success("Offer letter generated successfully!");
//   };


// useEffect(() => {
//     if (selectedDepartment) {
//       fetchStaffOptions();
//     }
//   }, [selectedDepartment]);

//   const viewOfferLetter = (id) => {
//     navigate(`/offer-letter-view/${id}`);
//   };

//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   const handleSearch = (value) => {
//     setSearchTerm(value);
//     setCurrentPage(1);
//   };

//   const handlePageSizeChange = (value) => {
//     setPageSize(value);
//     setCurrentPage(1);
//   };

//   const handleOnExport = () => {
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(sheetData);
//     XLSX.utils.book_append_sheet(wb, ws, "OfferLetters");
//     XLSX.writeFile(wb, "OfferLetters.xlsx");
//   };

//   // Filter data based on search term
//   const filteredData = data.filter(letter =>
//     letter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     letter.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     letter.department.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Paginate data
//   const paginatedData = filteredData.slice(
//     (currentPage - 1) * pageSize,
//     currentPage * pageSize
//   );

//   const thead = () => [
//     { data: "#" },
//     { data: "Candidate Name" },
//     { data: "Position" },
//     { data: "Department" },
//     { data: "Location" },
//     { data: "Generated Date" },
//     { data: "Actions", className: "text-center" },
//   ];

//   const tbody = () => {
//     return paginatedData.map((letter, index) => ({
//       id: letter.id,
//       data: [
//         { data: index + 1 + (currentPage - 1) * pageSize },
//         { data: letter.name },
//         { data: letter.position },
//         { data: letter.department },
//         { data: letter.location },
//         { 
//           data: new Date(letter.generatedDate).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//           })
//         },
//         {
//           data: (
//             <div className="flex justify-center gap-2">
//               <button
//                 onClick={() => viewOfferLetter(letter.id)}
//                 className="p-1 text-blue-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
//                 title="View Offer Letter"
//               >
//                 <Eye size={18} />
//               </button>
//             </div>
//           ),
//           className: "action-cell",
//         },
//       ],
//     }));
//   };


//       const loadDeps = (inputValue: string, callback: (options: Option[]) => void) => {
//   const filtered = departmentOptions.filter((c) =>
//     c.label.toLowerCase().includes(inputValue.toLowerCase())
//   );
//   callback(filtered);
// };


//   const loadDesg = (inputValue: string, callback: (options: Option[]) => void) => {
//   const filtered = designationOptions.filter((c) =>
//     c.label.toLowerCase().includes(inputValue.toLowerCase())
//   );
//   callback(filtered);
// };




//   return (
//     <>
//       <div className="flex flex-col min-h-screen">
//         <div className="p-4 flex-grow">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-primary)]">
//               Offer Letter Management
//             </h2>
//             {isMobile && (
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="p-2 bg-gray-200 rounded-md"
//               >
//                 {showFilters ? "Hide Filters" : "Show Filters"}
//               </button>
//             )}
//           </div>
//           <Toaster position="top-right" reverseOrder={false} />

//           <div
//             className={`flex ${isMobile ? "flex-col" : "items-end justify-end"} gap-4 mb-5`}
//           >
//             <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}>
//               <Dropdown
//                 options={pageSizeOptions}
//                 selectedValue={pageSize}
//                 onSelect={handlePageSizeChange}
//                 placeholder="Items per page"
//                 className="w-full md:w-[150px]"
//               />
//               <button
//                 onClick={handleOnExport}
//                 className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5"
//               >
//                 <FileDown className="mr-1" />
//                 {!isMobile && "Export Excel"}
//               </button>
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
//               >
//                 {!isMobile && "New Offer Letter"} <Plus className="ml-1" size={18} />
//               </button>
//             </div>
//           </div>

//           <div
//             className={`${isMobile && !showFilters ? "hidden" : "block"} mb-4`}
//           >
//             <div
//               className={`${isMobile ? "grid grid-cols-1 gap-3" : "flex justify-between items-center gap-3"}`}
//             >
//               <div className={`${isMobile ? "w-full" : "w-[300px]"}`}>
//                 <SearchInput
//                   value={searchTerm}
//                   onChange={handleSearch}
//                   placeholder="Search offer letters..."
//                   className="w-full"
//                 />
//               </div>
//             </div>
//           </div>

//           {loading && <div className="text-center py-4">Loading...</div>}
//           {error && (
//             <div className="text-red-500 text-center py-4">{error}</div>
//           )}

//           <div className="overflow-x-auto">
//             <DataTable
//               thead={thead}
//               tbody={tbody}
//               responsive={true}
//               className="min-w-full"
//             />
//           </div>
//         </div>

//         <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
//           <CustomPagination
//             total={filteredData.length}
//             currentPage={currentPage}
//             defaultPageSize={pageSize}
//             onChange={handlePageChange}
//             paginationLabel="offer letters"
//             isScroll={true}
//           />
//         </div>
//       </div>

//       {/* Create Offer Letter Modal */}
//       <Modal
//         isVisible={showCreateModal}
//         className="w-full md:w-[800px]"
//         onClose={() => setShowCreateModal(false)}
//         title="Create New Offer Letter"
//       >
//         <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
//           <form onSubmit={handleSubmit}>
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
//                 Candidate Information
//               </h3>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Candidate Name
//                   </label>
//                   <input
//                     type="text"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">


//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Department
//                   </label>
//                  {/* <input
//                     type="text"
//                     name="department"
//                     value={formData.department}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />*/}



//                              <AsyncSelect
//   cacheOptions
//   defaultOptions={departmentOptions} // must be [{ value, label }]
//   name="department"
//   loadOptions={loadDeps}
//   onChange={(selected: Option | null) => {
//     setSelectedDepartment(selected ? selected.value : ""); // ✅ update local state
//     setFormData((prev) => ({
//       ...prev,
//       department: selected ? selected.value : "",
//       staff_id: "", // ✅ reset staff_id when department changes
//     }));
//   }}
//   value={
//     departmentOptions.find((opt) => opt.value === formData.department) || null
//   }
//   placeholder="Select or search department"
// />



//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Position
//                   </label>
//          {/*         <input
//                     type="text"
//                     name="position"
//                     value={formData.position}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />*/}



//                                    <AsyncSelect
//   cacheOptions
//   defaultOptions={designationOptions} // must be [{ value, label }]
//   name="position"
//   loadOptions={loadDesg}
//   onChange={(selected: Option | null) => {
//     // setSelectedDepartment(selected ? selected.value : ""); // ✅ update local state
//     setFormData((prev) => ({
//       ...prev,
//       position: selected ? selected.value : "",
//        // ✅ reset staff_id when department changes
//     }));
//   }}
//   value={
//     designationOptions.find((opt) => opt.value === formData.position) || null
//   }
//   placeholder="Select or search position"
// />


//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Location
//                   </label>
//                   <input
//                     type="text"
//                     name="location"
//                     value={formData.location}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Start Date
//                   </label>
//                   <input
//                     type="date"
//                     name="startDate"
//                     value={formData.startDate}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Monthly Salary
//                   </label>
//                   <input
//                     type="text"
//                     name="monthlySalary"
//                     value={formData.monthlySalary}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Other Allowances
//                   </label>
//                   <input
//                     type="text"
//                     name="otherAllowances"
//                     value={formData.otherAllowances}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Contact Email
//                   </label>
//                   <input
//                     type="email"
//                     name="contactEmail"
//                     value={formData.contactEmail}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>

//                 <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
//                     Contact Phone
//                   </label>
//                   <input
//                     type="tel"
//                     name="contactPhone"
//                     value={formData.contactPhone}
//                     onChange={handleInputChange}
//                     className="w-full p-2 border border-gray-300 rounded-md"
//                     required
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//               <button
//                 type="button"
//                 className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
//                 onClick={() => setShowCreateModal(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
//               >
//                 Generate Offer Letter
//               </button>
//             </div>
//           </form>
//         </div>
//       </Modal>
//     </>
//   );
// };

// export default OfferLettersGenerative;



import React, { useState, useEffect } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { FileDown, Eye, Plus } from "lucide-react";
import * as XLSX from "xlsx";
import FilterBar from "src/component/ui/FilterBar";
import { notify } from "~/services/notificationService";
import { useMediaQuery } from "~/routes/hooks/use-click-outside";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { apiClient } from "src/services/apiClient";
import useBranchStore from "src/stores/useBranchStore";

interface DepartmentItem {
  id?: string;
  name: string;
  department?: string;
  [key: string]: any;
}

interface DesignationItem {
  id?: string;
  name?: string;
  designation?: string;
  department: string;
  [key: string]: any;
}

const OfferLettersGenerative = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [showFilters, setShowFilters] = useState(false);
  const [sheetData, setSheetData] = useState([]);
  const navigate = useNavigate();

  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : null) || storeRole || "staff";
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
  const branchCodeOptions =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];

  const token = useAuthStore((state) => state.accessToken);

  // Department & Designation States
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, { value: string; label: string }[]>
  >({});
  const [designationOptions, setDesignationOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Tamil Nadu Cities (hardcoded list)
  const tamilnaduCities = [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Erode",
    "Vellore",
    "Thoothukudi",
    "Thanjavur",
  ].map((city) => ({ value: city, label: city }));

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    department: "",
    location: "",
    startDate: "",
    monthlySalary: "",
    otherAllowances: "",
    contactEmail: "",
    contactPhone: "",
  });

  const pageSizeOptions = [
    { value: 20, label: "20 per page" },
    { value: 40, label: "30 per page" },
    { value: 50, label: "40 per page" },
    { value: 80, label: "50 per page" },
    { value: 100, label: "100 per page" },
    { value: 200, label: "100 per page" },
  ];

  // Load saved offer letters from localStorage
  useEffect(() => {
    const savedLetters = localStorage.getItem("offerLetters");
    if (savedLetters) {
      const letters = JSON.parse(savedLetters);
      setData(letters);
      setSheetData(letters);
      setTotalItem(letters.length);
    }
  }, []);

  // Fetch Departments & Designations
  useEffect(() => {
    async function fetchData() {
      try {
        // if (!formData.branchcode) return;

        const [deptRes, desigRes] = await Promise.all([
          apiClient.get("/getDepartments").catch((err) => {
            console.warn("Could not load departments:", err);
            return { data: { data: [] } };
          }),
          apiClient.get("/getDesignations").catch((err) => {
            console.warn("Could not load designations:", err);
            return { data: { data: [] } };
          }),
        ]);

        const deptData = deptRes?.data;
        const desigData = desigRes?.data;

        const rawDepts: DepartmentItem[] = Array.isArray(deptData?.data)
          ? deptData.data
          : Array.isArray(deptData?.departments)
          ? deptData.departments
          : [];

        setDepartments(rawDepts);

        const deptNames = rawDepts
          .map((d: DepartmentItem) => d?.name || d?.department)
          .filter((name): name is string => Boolean(name))
          .map((name: string) => ({ value: name, label: name }));

        setDepartmentOptions(deptNames);

        const rawDesigs: DesignationItem[] = Array.isArray(desigData?.data)
          ? desigData.data
          : Array.isArray(desigData?.designations)
          ? desigData.designations
          : [];

        const deptDesigs: Record<
          string,
          { value: string; label: string }[]
        > = {};
        rawDesigs.forEach((item: DesignationItem) => {
          const dept = item?.department;
          const desigName = item?.designation || item?.name;
          if (dept && desigName) {
            if (!deptDesigs[dept]) {
              deptDesigs[dept] = [];
            }
            deptDesigs[dept].push({
              value: desigName,
              label: desigName,
            });
          }
        });
        setDepartmentDesignations(deptDesigs);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    }

    fetchData();
  }, []);

  // Update designation options when department changes
  useEffect(() => {
    if (formData.department) {
      setDesignationOptions(departmentDesignations[formData.department] || []);
    } else {
      setDesignationOptions([]);
    }
  }, [formData.department, departmentDesignations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newOfferLetter = {
      ...formData,
      id: Date.now().toString(),
      generatedDate: new Date().toISOString(),
    };

    const updatedLetters = [...data, newOfferLetter];
    setData(updatedLetters);
    setSheetData(updatedLetters);
    setTotalItem(updatedLetters.length);
    localStorage.setItem("offerLetters", JSON.stringify(updatedLetters));

    setFormData({
      name: "",
      position: "",
      department: "",
      location: "",
      startDate: "",
      monthlySalary: "",
      otherAllowances: "",
      contactEmail: "",
      contactPhone: "",
    });

    setShowCreateModal(false);
    notify.success("Offer letter generated successfully!");
  };

  const viewOfferLetter = (id) => {
    navigate(`/offer-letter-view/${id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "OfferLetters");
    XLSX.writeFile(wb, "OfferLetters.xlsx");
  };

  // Filters
  const filteredData = data.filter(
    (letter) =>
      letter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const thead = () => [
    { data: "#" },
    { data: "Candidate Name" },
    { data: "Position" },
    { data: "Department" },
    { data: "Location" },
    { data: "Generated Date" },
    { data: "Actions", className: "text-center" },
  ];

  const tbody = () => {
    return paginatedData.map((letter, index) => ({
      id: letter.id,
      data: [
        { data: index + 1 + (currentPage - 1) * pageSize },
        { data: letter.name },
        { data: letter.position },
        { data: letter.department },
        { data: letter.location },
        {
          data: new Date(letter.generatedDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
        },
        {
          data: (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => viewOfferLetter(letter.id)}
                className="p-1 text-blue-600 rounded hover:text-gray-500 dark:hover:text-gray-300"
                title="View Offer Letter"
              >
                <Eye size={18} />
              </button>
            </div>
          ),
          className: "action-cell",
        },
      ],
    }));
  };

  // Async loaders
  const loadDeps = (
    inputValue: string,
    callback: (options: { value: string; label: string }[]) => void
  ) => {
    const filtered = departmentOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };

  const loadDesg = (
    inputValue: string,
    callback: (options: { value: string; label: string }[]) => void
  ) => {
    const filtered = designationOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };

  const loadCities = (
    inputValue: string,
    callback: (options: { value: string; label: string }[]) => void
  ) => {
    const filtered = tamilnaduCities.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Offer Letter Registry</h3>
          <p className="text-xs text-slate-500">Generate and manage candidate employment offers, position terms, and letters.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOnExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-2xs transition"
          >
            <FileDown size={14} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-2xs transition"
          >
            <Plus size={14} />
            <span>New Offer Letter</span>
          </button>
        </div>
      </div>

      {/* Clean FilterBar */}
      <FilterBar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search candidate name, position, department..."
        filters={[
          {
            key: "pageSize",
            label: "Items Per Page",
            options: [
              { label: "10 per page", value: "10" },
              { label: "20 per page", value: "20" },
              { label: "50 per page", value: "50" },
              { label: "100 per page", value: "100" },
            ],
            value: String(pageSize),
            onChange: (val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            },
          },
        ]}
        onClearAll={() => {
          setSearchTerm("");
          setPageSize(20);
          setCurrentPage(1);
        }}
      />

      {loading && <div className="text-center py-4 text-xs text-slate-500">Loading offer letters...</div>}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Modern DataTable without cramped filters */}
      <DataTable
        thead={thead}
        tbody={tbody}
        isLoading={loading}
        noDataText="No offer letters found"
        enableSorting={true}
        enableFilters={false}
      />

      {/* Card Pagination */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <CustomPagination
          total={filteredData.length}
          currentPage={currentPage}
          defaultPageSize={pageSize}
          onChange={handlePageChange}
          paginationLabel="offer letters"
          isScroll={true}
        />
      </div>

      {/* Create Offer Letter Modal */}
      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Create New Offer Letter"
        closeOnOutsideClick={false}
      >
        <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                Candidate Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate Name */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Department */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions={departmentOptions}
                    name="department"
                    loadOptions={loadDeps}
                    onChange={(selected: { value: string; label: string } | null) => {
                      setSelectedDepartment(selected ? selected.value : "");
                      setFormData((prev) => ({
                        ...prev,
                        department: selected ? selected.value : "",
                        staff_id: "",
                      }));
                    }}
                    value={
                      departmentOptions.find(
                        (opt) => opt.value === formData.department
                      ) || null
                    }
                    placeholder="Select or search department"
                  />
                </div>

                {/* Position */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Position
                  </label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions={designationOptions}
                    name="position"
                    loadOptions={loadDesg}
                    onChange={(selected: { value: string; label: string } | null) => {
                      setFormData((prev) => ({
                        ...prev,
                        position: selected ? selected.value : "",
                      }));
                    }}
                    value={
                      designationOptions.find(
                        (opt) => opt.value === formData.position
                      ) || null
                    }
                    placeholder="Select or search position"
                  />
                </div>

                {/* Location (Tamil Nadu Cities) */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <AsyncSelect
                    cacheOptions
                    defaultOptions={tamilnaduCities}
                    name="location"
                    loadOptions={loadCities}
                    onChange={(selected: { value: string; label: string } | null) => {
                      setFormData((prev) => ({
                        ...prev,
                        location: selected ? selected.value : "",
                      }));
                    }}
                    value={
                      tamilnaduCities.find(
                        (opt) => opt.value === formData.location
                      ) || null
                    }
                    placeholder="Select or search city"
                  />
                </div>

                {/* Start Date */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Monthly Salary */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Monthly Salary
                  </label>
                  <input
                    type="number"
                    name="monthlySalary"
                    value={formData.monthlySalary}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                {/* Other Allowances */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Other Allowances
                  </label>
                  <input
                    type="number"
                    name="otherAllowances"
                    value={formData.otherAllowances}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Contact Email */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Contact Phone */}
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md"
              >
                Generate Offer Letter
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default OfferLettersGenerative;

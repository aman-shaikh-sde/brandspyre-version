// import React from "react";
// import {
//   Users,
//   BookCheck,
//   UserX,
//   ArrowRightToLine,
//   ClockFading,
//   Eye
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";
// import Dropdown from "src/component/DrapDown";
// import { Dot, FileDown } from "lucide-react";
// import * as XLSX from "xlsx";
// import { Link } from "react-router";
// import AddNewProject from "./AddNewProject";

// function Project() {
//     const [searchTerm, setSearchTerm] = useState("");
//       const [currentPage, setCurrentPage] = useState(1);
//       const [showModal, setShowModal] = useState(false);
//       const [selectedFilter, setSelectedFilter] = useState("");
//       const [sheetData, setSheetData] = useState([]);
//       const [selectStatus, setSelectStatus] = useState("");
//       const [activeTab, setActiveTab] = useState("salaryList");
      
//       const filterOptions = [
//         { value: "client", label: "Client" },
//         { value: "Project", label: "Project" },
//         { value: "Leads", label: "Leads" },
//         { value: "Employee", label: "Employee" },
//       ];
//       const statusOptions = [
//         { value: "Pending", label: "Pending" },
//         { value: "Paid", label: "Paid" },
//         { value: "Un Paid", label: "Un-Paid" },
//       ];
//       const data = [
//         {
//           key: "PR_1",
//           employee: "ABC project",
//           empId: "EMP-1024",
//           position: "Residant",
//           department: "Factory",
//           currentSalary: 'Client 1',
//           proposedSalary: "MR_3",
//           incrementPercentage: "Factory interier designed",
//           requestedBy: "Sarah Miller (HR)",
//           requestDate: "2023-06-05",
//           progress:19,
//           status: "completed",
//           justification: "Exceptional performance in Q2 projects",
//         },
//         {
//           key: "PR_2",
//           employee: "CK project",
//           empId: "EMP-1024",
//           position: "Commercial",
//           department: "Structure Block",
//           currentSalary: "Client 2",
//           proposedSalary: "MR_123",
//           incrementPercentage: "commercial only plan",
//           requestedBy: "Sarah Miller (HR)",
//           requestDate: "2023-06-05",
//          progress:70,
//           status: "pending",
//           justification: "Exceptional performance in Q2 projects",
//         },
//       ];
    
//       const tabs = [
//         { id: "salaryList", label: "Salary List" },
//         { id: "revisionTracking", label: "Revision & Increment Tracking" },
//       ];
    
//       const getData = () => {
//         return data;
//       };
    
//       useEffect(() => {
//         setSheetData(getData());
//       }, []);
    
//       const thead = () => [
//         { data: "id" },
//         { data: "Project Name" },
//         { data: "Project Type" },
//         { data: "Assigned By" },
//         { data: "Descripion" },
//         { data: "Client Name" },
//         { data: "Estimated Date" },
//         {data:"Progress Bar"},
//         { data: "Status" },
//         { data: "Action" },
//       ];
    
//       const tbody = () => {
//         if (!data) return [];
//         return data.map((user) => ({
//           id: user.key,
//           data: [
//             { data: user.key },
//             { data: user.employee },
//             { data: user.position },
          
//             { data: user.proposedSalary },
//             { data: user.incrementPercentage },
//             { data: user.requestedBy },
//             { data: user.requestDate },
//             {data:(
//                <>
//                <div className="flex">
//                <div className="w-[80px] rounded-full h-2 dark:bg-dark-600 bg-gray-200 dark:bg-gray-700">
//                 <div
//                   className={`bg-red-700 h-2 rounded-full transition-all duration-500`}
//                   style={{ width: `${user.progress}%` }}
//                 ></div>
//               </div> 
//               <div>
//             <span className="text-red-700 ml-3">  {user.progress} %</span>
//             </div>
//             </div>
//              </>
//             )},
//             {
//               data: (
//                 <div
//                   className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
//                     user.status === "completed"
//                       ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
//                       : user.status === "rejected"
//                         ? "bg-red-100 text-red-800 dark:bg-red-800/25 dark:text-red-400"
//                         : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/25 dark:text-yellow-400"
//                   }`}
//                 >
//                   <Dot />
//                   {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
//                 </div>
//               ),
//             },
//             {
//               data: (
//                 <Link to={`/project/${user.id}`}>
//                   <button className=" px-4 py-2 dark:text-blue-600 text-blue-700 rounded-sm">
//                  <Eye className="inline" size={20}/>   View
//                   </button>
//                 </Link>
//               ),
//             },
//           ],
//         }));
//       };
    
//   return (
//     <>
//     <div className="text-red-600 text-2xl font-bold">Project</div>
//      <div className="flex items-end justify-end">
//         <button
//           className="text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5 text-center mr-5 mb-5 flex items-center"
//         >
//           <FileDown />
//           Export Excel
//         </button>
//         <button
//           className="text-white bg-red-700 focus:outline-non font-medium text-sm rounded-lg px-9 py-2.5 text-center mr-5 mb-5 flex items-center"
//        onClick={()=>setShowModal(true)} >
//       + New Project
//         </button>
//       </div>

//       <div className="flex justify-between">
//         <Dropdown
//           options={filterOptions}
//           selectedValue={selectedFilter}
//           onSelect={setSelectedFilter}
//           placeholder="Filter By"
//           className="w-[200px]"
//         />

//         <SearchInput
//           value={searchTerm}
//           onChange={setSearchTerm}
//           placeholder="Search users..."
//         />
//       </div>

//       <DataTable thead={thead} tbody={tbody} maxHeight="500px" />

//       <div className=" bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 ">
//         <CustomPagination
//           total={12}
//           currentPage={currentPage}
//           defaultPageSize={10}
//           onChange={setCurrentPage}
//           paginationLabel="employees"
//           isScroll={true}
//         />
//       </div>
      
//       <Modal
//         isVisible={showModal}
//         className="w-[1200px] md:w-[1200px]"
//         onClose={() => setShowModal(false)}
//         title="Add New Project"
//       >
//         <AddNewProject
//           onCancel={() => setShowModal(false)}
//         />
//       </Modal>
//     </>
//   )
// }

// export default Project;
import { CalendarCheck, ClipboardList, Flag, Hash, ListChecks, User, Users, AlertCircle, File, Briefcase } from "lucide-react";
import { AiFillProject } from "react-icons/ai";

const AddTask = ({ onCancel }) => {
  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {/* Task Basic Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <ClipboardList className="inline mr-2" /> Task Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ListChecks className="inline mr-1" size={14} /> Task Title
            </p>
            <input
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter task name"
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AiFillProject className="inline mr-1" size={14} /> Related Project
            </p>
            <select className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none">
              <option value="">Select project</option>
              <option value="project1">Office Building Construction</option>
              <option value="project2">Residential Complex</option>
            </select>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Flag className="inline mr-1" size={14} /> Related Milestone
            </p>
            <select className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none">
              <option value="">Select milestone</option>
              <option value="milestone1">Foundation Completion</option>
              <option value="milestone2">Structural Work</option>
            </select>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlertCircle className="inline mr-1" size={14} /> Priority
            </p>
            <select className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none">
              <option value="">Select priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Start Date
            </p>
            <input
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Due Date
            </p>
            <input
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Task Assignment Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <User className="inline mr-2" /> Assignment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Assigned To
            </p>
            <select className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none">
              <option value="">Select team member</option>
              <option value="user1">John Doe</option>
              <option value="user2">Jane Smith</option>
            </select>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Briefcase className="inline mr-1" size={14} /> Department
            </p>
            <select className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none">
              <option value="">Select department</option>
              <option value="design">Design</option>
              <option value="construction">Construction</option>
              <option value="engineering">Engineering</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <ListChecks className="inline mr-2" /> Task Details
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Description
          </p>
          <textarea
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Describe the task in detail..."
          />
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <File className="inline mr-1" size={14} /> Attachments
          </p>
          <input
            type="file"
            className="w-full text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none"
            multiple
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max size: 5GB (PNG, JPEG, PDF, DOCS, EXCEL)</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
        >
          Create Task
        </button>
      </div>
    </div>
  );
};

export default AddTask;

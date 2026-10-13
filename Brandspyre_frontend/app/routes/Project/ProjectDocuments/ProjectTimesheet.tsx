// import { useEffect, useState } from "react";
// import { apiClient } from "src/services/apiClient";
// import moment from 'moment'; // Optional: for formatting date/time

// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Modal from "src/component/Modal";
// import Dropdown from "src/component/DrapDown";
// import { Dot, FileDown } from "lucide-react";
// import * as XLSX from "xlsx";
// import { Link } from "react-router";
// import AddSalaryForm from "~/routes/Employee/Salary/AddSalary";
// import { useAuthStore } from "src/stores/authStore";
// import { BASE_URL } from "~/constants/api";


// const ProjectTimesheet = ({projectData}) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState("");
//   const [sheetData, setSheetData] = useState([]);
//   const [selectStatus, setSelectStatus] = useState("");
//   const [activeTab, setActiveTab] = useState("salaryList");
  
//     const token = useAuthStore((state) => state.accessToken);
//   const permission = useAuthStore((state) => state.permissions);
//   const staff_id = useAuthStore((state) => state.staff_id);
//   const userBranchCode = useAuthStore((state) => state.branchcode);

//   const project_code=projectData.project_code;
//   const [data, setData] = useState([]);

//   const [selectedMember, setSelectedMember] = useState("");
// const [selectedDate, setSelectedDate] = useState("");
// const [selectedendDate, setSelectedendDate] = useState("");


//   const filterOptions = [
//     { value: "client", label: "Client" },
//     { value: "Project", label: "Project" },
//     { value: "Leads", label: "Leads" },
//     { value: "Employee", label: "Employee" },
//   ];

//   const statusOptions = [
//     { value: "Pending", label: "Pending" },
//     { value: "Paid", label: "Paid" },
//     { value: "Un Paid", label: "Un-Paid" },
//   ];
//   // Sample data
//   // const data = [
//   //   {
//   //     id: "Task_1",
//   //     date: "Karthick ",
//   //     name: "25-05-2025",
//   //     branch: "ABC Commercial 1",
//   //     priority: "64:12:52 ",
//   //     progress: 65,
//   //   },
//   //   {
//   //     id: "Task_2",
//   //     date: "Kathir",
//   //     name: "25-05-2025",
//   //     branch: "ABC Commercial 1",
//   //     priority: "20:12:52 ",
//   //     progress: 20,
//   //   },
//   //   // More data...
//   // ];



// //   useEffect(() => {
// //   const fetchTaskData = async () => {
// //     try {
// //       // const token = localStorage.getItem('token');
// //      const response = await apiClient.get(
// //   `/project/task/checkinout/read?project_code=${project_code}`,
// //   {
// //     headers: {
// //       Authorization: `Bearer ${token}`,
// //     },
// //   }
// // );


// //       const rawData = response.data?.data || [];

// //       const transformed = rawData.map((item) => ({
// //         id: `Task_${item.id}`,
// //         name: item.staff_name,
// //         date: moment(item.check_in).format('DD-MM-YYYY'),
// //         branch: item.task_title,
// //         department: item.milestone_title || "N/A",
// //         // completedat : moment(item.check_out).format('DD-MM-YYYY') || "Not Closed",
// //         completedat: item.check_out
// //     ? moment(item.check_out).format('DD-MM-YYYY') 
// //     : "Not Closed",

// //         priority:
// //           item.check_in && item.check_out
// //             ? moment
// //                 .utc(moment(item.check_out).diff(moment(item.check_in)))
// //                 .format("HH:mm:ss")
// //             : "00:00:00",
// //         progress: item.duration ? Math.min(item.duration * 10, 100) : 0,
// //       }));

// //       setData(transformed);
// //       setSheetData(transformed);
// //     } catch (error) {
// //       console.error("Failed to fetch task data:", error);
// //     }
// //   };

// //   // ✅ Call it here
// //   fetchTaskData();
// // }, []);

//   const fetchTaskData = async () => {
//   try {
//     const params: any = {
//       project_code,   // always send
//     };

//     if (selectedDate) {
//       params.start_date = moment(selectedDate).format("YYYY-MM-DD");
//     }

//     if (selectedendDate) {
//       params.end_date = moment(selectedendDate).format("YYYY-MM-DD");
//     }

//     if (selectedMember) {
//       // here selectedMember is the staff name, but your backend expects staff_id
//       // so either store the real `staff_id` in `memberOptions` or map name->id
//       params.staff_id = selectedMember;
//     }

//     const response = await apiClient.get(`/project/task/checkinout/read`, {
//
//       params,   // ✅ dynamic filters
//     });

//     const rawData = response.data?.data || [];

//     const transformed = rawData.map((item) => ({
//       id: `Task_${item.id}`,
//       name: item.staff_name,
//       date: moment(item.check_in).format("DD-MM-YYYY"),
//       branch: item.task_title,
//       department: item.milestone_title || "N/A",
//       completedat: item.check_out
//         ? moment(item.check_out).format("DD-MM-YYYY")
//         : "Not Closed",
//       priority:
//         item.check_in && item.check_out
//           ? moment
//               .utc(moment(item.check_out).diff(moment(item.check_in)))
//               .format("HH:mm:ss")
//           : "00:00:00",
//       progress: item.duration ? Math.min(item.duration * 10, 100) : 0,
//     }));

//     setData(transformed);
//     setSheetData(transformed);
//   } catch (error) {
//     console.error("Failed to fetch task data:", error);
//   }
// };


// useEffect(() => {
//   fetchTaskData();
// }, [selectedDate, selectedendDate, selectedMember, project_code]);



// // Optional: Create unique member list for dropdown
// const memberOptions = Array.from(
//   new Set(data.map((item) => item.name))
// ).map((name) => ({ value: name, label: name }));



// const filteredData = data.filter((item) => {
//   const matchesMember = selectedMember ? item.name === selectedMember : true;
//   const matchesDate = selectedDate
//     ? item.date === moment(selectedDate).format("DD-MM-YYYY")
//     : true;

//     const matchesendDate = selectedendDate
//     ? item.completedat === moment(selectedendDate).format("DD-MM-YYYY")
//     : true;

//   return matchesMember && matchesDate && matchesendDate ;
// });




//   const getData = () => {
//     return data;
//   };

//   useEffect(() => {
//     setSheetData(getData());
//   }, []);

//   const thead = () => [
//     { data: "Task Id" },
//     { data: "Member Name" },
//     { data: "Checked In" },
//     { data: "Checked Out" },
//     { data: "Task Name" },
//     { data: "Duration" },
//     { data: "Hours" },
//     { data: "View" },
//   ];

// const tbody = () => {
//   if (!filteredData) return [];
//   return filteredData.map((user) => ({
//     id: user.id,
//     data: [
//       { data: user.id },
//       { data: user.name },
//       { data: user.date },
//       { data: user.completedat },
//       { data: user.branch },
//       // Department column missing? You can add:
//       // { data: user.department },
//       { data: user.priority },
//       {
//         data: (
//           <div className="flex">
//             <div className="w-[80px] rounded-full h-2 dark:bg-dark-600 bg-gray-200 dark:bg-gray-700">
//               <div
//                 className="bg-red-700 h-2 rounded-full transition-all duration-500"
//                 style={{ width: `${user.progress}%` }}
//               ></div>
//             </div>
//             <div>
//               <span className="text-red-700 ml-1">{user.progress} %</span>
//             </div>
//           </div>
//         ),
//       },
//       {
//         data: (
//           <Link to="/project_tasklist">
//             <button className="bg-red-400/25 dark:bg-red-700/15 px-4 py-2 dark:text-red-200 text-red-700 rounded-sm">
//               View
//             </button>
//           </Link>
//         ),
//       },
//     ],
//   }));
// };


//   const handleOnExport = () => {
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(sheetData);
//     XLSX.utils.book_append_sheet(wb, ws, "Almino");
//     XLSX.writeFile(wb, "EmployeeList.xlsx");
//   };

//   return (
//     <>
//       <div className="flex flex-col min-h-screen">
//         <div className="p-4 flex-grow">
//           <div className="flex items-end justify-end">
//             <button
//               onClick={handleOnExport}
//               className="text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5 text-center mr-5 mb-5 flex items-center"
//             >
//               <FileDown />
//               Export Excel
//             </button>
//             {/* <button
//               onClick={() => setShowModal(true)}
//               className="text-white bg-red-700 focus:outline-non font-medium text-sm rounded-lg px-9 py-2.5 text-center mr-5 mb-5 flex items-center"
//             >
//               Add Milestone
//             </button> */}
//           </div>

//           <div className="flex justify-between">
//           {/*  <Dropdown
//               options={filterOptions}
//               selectedValue={selectedFilter}
//               onSelect={setSelectedFilter}
//               placeholder="Filter By"
//               className="w-[200px]"
//             />
//             <Dropdown
//               options={statusOptions}
//               selectedValue={selectStatus}
//               onSelect={setSelectStatus}
//               placeholder="Payment Status"
//               className="w-[200px]"
//             />*/}

// <div className="flex flex-col space-y-1">

// <Dropdown
//     options={memberOptions}
//     selectedValue={selectedMember}
//     onSelect={setSelectedMember}
//     placeholder="Filter by Member"
//     className="w-[200px]"
//   />
// </div>
//   {/* Date Filter (you can use a native input for simplicity or a date picker) */}
//     <label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//     Select Start Date
//   </label>

//  <div className="flex flex-col space-y-1">
  

//   <input
//     type="date"
//     value={selectedDate}
//     onChange={(e) => setSelectedDate(e.target.value)}
//     className="px-4 py-2 border rounded-md text-sm bg-white dark:bg-dark-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"  
//   />
// </div>

// <label htmlFor="endDate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
//     Select End Date
//   </label>
// <div className="flex flex-col space-y-2">
  
    

//   <input
//     type="date"
//     value={selectedendDate}
//     onChange={(e) => setSelectedendDate(e.target.value)}
//     className="px-4 py-2 border rounded-md text-sm bg-white dark:bg-dark-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"  
//   />
// </div>
//             {/*<Dropdown
//               options={filterOptions}
//               selectedValue={selectedFilter}
//               onSelect={setSelectedFilter}
//               placeholder="Sort by"
//               className="w-[200px]"
//             />*/}
//             <SearchInput
//               value={searchTerm}

//               onChange={setSearchTerm}
//               placeholder="Search users..."
//             />
//           </div>

//           <DataTable thead={thead} tbody={tbody} isSearch />
//           <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
//             <CustomPagination
//               total={100}
//               currentPage={currentPage}
//               defaultPageSize={10}
//               onChange={setCurrentPage}
//               paginationLabel="employees"
//               isScroll={true}
//             />
//           </div>
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

// export default ProjectTimesheet;



import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import moment from "moment";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Modal from "src/component/Modal";
import Dropdown from "src/component/DrapDown";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import AddSalaryForm from "~/routes/Employee/Salary/AddSalary";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";

const ProjectTimesheet = ({ projectData }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const [data, setData] = useState([]);
  const [sheetData, setSheetData] = useState([]);

  const [selectedMember, setSelectedMember] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedendDate, setSelectedendDate] = useState("");

  const token = useAuthStore((state) => state.accessToken);
  const project_code = projectData.project_code;

  // 📥 Fetch filtered data from backend
  const fetchTaskData = async () => {
    try {
      const params = { project_code };

      if (selectedDate) {
        params.start_date = moment(selectedDate).format("YYYY-MM-DD");
      }

      if (selectedendDate) {
        params.end_date = moment(selectedendDate).format("YYYY-MM-DD");
      }

      if (selectedMember) {
        params.staff_id = selectedMember;
      }

      const response = await apiClient.get(
        `/project/task/checkinout/read`,
        {
          params,
        }
      );

      const rawData = response.data?.data || [];

      const transformed = rawData.map((item) => ({
        id: `Task_${item.id}`,
        name: item.staff_name,
        staff_id: item.staff_id,
        date: moment(item.check_in).format("DD-MM-YYYY"),
        branch: item.task_title,
        department: item.milestone_title || "N/A",
        completedat: item.check_out
          ? moment(item.check_out).format("DD-MM-YYYY")
          : "Not Closed",
        priority:
          item.check_in && item.check_out
            ? moment
                .utc(moment(item.check_out).diff(moment(item.check_in)))
                .format("HH:mm:ss")
            : "00:00:00",
        progress: item.duration ? Math.min(item.duration * 10, 100) : 0,
      }));

      setData(transformed);
      setSheetData(transformed);
    } catch (error) {
      console.error("Failed to fetch task data:", error);
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, [selectedDate, selectedendDate, selectedMember, project_code]);

  // 🧠 Create dropdown options using staff_id and name
  const memberOptions = Array.from(
    new Map(data.map((item) => [item.staff_id, item])).values()
  ).map((item) => ({
    value: item.staff_id,
    label: item.name,
  }));

  // 🔍 Apply only search filtering here
  const filteredData = data.filter((item) => {
    return searchTerm
      ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
  });

  const thead = () => [
    { data: "Task Id" },
    { data: "Member Name" },
    { data: "Checked In" },
    { data: "Checked Out" },
    { data: "Task Name" },
    { data: "Duration" },
    { data: "Hours" },
    // { data: "View" },
  ];

  const tbody = () => {
    if (!filteredData) return [];
    return filteredData.map((user) => ({
      id: user.id,
      data: [
        { data: user.id },
        { data: user.name },
        { data: user.date },
        { data: user.completedat },
        { data: user.branch },
        { data: user.priority },
        {
          data: (
            <div className="flex">
              <div className="w-[80px] rounded-full h-2 bg-gray-200 dark:bg-gray-700">
                <div
                  className="bg-red-700 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${user.progress}%` }}
                ></div>
              </div>
              <div>
                <span className="text-red-700 ml-1">{user.progress} %</span>
              </div>
            </div>
          ),
        },
        // {
        //   data: (
        //     <Link to="/project_tasklist">
        //       <button className="bg-red-400/25 dark:bg-red-700/15 px-4 py-2 dark:text-red-200 text-red-700 rounded-sm">
        //         View
        //       </button>
        //     </Link>
        //   ),
        // },
      ],
    }));
  };

  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "BRANDSPYRE");
    XLSX.writeFile(wb, "EmployeeList.xlsx");
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex items-end justify-end">
            <button
              onClick={handleOnExport}
              className="text-gray-400 bg-white font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-2.5 text-center mr-5 mb-5 flex items-center"
            >
              <FileDown />
              Export Excel
            </button>
          </div>

          <div className="flex gap-4 flex-wrap mb-4">
            <Dropdown
              options={memberOptions}
              selectedValue={selectedMember}
              onSelect={setSelectedMember}
              placeholder="Filter by Member"
              className="w-[200px]"
            />

            <div className="flex gap-4 flex-wrap mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-md text-sm bg-white dark:bg-dark-900 dark:border-gray-600"
              />
            </div>

            <div className="flex gap-4 flex-wrap mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <input
                type="date"
                value={selectedendDate}
                onChange={(e) => setSelectedendDate(e.target.value)}
                className="px-4 py-2 border rounded-md text-sm bg-white dark:bg-dark-900 dark:border-gray-600"
              />
            </div>

            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search users..."
            />
          </div>

          {filteredData.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">No records found.</p>
          ) : (
            <DataTable thead={thead} tbody={tbody} isSearch />
          )}

          <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <CustomPagination
              total={filteredData.length}
              currentPage={currentPage}
              defaultPageSize={10}
              onChange={setCurrentPage}
              paginationLabel="employees"
              isScroll={true}
            />
          </div>
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

export default ProjectTimesheet;


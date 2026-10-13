// import { CalendarCheck2, CalendarClock, Eye, LogOut } from "lucide-react";
// import userProfiles from "../../../public/user.avif";
// import PaymentProgressCard from "src/component/graphComponents/ProgressCard";
// import { useNavigate } from "react-router";
// import Modal from "src/component/Modal";
// import AddSalaryForm from "../Employee/Salary/AddSalary";
// import { useEffect, useState } from "react";
// import DataTable from "src/component/DataTable";
// import CustomPagination from "src/component/CustomPagination";
// import SearchInput from "src/component/SearchInput";
// import Dropdown from "src/component/DrapDown";
// import { Dot, FileDown } from "lucide-react";
// import * as XLSX from "xlsx";
// import { Link } from "react-router";
// import MomViewPage from "./MomViewPage";


// // import { useEffect, useState } from "react";
// import { apiClient } from "src/services/apiClient";

// import { useAuthStore } from "src/stores/authStore";
// import useBranchStore from "../../../src/stores/useBranchStore";


// interface MeetingData {
//   id: string;
//   date: string;
//   name: string;
//   branch: string;
//   priority: string;
//   progress: string;
//   lastdate: string;
// }

// const ClientMom = () => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedFilter, setSelectedFilter] = useState("");
//   const [sheetData, setSheetData] = useState([]);
//   const [selectStatus, setSelectStatus] = useState("");
//   const [activeTab, setActiveTab] = useState("salaryList");
//       const [meetings, setMeetings] = useState<MeetingData[]>([]);
//         const [loading, setLoading] = useState(true);
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


//   //   const token = useAuthStore((state) => state.accessToken);
//   // useEffect(() => {
//   //   const fetchMeetings = async () => {
//   //     try {
//   //       // const token = localStorage.getItem("authToken"); // ?? make sure your login saves this

//   //       const res = await apiClient.get(
//   //         "http://localhost:3000/api/doc_meet/read?comm_type=meeting",
//   //         {
//   //           headers: {
//   //             Authorization: `Bearer ${token}`, // ?? add bearer token
//   //           },
//   //         }
//   //       );

//   //       const apiData = res.data.data || [];

//   //       const transformed: MeetingData[] = apiData.map((item: any) => ({
//   //         id: `ASC_${item.meet_id}`,
//   //         date: item.title || "No Title",
//   //         name: item.notes || "-",
//   //         branch: item.branchcode || "-",
//   //         priority: item.category || "-",
//   //         progress: item.field || "-",
//   //         lastdate: new Date(item.end_date_time).toLocaleDateString("en-GB"),
//   //       }));

//   //       setMeetings(transformed);
//   //     } catch (err) {
//   //       console.error("Error fetching meetings:", err);
//   //       setMeetings([]);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };

//   //   fetchMeetings();
//   // }, []);

//   // if (loading) return <p>Loading meetings...</p>;





//   const data = [
//     {
//       id: "ASC_12",
//       date: "Agenda_1",
//       name: "ABC 1",
//       branch: "TL",
//       priority: "Employee",
//       progress: "TRACK-1",
//       lastdate: "25-05-2025",
//     },
//     {
//       id: "ASC_13",
//       date: "Agenda_2",
//       name: "ABC 2",
//       branch: "TL",
//       priority: "Employee",
//       progress: "TRACK-2",
//       lastdate: "25-05-2025",
//     },
//   ];

//   const getData = () => {
//     return data;
//   };

//   useEffect(() => {
//     setSheetData(getData());
//   }, []);

//   const thead = () => [
//     { meetings: "MeetId" },
//     { meetings: "Agenda" },
//     { meetings: "Consultant" },
//     { meetings: "OrgBy" },
//     { meetings: "Attendees" },
//     { meetings: "Summary" },
//     { meetings: "Last Meet" },
//     { meetings: "view" },
//   ];


//       <tbody>
//           {meetings.map((m) => (
//             <tr key={m.id}>
//               <td className="border p-2">{m.id}</td>
//               <td className="border p-2">{m.date}</td>
//               <td className="border p-2">{m.name}</td>
//               <td className="border p-2">{m.branch}</td>
//               <td className="border p-2">{m.priority}</td>
//               <td className="border p-2">{m.progress}</td>
//               <td className="border p-2">{m.lastdate}</td>
//             </tr>
//           ))}
//         </tbody>


//   // const tbody = () => {
//   //   if (!meetings) return [];
//   //   return meetings.map((user) => ({
//   //     id: user.id,
//   //     data: [
//   //       { data: user.id },
//   //       { data: user.name },
//   //       { data: user.date },
//   //       { data: user.branch },
//   //       { data: user.priority },
//   //       {
//   //         data: user.progress,
//   //       },
//   //       { data: user.lastdate },
//   //       {
//   //         data: (
//   //             <button className="bg-blue-400/25 text-xs dark:bg-blue-700/15 px-2 py-1 dark:text-blue-200 text-blue-700 rounded-2xl" onClick={()=>setShowModal(true)}>
//   //               <Eye/>
//   //             </button>
//   //         ),
//   //       },
//   //     ],
//   //   }));
//   // };

//   const handleOnExport = () => {
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(sheetData);
//     XLSX.utils.book_append_sheet(wb, ws, "Almino");
//     XLSX.writeFile(wb, "EmployeeList.xlsx");
//   };
//   const Project = {
//     status: "completed",
//     progress: 70,
//   };
//   const navigate = useNavigate();
//   const handleGoBack = () => {
//     navigate(-1); 
//   };

//   return (
//     <>
//      <div className="text-red-600 text-2xl font-bold mt-5">Client MOM</div>
//       <div className="flex justify-between">
//         {" "}
       
//      <div className="w-full mt-5">
//           <div className="flex flex-col">
//             <div className="p-4 flex-grow">
//               <div className="flex items-end justify-end">
//                 <button
//                   onClick={handleOnExport}
//                   className="text-gray-400 bg-white focus:outline-non font-medium text-xs rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-1 text-center mr-5 mb-5 flex items-center"
//                 >
//                   <FileDown />
//                   Export Excel
//                 </button>
            
//               </div>

//               <div className="flex justify-between">
//                 <Dropdown
//                   options={filterOptions}
//                   selectedValue={selectedFilter}
//                   onSelect={setSelectedFilter}
//                   placeholder="Filter By"
//                   className="w-[200px]"
//                 />
//                 <Dropdown
//                   options={statusOptions}
//                   selectedValue={selectStatus}
//                   onSelect={setSelectStatus}
//                   placeholder="Payment Status"
//                   className="w-[200px]"
//                 />
//                 <Dropdown
//                   options={filterOptions}
//                   selectedValue={selectedFilter}
//                   onSelect={setSelectedFilter}
//                   placeholder="Sort by"
//                   className="w-[200px]"
//                 />
//                 <SearchInput
//                   value={searchTerm}
//                   onChange={setSearchTerm}
//                   placeholder="Search users..."
//                 />
//               </div>

//              <DataTable
//   thead={thead}
  
// />

//               <div className=" bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 mt-10">
//                 <CustomPagination
//                   total={100}
//                   currentPage={currentPage}
//                   defaultPageSize={10}
//                   onChange={setCurrentPage}
//                   paginationLabel="employees"
//                   isScroll={true}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>
     
//       </div>
      
//       <Modal
//         isVisible={showModal}
//         className="w-[200px]"
//         onClose={() => setShowModal(false)}
      
//       >
//         <MomViewPage />
//       </Modal>
    
//    </>
//   );
// };
// export default ClientMom;





import { useEffect, useState ,useMemo} from "react";
import { apiClient } from "src/services/apiClient";

import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "../../../src/stores/useBranchStore";
// import { useLocation } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, Pencil } from "lucide-react"; // ?? icons
import { BASE_URL } from "~/constants/api";
interface MeetingData {
  id: string;
  date: string;
  name: string;
  branch: string;
  priority: string;
  progress: string;
  lastdate: string;
}

export default function ClientMom() {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [loading, setLoading] = useState(true);
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const navigate = useNavigate(); 
  const client_code = queryParams.get("client_code");

  const token = useAuthStore((state) => state.accessToken);


  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // ? Show 5 rows per page


 const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  // Sorting handler
  const handleSort = (column: string) => {
    setSortConfig((prev) => {
      if (prev?.key === column) {
        return { key: column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key: column, direction: "asc" };
    });
  };

  // Apply filters + sorting
  const filteredMeetings = useMemo(() => {
    let data = [...meetings];

    // Filtering
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        data = data.filter((item) =>
          item[key as keyof Meeting]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Sorting
    // if (sortConfig) {
    //   data.sort((a, b) => {
    //     const aValue = a[sortConfig.key as keyof Meeting];
    //     const bValue = b[sortConfig.key as keyof Meeting];
    //     if (aValue! < bValue!) return sortConfig.direction === "asc" ? -1 : 1;
    //     if (aValue! > bValue!) return sortConfig.direction === "asc" ? 1 : -1;
    //     return 0;
    //   });
    // }

if (sortConfig) {
  data.sort((a, b) => {
    const aValue = a[sortConfig.key as keyof Meeting];
    const bValue = b[sortConfig.key as keyof Meeting];

    // ? Special case for date sorting (DD/MM/YYYY)
    if (sortConfig.key === "lastdate") {
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day); // month - 1 because JS months are 0-based
      };

      const aDate = parseDate(aValue as string);
      const bDate = parseDate(bValue as string);

      if (aDate < bDate) return sortConfig.direction === "asc" ? -1 : 1;
      if (aDate > bDate) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }

    // Default string/number sort
    if (aValue! < bValue!) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue! > bValue!) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}



    return data;
  }, [meetings, filters, sortConfig]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        // const token = localStorage.getItem("authToken"); // ?? make sure your login saves this

        const res = await apiClient.get(
           `/getmeetingdetails?comm_type=meeting&client_code=${encodeURIComponent(client_code)}`
,
          {
            headers: {
              Authorization: `Bearer ${token}`, // ?? add bearer token
            },
          }
        );

        const apiData = res.data.data || [];

        const transformed: MeetingData[] = apiData.map((item: any) => ({
          id: `ASC_${item.meet_id}`,
          title: item.title || "No Title",
          name: item.notes || "-",
          organized_by: item.organizer_firstname || "-",
          status: item.status || "-",
          // lastdate: new Date(item.end_date_time).toLocaleDateString("en-GB"),
          lastdate: item.start_date_time
  ? new Date(item.start_date_time).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  : "",
        }));

        setMeetings(transformed);
      } catch (err) {
        console.error("Error fetching meetings:", err);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  if (loading) return <p>Loading meetings...</p>;


  // ?? Handlers
const handleView = (id: string) => {
  // navigate(`/meeting_view/${id}`);

  const numericId = id.replace("ASC_", "");
  navigate(`/meeting_view/${numericId}`);
};


  const handleEdit = (id: string) => {
      const numericIds = id.replace("ASC_", "");
    navigate(`/meetings/${numericIds}`); // route to edit form
  };

  const totalPages = Math.ceil(filteredMeetings.length / pageSize);
  const paginatedData = filteredMeetings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Meeting List</h2>

 {/*<button
                  // onClick={() => setShowModal(true)}
                  className="text-white text-xs bg-red-700 focus:outline-non font-medium rounded px-3 py-2.5 text-center mr-5 mb-5 flex items-center"
                >
                  + Add MOM
                </button>*/}
     <table className="table-auto border-collapse border border-gray-300 w-full">
      <thead>
        <tr className="bg-red-600 text-white">
          <th className="border p-2 cursor-pointer" onClick={() => handleSort("id")}>ID</th>
          <th className="border p-2 cursor-pointer" onClick={() => handleSort("title")}>Meeting Title</th>
          <th className="border p-2 cursor-pointer" onClick={() => handleSort("organized_by")}>Organized By</th>
          <th className="border p-2 cursor-pointer" onClick={() => handleSort("status")}>Status</th>
          <th className="border p-2 cursor-pointer" onClick={() => handleSort("lastdate")}>Meeting Date</th>
          <th className="border p-2">Actions</th>
        </tr>
        <tr className="bg-red-100">
          <th className="border p-1">
            <input
              className="w-full p-1 text-sm border rounded"
              placeholder="Search ID"
              onChange={(e) => handleFilterChange("id", e.target.value)}
            />
          </th>
          <th className="border p-1">
            <input
              className="w-full p-1 text-sm border rounded"
              placeholder="Search Title"
              onChange={(e) => handleFilterChange("title", e.target.value)}
            />
          </th>
          <th className="border p-1">
            <input
              className="w-full p-1 text-sm border rounded"
              placeholder="Search Organizer"
              onChange={(e) => handleFilterChange("organized_by", e.target.value)}
            />
          </th>
          <th className="border p-1">
            <input
              className="w-full p-1 text-sm border rounded"
              placeholder="Search Status"
              onChange={(e) => handleFilterChange("status", e.target.value)}
            />
          </th>
          <th className="border p-1">
            <input
              className="w-full p-1 text-sm border rounded"
              placeholder="Search Date"
              onChange={(e) => handleFilterChange("lastdate", e.target.value)}
            />
          </th>
          <th className="border p-1"></th>
        </tr>
      </thead>
<tbody>
          {paginatedData.map((m, index) => (
            <tr key={`${m.id}_${index}`} className="bg-white text-black hover:bg-gray-100" onDoubleClick={() => handleView(m.id)}>
              <td className="border p-2">{m.id}</td>
              <td className="border p-2">{m.title}</td>
              <td className="border p-2">{m.organized_by}</td>
              <td className="border p-2">{m.status}</td>
              <td className="border p-2">{m.lastdate}</td>
              <td className="border p-2 flex gap-2 justify-center">
                <button
                  onClick={() => handleView(m.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleEdit(m.id)}
                  className="text-green-600 hover:text-green-800"
                >
                  <Pencil size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
    </table>
    <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

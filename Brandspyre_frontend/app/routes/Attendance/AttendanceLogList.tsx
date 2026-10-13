import { useEffect, useState , useMemo} from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Dropdown from "src/component/DrapDown";
import {
  FileDown,
  Filter,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Clock1,
  SquarePen,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import {Link,  useNavigate } from "react-router-dom";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { useMediaQuery } from "~/routes/hooks/use-click-outside";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDate } from "../../../src/utils/dateUtils";
import Modal from "src/component/Modal";
import EditBranchForm from "../Branch/EditFormData";
import CreateAttendance from "./CreateAttendance";
import EditAttendanceModal from "./EditAttendanceModal"; // import above


const AttendanceLogList = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(true);

  const accesstoken = useAuthStore((state) => state.accessToken);
  // const permission = useAuthStore((state) => state.permissions);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userBranchCode = useAuthStore((state) => state.branchcode);
  const [showEditModal, setShowEditModal] = useState(false);
  // const role = permission[0]?.role || "employee";
  const [selectedLog, setSelectedLog] = useState(null);
  const {
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();


    // const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});

 const [filters, setFilters] = useState({});
 const [filteredLogs, setFilteredLogs] = useState<any[]>(attendanceLogs || []);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  const filteredBranchOptions = () => {
    if (role === "superadmin") {
      return branchCodeOptions;
    } else if (role === "hr") {
      return branchCodeOptions.filter(
        (branch) => branch.value === userBranchCode
      );
    }
    return [];
  };

  const [hydrated, setHydrated] = useState(false);



             // wait for Zustand persist to hydrate
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (useAuthStore.persist.hasHydrated()) {
        setHydrated(true);
      } else {
        const unsub = useAuthStore.persist.onHydrate(() => setHydrated(true));
        return () => unsub();
      }
    }
  }, []);


const token = accesstoken;

 const permission = useAuthStore((state) => state.permissions);
 const userStoreRole = useAuthStore((state) => state.role);
 const role = useMemo(() => {
   if (!Array.isArray(permission) || permission.length === 0) return userStoreRole || "employee";
   return permission[0]?.role || userStoreRole || "employee";
 }, [permission, userStoreRole]);
  useEffect(() => {
    if (hydrated && token && role) {
    if (role === "superadmin" || role === "hr") {
      fetchBranches(token);
    }
  }
  }, [hydrated,token, role]);

  useEffect(() => {
    if (hydrated && token&& role) {
    if (role === "hr") {
      setSelectedBranchCode(userBranchCode);
    }
  }
  }, [hydrated,token,role, userBranchCode]);

  useEffect(() => {
    if (hydrated && token && role) {
    if (role !== "hr" && role !== "superadmin") {
      setSelectedStaffId(staff_id);
    }
  }
  }, [hydrated,token,role, staff_id]);

  useEffect(() => {
    if (hydrated && token&& role) {
    const getStaffOptions = async () => {
      if (
        (role === "superadmin" && !selectedBranchCode) ||
        (role === "hr" && !userBranchCode)
      ) {
        setStaffOptions([]);
        return;
      }

      setLoading(true);
      try {
        const branchToUse = role === "hr" ? userBranchCode : selectedBranchCode;
        const url = `/users/dropdown?branchcode=${branchToUse}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((staff) => ({
            value: staff.staff_id,
            label: `${staff.firstname} ${staff.lastname} (${staff.staff_id})`,
          }));
          setStaffOptions(options);
        }
      } catch (error) {
        console.error("Error fetching staff list", error);
        notify.error("Failed to fetch staff");
      } finally {
        setLoading(false);
      }
    };

    if (role === "superadmin" || role === "hr") {
      getStaffOptions();
    }
  }
  }, [hydrated,selectedBranchCode, token, role, userBranchCode]);

  const checkTodayAttendance = async () => {
    if (role === "superadmin" || role === "hr") return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const url = `/users/attendance-log/read?staff_id=${staff_id}`;

      const response = await apiClient.get(url);
      console.log("responseee", response);
      if (response.data && response.data.data) {
        setTodayAttendance(response.data.data);
        setHasCheckedInToday(
          response.data.data.check_in && !response.data.data.check_out
        );
      } else {
        setTodayAttendance(null);
        setHasCheckedInToday(false);
      }
    } catch (error) {
      console.error("Error checking today's attendance", error);
      notify.error("Failed to check today's attendance");
    }
  };

  const handleCheckIn = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const timeString = now.toISOString();

      const checkInData = {
        staff_id: staff_id,
        attendance_date: today,
        check_in: timeString,
      };

      const checkinRes = await apiClient.post(
        `/users/attendance-log/create`,
        { userDatas: [checkInData] }
      );
      console.log("responseeee", checkinRes);

      setShowCheckModal(false);
      notify.success("Checked in successfully");
      await checkTodayAttendance();
      await fetchAttendanceLogs();
    } catch (error) {
      console.error("Error during check in", error);
      notify.error(error.response?.data?.message || error.response?.data?.error || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!todayAttendance) {
        notify.error("No check-in record found for today");
        return;
      }

      const now = new Date();
      const timeString = now.toISOString();

      const checkOutData = {
        id: todayAttendance._id || todayAttendance.id,
        staff_id: staff_id,
        check_out: timeString,
      };

      const checkoutRes = await apiClient.post(
        `/users/attendance-log/create`,
        { userDatas: [checkOutData] }
      );
      console.log("checkoutdataaa", checkoutRes);
      notify.success("Checked out successfully");
      await checkTodayAttendance();
      await fetchAttendanceLogs();
      setShowCheckModal(false);
    } catch (error) {
      console.error("Error during check out", error);
      notify.error(error.response?.data?.message || "Failed to check out");
    }
  };

  const fetchAttendanceLogs = async () => {
    setLoading(true);
    try {
      let url = `/users/attendance-log/read`;
      const params = new URLSearchParams();

      if (role === "superadmin") {
        if (selectedStaffId) params.append("staff_id", selectedStaffId);
      } else if (role === "hr") {
        if (selectedStaffId) params.append("staff_id", selectedStaffId);
      } else {
        params.append("staff_id", staff_id);
      }

      if (startDate) params.append("start_date", formatDate(startDate));
      if (endDate) params.append("end_date", formatDate(endDate));
      params.append("page", currentPage);
      params.append("limit", pageSize);
      params.append("sort", "-date"); 

      url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.data) {
        setAttendanceLogs(response.data.data || []);
        setTotalItem(response.data.totalDocuments || 0);
      }
    } catch (error) {
      console.error("Error fetching attendance logs", error);
      notify.error("Failed to fetch attendance logs");
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };
  const handleEditSuccess = () => {
    setShowEditModal(false);
    notify.success("Branch updated successfully!");
  };
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBranchCodeChange = (value) => {
    setSelectedBranchCode(value);
    setSelectedStaffId("");
    setCurrentPage(1);
  };

  const handleStaffChange = (value) => {
    setSelectedStaffId(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const handleOnExport = () => {
    if (!attendanceLogs || attendanceLogs.length === 0) {
      notify.error("No data to export");
      return;
    }

    const dataToExport = attendanceLogs.map((log) => ({
      "Staff ID": log.staff_id,
      "Branch Code": log.branchcode,
      Date: log.date,
      "Check In": log.check_in,
      "Check Out": log.check_out || "N/A",
      "Total Hours": log.total_hours || "N/A",
      Status: log.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceLogs");
    XLSX.writeFile(wb, "AttendanceLogs.xlsx");
  };

  useEffect(() => {
    if (hydrated && token&& role) {
    fetchAttendanceLogs();
    if (role !== "superadmin" && role !== "hr") {
      checkTodayAttendance();
    }
  }
  }, [
    hydrated,
    token,
    currentPage,
    pageSize,
    selectedStaffId,
    startDate,
    endDate,
    role,
    userBranchCode,
  ]);

  const handleEditAttendance = (log) => {
    setSelectedLog(log);
    setShowEditModal(true);
  };

const formatDurationHHMMStyle = (totalSeconds: number) => {
  if (!totalSeconds || isNaN(totalSeconds)) return "00.00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${String(hours).padStart(2, "0")}.${String(minutes).padStart(2, "0")}`;
};


const columns = [
  { key: "staff_id", label: "Staff ID", sortable: true, filterable: true },
  { key: "staff_name", label: "Staff Name", sortable: true, filterable: true },
  { key: "create_datetime", label: "Date", sortable: true, filterable: true },
  { key: "check_in", label: "Check In", sortable: true },
  { key: "check_out", label: "Check Out", sortable: true },
  { key: "duration", label: "Total Hours", sortable: true },
  { key: "status", label: "Status", sortable: true, filterable: true },
  { key: "action", label: "Action" },
];

// 🔹 Table headers
// const thead = () => [
//   { data: "Staff ID" },
//   { data: "Staff Name" },
//   { data: "Date" },
//   { data: "Check In" },
//   { data: "Check Out" },
//   { data: "Total Hours" },
//   { data: "Status" },
//   { data: "Action" },
// ];



// ✅ Sorting function
const handleSort = (key: string) => {
  let direction: "asc" | "desc" | null = "asc";

  if (sortConfig.key === key && sortConfig.direction === "asc") {
    direction = "desc";
  } else if (sortConfig.key === key && sortConfig.direction === "desc") {
    direction = null; // clear sort on third click
  }

  setSortConfig({ key, direction });
};

// ✅ Filtering function
const handleFilterChange = (key: string, value: string) => {
  setColumnFilters((prev) => ({
    ...prev,
    [key]: value,
  }));
};

// ✅ Apply sorting + filtering whenever logs, filters, or sortConfig changes
useEffect(() => {
  let data = [...attendanceLogs];

  // 🔹 Filtering
  Object.entries(columnFilters).forEach(([key, value]) => {
    if (value) {
      data = data.filter((log) =>
        String(log[key] || "").toLowerCase().includes(value.toLowerCase())
      );
    }
  });

  // 🔹 Sorting
  if (sortConfig.key && sortConfig.direction) {
    data.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  setFilteredLogs(data);
}, [attendanceLogs, columnFilters, sortConfig]);

const thead = () =>
    columns.map((col) => ({
      data: (
        <div className="flex flex-col">
          <span
            className={`cursor-pointer ${col.className || ""}`}
            onClick={() => col.sortable !== false && handleSort(col.key)}
          >
            {col.label}
            {sortConfig.key === col.key &&
              (sortConfig.direction === "asc" ? " 🔼" : " 🔽")}
          </span>
          {col.filterable !== false && (
            <input
              type="text"
              placeholder={`Search ${col.label}`}
              value={columnFilters[col.key] || ""}
              onChange={(e) => handleFilterChange(col.key, e.target.value)}
              className="w-full text-xs border rounded px-1 py-0.5 mt-1"
            />
          )}
        </div>
      ),
      className: col.className,
    }));






// ✅ Use `filteredLogs` instead of `attendanceLogs` in tbody
const tbody = () => {
  if (!filteredLogs) return [];

  return filteredLogs.map((log) => ({
    id: log.id,
    data: [
      { data: log.staff_id },
      { data: log.staff_name },
      { data: new Date(log.create_datetime).toLocaleDateString() },
      // { data: formatDate(log.check_in) || "N/A" },
      // { data: formatDate(log.check_out) || "N/A" },
      { data: log.check_in ? new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A" },
{ data: log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A" },

      { data: formatDurationHHMMStyle(log.duration) },
      {
        data: (
          <div
            className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
              log.status === "checkin"
                ? "bg-green-100 text-green-800"
                : log.status === "checkout"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {log.status === "present" ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : log.status === "absent" ? (
              <XCircle className="w-3 h-3 mr-1" />
            ) : (
              <Clock className="w-3 h-3 mr-1" />
            )}
            {log.status}
          </div>
        ),
      },
      {
        data: (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
              onClick={() => handleEditAttendance(log)}
              title="Edit"
            >
              <SquarePen size={18} />
            </button>
          </div>
        ),
        className: "action-cell",
      },
    ],
  }));
};
// 🔹 Filtering function
const applyFilters = (data, filters) => {
  return data.filter((log) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true; // no filter applied
      return String(log[key]).toLowerCase().includes(String(value).toLowerCase());
    })
  );
};

// 🔹 Sorting function
const applySorting = (data, sortConfig) => {
  if (!sortConfig.key) return data;

  return [...data].sort((a, b) => {
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
};


const processedData = useMemo(() => {
    let filtered = applyFilters(attendanceLogs || [], filters);
    let sorted = applySorting(filtered, sortConfig);
    return sorted;
  }, [attendanceLogs, filters, sortConfig]);

  // 🔹 Table body
  // const tbody = () => {
  //   if (!processedData) return [];

  //   return processedData.map((log) => ({
  //     id: log.id,
  //     data: [
  //       { data: log.staff_id },
  //       { data: log.staff_name },
  //       { data: new Date(log.create_datetime).toLocaleDateString() },
  //       { data: formatDate(log.check_in) || "N/A" },
  //       { data: formatDate(log.check_out) || "N/A" },
  //       { data: formatDurationHHMMStyle(log.duration) },
  //       {
  //         data: (
  //           <div
  //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
  //               log.status === "checkin"
  //                 ? "bg-green-100 text-green-800"
  //                 : log.status === "checkout"
  //                 ? "bg-red-100 text-red-800"
  //                 : "bg-yellow-100 text-yellow-800"
  //             }`}
  //           >
  //             {log.status === "present" ? (
  //               <CheckCircle className="w-3 h-3 mr-1" />
  //             ) : log.status === "absent" ? (
  //               <XCircle className="w-3 h-3 mr-1" />
  //             ) : (
  //               <Clock className="w-3 h-3 mr-1" />
  //             )}
  //             {log.status}
  //           </div>
  //         ),
  //       },
  //       {
  //         data: (
  //           <div className="flex flex-wrap justify-center gap-2">
  //             <button
  //               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
  //               onClick={() => handleEditAttendance(log)}
  //               title="Edit"
  //             >
  //               <SquarePen size={18} />
  //             </button>
  //           </div>
  //         ),
  //         className: "action-cell",
  //       },
  //     ],
  //   }));
  // };







  // 🔹 Column configuration for sorting + filtering
// const columns = [
//   { key: "staff_id", label: "Staff ID", sortable: true, filterable: true },
//   { key: "staff_name", label: "Staff Name", sortable: true, filterable: true },
//   { key: "create_datetime", label: "Date", sortable: true, filterable: true },
//   { key: "check_in", label: "Check In", sortable: true },
//   { key: "check_out", label: "Check Out", sortable: true },
//   { key: "duration", label: "Total Hours", sortable: true },
//   { key: "status", label: "Status", sortable: true, filterable: true },
//   { key: "action", label: "Action" }, // not sortable/filterable
// ];

// // 🔹 Table headers (display only)
// const thead = () => [
//   { data: "Staff ID" },
//   { data: "Staff Name" },
//   { data: "Date" },
//   { data: "Check In" },
//   { data: "Check Out" },
//   { data: "Total Hours" },
//   { data: "Status" },
//   { data: "Action" },
// ];

// // 🔹 Table body (data rendering)
// const tbody = () => {
//   if (!attendanceLogs) return [];

//   return attendanceLogs.map((log) => ({
//     id: log.id,
//     data: [
//       { data: log.staff_id },
//       { data: log.staff_name },
//       { data: new Date(log.create_datetime).toLocaleDateString() },
//       { data: formatDate(log.check_in) || "N/A" },
//       { data: formatDate(log.check_out) || "N/A" },
//       { data: formatDurationHHMMStyle(log.duration) },

//       {
//         data: (
//           <div
//             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
//               log.status === "checkin"
//                 ? "bg-green-100 text-green-800"
//                 : log.status === "checkout"
//                 ? "bg-red-100 text-red-800"
//                 : "bg-yellow-100 text-yellow-800"
//             }`}
//           >
//             {log.status === "present" ? (
//               <CheckCircle className="w-3 h-3 mr-1" />
//             ) : log.status === "absent" ? (
//               <XCircle className="w-3 h-3 mr-1" />
//             ) : (
//               <Clock className="w-3 h-3 mr-1" />
//             )}
//             {log.status}
//           </div>
//         ),
//       },

//       {
//         data: (
//           <div className="flex flex-wrap justify-center gap-2">
//             <button
//               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
//               onClick={() => handleEditAttendance(log)}
//               title="Edit"
//             >
//               <SquarePen size={18} />
//             </button>
//           </div>
//         ),
//         className: "action-cell",
//       },
//     ],
//   }));
// };








  // const thead = () => [
  //   { data: "Staff ID" },
  //   { data: "Staff Name" },
  //   { data: "Date" },
  //   { data: "Check In" },
  //   { data: "Check Out" },
  //   { data: "Total Hours" },
  //   { data: "Status" },
  //   { data: "Action" },
  // ];

  // const tbody = () => {
  //   if (!attendanceLogs) return [];

  //   return attendanceLogs.map((log) => ({
  //     id: log.id,
  //     data: [
  //       { data: log.staff_id },
  //       { data: log.staff_name },
  //       { data: new Date(log.create_datetime).toLocaleDateString() },
  //       { data: formatDate(log.check_in) || "N/A" },
  //       { data: formatDate(log.check_out) || "N/A" },
  //       { data: formatDurationHHMMStyle(log.duration) },

  //       {
  //         data: (
  //           <div
  //             className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
  //               log.status === "checkin"
  //                 ? "bg-green-100 text-green-800"
  //                 : log.status === "checkout"
  //                   ? "bg-red-100 text-red-800"
  //                   : "bg-yellow-100 text-yellow-800"
  //             }`}
  //           >
  //             {log.status === "present" ? (
  //               <CheckCircle className="w-3 h-3 mr-1" />
  //             ) : log.status === "absent" ? (
  //               <XCircle className="w-3 h-3 mr-1" />
  //             ) : (
  //               <Clock className="w-3 h-3 mr-1" />
  //             )}
  //             {log.status}
  //           </div>
  //         ),
  //       },
  //       {
  //         data: (
  //           <div className="flex flex-wrap justify-center gap-2">
        
  //             <button
  //               className="p-1 text-[var(--color-primary)] rounded hover:text-gray-500 dark:hover:text-gray-300"
  //               onClick={() => handleEditAttendance(log)}
  //               title="Edit"
  //             >
  //               <SquarePen size={18} />
  //             </button>
             
  //           </div>
  //         ),
  //         className: "action-cell",
  //       },
  //     ],
  //   }));
  // };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          {/* ACTION & FILTER BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              {role === "superadmin" && (
                <Dropdown
                  options={filteredBranchOptions()}
                  selectedValue={selectedBranchCode}
                  onSelect={handleBranchCodeChange}
                  placeholder="Select Branch"
                  className="w-[200px]"
                  isLoading={isStoreLoading}
                />
              )}

              {(role === "superadmin" || role === "hr") && (
                <Dropdown
                  options={staffOptions}
                  selectedValue={selectedStaffId}
                  onSelect={handleStaffChange}
                  placeholder="Select Staff"
                  className="w-[200px]"
                  disabled={role === "hr" ? false : !selectedBranchCode}
                  isLoading={loading}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOnExport}
                className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                disabled={attendanceLogs.length === 0}
              >
                <FileDown size={14} />
                Export Excel
              </button>

              {role !== "superadmin" && role !== "hr" && (
                <>
                  <button
                    onClick={() => {
                      setIsCheckingIn(true);
                      setShowCheckModal(true);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 ${
                      hasCheckedInToday
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                    disabled={hasCheckedInToday}
                  >
                    <Clock1 size={14} />
                    Check In
                  </button>
                  <button
                    onClick={() => {
                      setIsCheckingIn(false);
                      setShowCheckModal(true);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 ${
                      !hasCheckedInToday
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    <Clock1 size={14} />
                    Check Out
                  </button>
                </>
              )}
            </div>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          <div className="overflow-x-auto">
            <DataTable
              thead={thead}
              tbody={tbody}
              responsive={true}
              className="min-w-full"
            />
          </div>

          <div className="bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <CustomPagination
              total={totalItem}
              currentPage={currentPage}
              defaultPageSize={pageSize}
              onChange={handlePageChange}
              paginationLabel="attendance logs"
              isScroll={true}
            />
          </div>
        </div>
      </div>



        // inside return()
<EditAttendanceModal
  isVisible={showEditModal}
  onClose={() => setShowEditModal(false)}
  log={selectedLog}
  token={token}
  onSuccess={async () => {
    setShowEditModal(false);
    await fetchAttendanceLogs();
  }}
/>

      <Modal
        isVisible={showCheckModal}
        className="w-full md:w-[400px]"
        onClose={() => setShowCheckModal(false)}
        title={
          isCheckingIn ? "Check In Confirmation" : "Check Out Confirmation"
        }
      >
        <div className="p-4">
          <p className="mb-4">
            {isCheckingIn
              ? "Are you sure you want to check in?"
              : "Are you sure you want to check out?"}
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowCheckModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={isCheckingIn ? handleCheckIn : handleCheckOut}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-red-800"
            >
              {isCheckingIn ? "Check In" : "Check Out"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AttendanceLogList;


import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import Dropdown from "src/component/DrapDown";
import { FileDown, SortAsc, SortDesc, Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { useMediaQuery } from "~/routes/hooks/use-click-outside";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "src/component/Modal";
import MomViewPage from "./Clients/MomViewPage";

const MomReport = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalItem, setTotalItem] = useState(0);
  const [error, setError] = useState(null);
  const [selectedBranchCode, setSelectedBranchCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedProjectCode, setSelectedProjectCode] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [meetingData, setMeetingData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [sortOrder, setSortOrder] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const token = useAuthStore((state) => state.accessToken);
  const permission = useAuthStore((state) => state.permissions);
  const userStoreRole = useAuthStore((state) => state.role);
  const staff_id = useAuthStore((state) => state.staff_id);
  const userBranchCode = useAuthStore((state) => state.branchcode);
  const role = (Array.isArray(permission) && permission.length > 0 ? permission[0]?.role : null) || userStoreRole || 'employee';

  const {
    branchCodeOptions,
    fetchBranches,
    isLoading: isStoreLoading,
  } = useBranchStore();

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 20, label: "20 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  const filteredBranchOptions = () => {
    if (role === 'superadmin') {
      return branchCodeOptions;
    }
    return [];
  };

  useEffect(() => {
    if (role === 'superadmin') {
      fetchBranches(token);
    }
  }, [token, role]);

  useEffect(() => {
    if (role !== 'superadmin') {
      setSelectedStaffId(staff_id);
      fetchMeetingData();
    }
  }, [role, staff_id]);

  useEffect(() => {
    const getStaffOptions = async () => {
      if (role !== 'superadmin' || !selectedBranchCode) {
        setStaffOptions([]);
        return;
      }
      
      setLoading(true);
      try {
        const url = `/users/read?branchcode=${selectedBranchCode}`;
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

    if (role === 'superadmin') {
      getStaffOptions();
    }
  }, [selectedBranchCode, token, role]);

  useEffect(() => {
    const getProjectOptions = async () => {
      const branchToUse = role === 'superadmin' ? selectedBranchCode : userBranchCode;
      
      if (!branchToUse) {
        setProjectOptions([]);
        return;
      }
      
      setLoading(true);
      try {
        const url = `/project/overview/dropdown?branchcode=${branchToUse}`;
        const response = await apiClient.get(url);

        if (response.data && response.data.data) {
          const options = response.data.data.map((project) => ({
            value: project.project_code,
            label: `${project.title} (${project.project_code})`,
          }));
          setProjectOptions(options);
        }
      } catch (error) {
        console.error("Error fetching project list", error);
        notify.error("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

  
    if (role === 'superadmin' ? selectedBranchCode : userBranchCode) {
      getProjectOptions();
    }
  }, [selectedBranchCode, token, role, userBranchCode]);

  const fetchMeetingData = async () => {
    const staffIdToUse = role !== 'superadmin' ? staff_id : selectedStaffId;
    
    if (!staffIdToUse && role !== 'superadmin') {
      return;
    }

    setLoading(true);
    try {
      let url = `/doc_meet/read?person_id=${encodeURIComponent(staffIdToUse)}&role=staff&comm_type=meeting`;
      
      if (selectedProjectCode) {
        url += `&project_code=${selectedProjectCode}`;
      }
      
      if (startDate && endDate) {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);
        url += `&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      }

      if (sortOrder) {
        url += `&dec=${sortOrder}`;
      }

      const response = await apiClient.get(url);

      if (response.data) {
        setMeetingData(response.data);
        setTotalItem(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching meeting data", error);
      notify.error("Failed to fetch meeting data");
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBranchCodeChange = (value) => {
    setSelectedBranchCode(value);
    setSelectedStaffId("");
    setSelectedProjectCode("");
    setCurrentPage(1);
  };

  const handleStaffChange = (value) => {
    setSelectedStaffId(value);
    setCurrentPage(1);
  };

  const handleProjectChange = (value) => {
    setSelectedProjectCode(value);
    setCurrentPage(1);
    fetchMeetingData(); 
  };

  const handlePageSizeChange = (value) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    fetchMeetingData();
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "" : "desc");
    fetchMeetingData(); 
  };

  const handleOnExport = () => {
    if (!meetingData?.data || meetingData.data.length === 0) {
      notify.error("No data to export");
      return;
    }

    const dataToExport = meetingData.data.map(meeting => ({
      "Meeting ID": meeting.meet_id,
      "Title": meeting.title,
      "Branch Code": meeting.branchcode,
      "Project Code": meeting.project_code || "N/A",
      "Start Date": new Date(meeting.start_date_time).toLocaleString(),
      "End Date": new Date(meeting.end_date_time).toLocaleString(),
      "Status": meeting.status,
      "Created By": meeting.createdby
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "MeetingReport");
    XLSX.writeFile(wb, "MeetingReport.xlsx");
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const meetingThead = () => [
    { data: "Meeting ID" },
    { data: "Title" },
    { data: "Branch" },
    { data: "Project" },
    { data: "Start Time" },
    { data: "End Time" },
    { data: "Status" },
    { data: "Actions" },
  ];

  const meetingTbody = () => {
    if (!meetingData?.data) return [];
    
    return meetingData.data.map((meeting) => ({
      id: meeting.meet_id,
      data: [
        { data: meeting.meet_id },
        { data: meeting.title },
        { data: meeting.branchcode },
        { data: meeting.project_code || "N/A" },
        { data: formatDateTime(meeting.start_date_time) },
        { data: formatDateTime(meeting.end_date_time) },
        {
          data: (
            <div
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${meeting.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-2 ${meeting.status === "active" ? "bg-green-800" : "bg-red-700"}`}
              ></span>
              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
            </div>
          ),
        },
        {
          data: (
            <button 
              className="bg-blue-400/25 text-xs dark:bg-blue-700/15 px-2 py-1 dark:text-blue-200 text-blue-700 rounded-2xl"
              onClick={() => {
                setSelectedMeeting(meeting);
                setShowModal(true);
              }}
            >
              <Eye size={16}/>
            </button>
          ),
        },
      ],
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-red-600 mb-5">MOM Report</h2>
          </div>
<div className="flex flex-col gap-4 mb-5">
            <div className={`grid grid-cols-1 ${role !== "superadmin" ? "md:grid-cols-2 lg:grid-cols-2 gap-3" : "md:grid-cols-4 lg:grid-cols-4 gap-20"}`}>
              {role === 'superadmin' && (
                <Dropdown
                  options={filteredBranchOptions()}
                  selectedValue={selectedBranchCode}
                  onSelect={handleBranchCodeChange}
                  placeholder="Select Branch"
                  className="w-[245px]"
                  isLoading={isStoreLoading}
                />
              )}
              
              {role === 'superadmin' && (
                <Dropdown
                  options={staffOptions}
                  selectedValue={selectedStaffId}
                  onSelect={handleStaffChange}
                  placeholder="Select Staff"
                  className="w-[245px]"
                  disabled={!selectedBranchCode}
                  isLoading={loading}
                />
              )}

              <Dropdown
                options={projectOptions}
                selectedValue={selectedProjectCode}
                onSelect={handleProjectChange}
                placeholder="Select Project"
                className="w-[245px]"
                disabled={role === 'superadmin' ? !selectedBranchCode : !userBranchCode}
                isLoading={loading}
              />

              <div className="w-[245px]">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={handleDateChange}
                  placeholderText="Select date range"
                  className="w-full p-2 border rounded h-[40px]"
                  isClearable={true}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center">
              <div className={`flex ${role !== "superadmin" ? "gap-91" : "gap-19"}`}>
                <button
                  onClick={toggleSortOrder}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect px-18 h-[40px] rounded-sm"
                >
                  {sortOrder === "desc" ? <SortDesc className="mr-1" /> : <SortAsc className="mr-1" />}
                  Sort {sortOrder === "desc" ? "Desc" : "Asc"}
                </button>
                
                <button
                  onClick={handleOnExport}
                  className="flex items-center justify-center text-gray-400 bg-white focus:outline-non font-medium text-sm rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-2 dark:bg-gray-800 dark:text-gray-300 py-2 w-[245px]"
                  disabled={!meetingData?.data}
                >
                  <FileDown className="mr-1" />
                  {!isMobile && "Export Excel"}
                </button>
              </div>
              
              {role === 'superadmin' && (
                <button
                  onClick={fetchMeetingData}
                  className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                  disabled={!selectedStaffId || loading}
                >
                  {loading ? "Loading..." : "Generate Report"}
                </button>
              )}
            </div>
          </div>

          {loading && <div className="text-center py-4">Loading...</div>}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}

          {meetingData?.data && (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  thead={meetingThead}
                  tbody={meetingTbody}
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
                  paginationLabel="meetings"
                  isScroll={true}
                />
              </div>
            </>
          )}

          {!loading && !meetingData && (
            <div className="text-center py-10 text-gray-500">
              {role !== 'superadmin' 
                ? "Loading your meeting data..."
                : (!selectedBranchCode
                    ? "Please select Branch to view available options"
                    : (!selectedStaffId
                        ? "Please select Staff"
                        : "Click 'Generate Report' to view data"))}
            </div>
          )}
        </div>
      </div>
      
      <Modal
        isVisible={showModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowModal(false)}
        title="Meeting Details"
      >
        <MomViewPage meeting={selectedMeeting} />
      </Modal>
    </>
  );
};

export default MomReport;
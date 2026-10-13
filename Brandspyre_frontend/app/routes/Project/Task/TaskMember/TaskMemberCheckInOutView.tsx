import {
  AlarmClockCheck,
  CalendarCheck2,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleCheckBig,
  Clock,
  LogOut,
  MessageSquareText,
  TimerOff,
  User,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { BASE_URL } from "~/constants/api";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import { notify } from "~/services/notificationService";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import { Dot } from "lucide-react";
import Modal from "src/component/Modal";
import TaskMemberMeetingForm from "./Meeting/TaskMemberMeetingForm";

const TaskMemberViewPage = () => {
  // State management
  const [memberData, setMemberData] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayBy, setDelayBy] = useState("member");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItem, setTotalItem] = useState(0);
  const accesstoken = useAuthStore((state) => state.accessToken);
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  
 const [hydrated, setHydrated] = useState(false);
  // Fetch member data
  const fetchMemberData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/project/task/members/read?participants_id=${id}`
      );
      setMemberData(response.data.data[0]);
      setTotalItem(response?.data?.totalDocuments);
      fetchTimeEntries();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      const response = await apiClient.get(
        `/project/task/checkinout/read?participants_id=${id}`
      );
      setTimeEntries(response.data.data);

      // Check if the user is currently checked in (last entry has no check_out)
      if (response.data.data.length > 0 && !response.data.data[0].check_out) {
        setIsCheckedIn(true);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };



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



  useEffect(() => {
    if (hydrated && token) {
    fetchMemberData();
  }
  }, [hydrated,token,id]);

  // Handle check in/out
  const handleCheckInOut = async (isCheckIn) => {
    try {
      await apiClient.post(
        `/project/task/checkinout/create`,
        { data: { participants_id: id } }
      );
      notify.success(
        isCheckIn ? "Checked in successfully!" : "Checked out successfully!"
      );
      fetchTimeEntries();
      setIsCheckedIn(isCheckIn);
    } catch (err) {
      notify.error(`Failed to ${isCheckIn ? "check in" : "check out"}`);
      console.error(err);
    }
  };

  // Handle task completion
  const handleTaskComplete = async () => {
    try {
      const data = {
        participants_id: id,
        status: "archived",
      };

      // If task is delayed, add delay info
      if (showCompleteForm) {
        data.delay_by = delayBy;
        data.delay_reason = delayReason;
      }

      await apiClient.post(
        `/project/task/checkinout/create`,
        { data }
      );

      notify.success("Task marked as completed!");
      fetchMemberData();
      setShowCompleteForm(false);
      setIsCheckedIn(false);
    } catch (err) {
      notify.error("Failed to complete task");
      console.error(err);
    }
  };

  // Format duration from minutes to HH:MM
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Table configuration for time entries
  const timeEntriesThead = () => [
    { data: "Date" },
    { data: "Check In" },
    { data: "Check Out" },
    { data: "Duration" },
  ];

  const timeEntriesTbody = () => {
    return timeEntries.map((entry) => ({
      id: entry.id,
      data: [
        { data: new Date(entry.check_in).toLocaleDateString() },
        { data: new Date(entry.check_in).toLocaleTimeString() },
        {
          data: entry.check_out
            ? new Date(entry.check_out).toLocaleTimeString()
            : "-",
        },
        { data: formatDuration(entry.duration) },
      ],
    }));
  };
  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Meeting and Document Created successfully!");
  };
  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!memberData) return <div className="p-4">No member data found</div>;

  return (
    <>
      <div className="flex justify-between">
<div className="p-4 text-red-700 mb-10">
          <div className="flex gap-5">
            <h1 className="text-2xl font-bold">Task Member Overview</h1>
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-3 mt-2 ${
                memberData.status === "archived"
                  ? "bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400"
                  : memberData.status === "drop"
                    ? "bg-red-100 text-red-800 dark:bg-red-800/25 dark:text-red-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/25 dark:text-yellow-400"
              }`}
            >
              <Dot />
              {memberData.status}
            </div>
          </div>
        </div>
        <div>
          <button
            className="text-gray-500 bg-gray-200 px-3 py-1 rounded-lg mt-6"
            onClick={() => navigate(-1)}
          >
            <LogOut className="inline rotate-180 text-gray-500 mr-3" />
            Go Back
          </button>
        </div>
      </div>

      <div className="w-full max-w-full mx-auto p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4">
        <h2 className="text-xl font-bold text-gray-600 dark:text-white">
          {memberData.staff_name}
        </h2>
            <div className="flex justify-end">
                  <button
                    onClick={() => setShowMeetingModal(true)}
                    className="flex items-center justify-center text-white bg-[var(--color-primary)] hover-effect dark:bg-red-800 focus:outline-non font-medium text-sm rounded-sm px-5 py-2.5"
                  >
                    {"New Meeting"} <MessageSquareText className="ml-2" size={15} />
                  </button>
                </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              <User className="inline mr-2" size={16} /> Staff ID:
            </span>{" "}
            {memberData.staff_id}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Project:
            </span>{" "}
            {memberData.project_title}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Milestone:
            </span>{" "}
            {memberData.milestone_title}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Task:
            </span>{" "}
            {memberData.task_title}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Sub Task:
            </span>{" "}
            {memberData.subtask_title}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Status:
            </span>{" "}
            {memberData.status}
          </div>
          {memberData.start_date && (
            <div>
              <span className="font-medium text-green-700 dark:text-gray-100">
                <CalendarCheck2 className="inline mr-2" size={16} /> Start Date:
              </span>{" "}
              {new Date(memberData.start_date).toLocaleDateString()}
            </div>
          )}
          {memberData.end_date && (
            <div>
              <span className="font-medium text-red-700 dark:text-gray-100">
                <CalendarClock className="inline mr-2" size={16} /> End Date:
              </span>{" "}
              {new Date(memberData.end_date).toLocaleDateString()}
            </div>
          )}
          <div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-100">
                Priority:
              </span>{" "}
              {memberData.task_priority}
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-100">
                Assigned By:
              </span>{" "}
              {memberData.handlername}
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Duration:
            </span>{" "}
            {memberData.task_duration
              ? formatDuration(memberData.task_duration)
              : "N/A"}
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-200 mt-4">
          <p>
            <span className="font-semibold">Task Description:</span>
            <br />
            {memberData.notes}
          </p>
        </div>
        {/* Check In/Out and Complete Buttons */}

        {['verified-closed', 'archived', 'drop'].includes(memberData.status) ? (
          <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-500 dark:text-gray-400 font-medium border border-dashed border-gray-200 dark:border-gray-700 mt-6">
            This task is already completed, closed, or dropped. No further check-in/out actions are allowed.
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-4 mt-6">
            {!isCheckedIn ? (
              <button
                onClick={() => handleCheckInOut(true)}
                className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded flex items-center gap-2"
              >
                <AlarmClockCheck size={18} /> Check In
              </button>
            ) : (
              <button
                onClick={() => handleCheckInOut(false)}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-6 py-2 rounded flex items-center gap-2"
              >
                <TimerOff size={18} /> Check Out
              </button>
            )}

            <button
              onClick={() => setShowCompleteForm(!showCompleteForm)}
              className={`px-3 py-2 rounded flex items-center gap-2 ${
                showCompleteForm
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-600"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-800"
              }`}
            >
              <CircleCheckBig size={18} />
              {showCompleteForm ? "Cancel Complete" : "Mark as Completion"}
            </button>
          </div>
        )}
        {/* Task Completion Form (shown when completing task) */}
        {/* {showCompleteForm && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-700 dark:text-white mb-3">
              Task Completion Details
            </h3>

            {memberData.end_date &&
            new Date() > new Date(memberData.end_date) ? (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delay Reason
                  </label>
                  <select
                    value={delayBy}
                    onChange={(e) => setDelayBy(e.target.value)}
                    className="w-full p-2 rounded border dark:bg-gray-600 dark:border-gray-500"
                  >
                    <option value="member">Member</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Delay
                  </label>
                  <textarea
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Explain the reason for delay"
                    className="w-full p-2 rounded border dark:bg-gray-600 dark:border-gray-500"
                    rows="3"
                  />
                </div>
              </>
            ) : (
              <p className="text-green-600 dark:text-green-400 mb-3">
                Task is being completed on time.
              </p>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleTaskComplete}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        )} */}
        {showCompleteForm && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
              Task Completion Details
            </h3>

            {/* Check if task is delayed (current date > end date) */}
            {memberData.end_date &&
            new Date() > new Date(memberData.end_date) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Delay Reason Select */}
                <div className="bg-blue-100 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Delay Reason
                  </p>
                  <select
                    value={delayBy}
                    required
                    onChange={(e) => setDelayBy(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                {/* Reason for Delay Textarea */}
                <div className="bg-blue-100 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700 ">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason for Delay
                  </p>
                  <textarea
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Explain the reason for delay"
                    required
                    className="w-[50%] bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none min-h-[50px]"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  Task is being completed on time.
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleTaskComplete}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Time Entries Section */}
      <div className="flex">
        <div className="w-[70%] max-w-[70%] mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-6">
          <h2 className="text-xl font-semibold text-gray-600 dark:text-white mb-4">
            Time Entries
          </h2>

          <DataTable thead={timeEntriesThead} tbody={timeEntriesTbody} />

          <div className="mt-4">
            <CustomPagination
              total={timeEntries.length}
              currentPage={currentPage}
              defaultPageSize={10}
              onChange={setCurrentPage}
              paginationLabel="time entries"
            />
          </div>
        </div>

        <div className="w-[25%] max-w-[25%] mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4 mt-6">
          <h1 className="text-xl font-semibold text-gray-600 dark:text-white">
            Project Activity
          </h1>
          <p className="text-gray-500">Task progress and comments</p>

          <div className="flex justify-between">
            <div>
              <select className="w-full p-2 rounded-md border border-gray-300 bg-blue-200/25 dark:bg-gray-700 text-gray-600 dark:text-white focus:outline-none focus:border-gray-300">
                <option>In Progress</option>
                <option>Completed</option>
                <option>To Do</option>
              </select>
            </div>
            <div>
              <select className="w-full p-2 rounded-md bg-blue-200/25 dark:bg-gray-700 border border-gray-300 text-gray-800 dark:text-white focus:outline-none focus:border-gray-300">
                <option>10%</option>
                <option>25%</option>
                <option>50%</option>
                <option>75%</option>
                <option>100%</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg p-2 dark:bg-gray-700 space-y-4 h-auto">
            <div>
              <label className="text-gray-500 dark:text-gray-200">
                Comments
              </label>
              <textarea
                placeholder="Post your comment"
                className="w-full p-2 h-40 border mt-2 border-gray-200 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-white focus:outline-none focus:border-gray-200"
              />
            </div>
            <button className="w-full bg-red-700 hover:bg-red-800 text-white p-2 rounded-md focus:outline-none">
              Submit
            </button>
          </div>
        </div>
        {/* Project Activity Section (similar to TaskViewPage) */}
      </div>
        <Modal
              isVisible={showMeetingModal}
              className="w-full md:w-[800px]"
              onClose={() => setShowMeetingModal(false)}
              title="Create Meeting"
              closeOnOutsideClick={false}
            >
              <TaskMemberMeetingForm
                memberData={memberData}
                onSuccess={handleMeetingSuccess}
                onCancel={() => setShowMeetingModal(false)}
              />
            </Modal>
    </>
  );
};

export default TaskMemberViewPage;

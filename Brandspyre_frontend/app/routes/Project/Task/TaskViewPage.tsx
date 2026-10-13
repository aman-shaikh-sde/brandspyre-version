import {
  CalendarCheck2,
  CalendarClock,
  Eye,
  LogOut,
  MessageSquareText,
  Trash2,
  UserPlus2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import Modal from "src/component/Modal";
import { useEffect, useState } from "react";
import DataTable from "src/component/DataTable";
import CustomPagination from "src/component/CustomPagination";
import SearchInput from "src/component/SearchInput";
import Dropdown from "src/component/DrapDown";
import { Dot, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router";
import { BASE_URL } from "~/constants/api";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import AddNewTaskMember from "./TaskMember/AddNewTaskMember";
import { notify } from "~/services/notificationService";
import StarRating from "src/component/StarRating";
import TaskMeetingForm from "./Meeting/TaskMeetingForm";
import TaskDocuments from "./Meeting/TaskDocuments";

const TaskViewPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [sheetData, setSheetData] = useState([]);
  const [selectStatus, setSelectStatus] = useState("");
  const [taskData, setTaskData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [activeTab, setActiveTab] = useState("taskmeber"); // New state for tabs

  const token = useAuthStore((state) => state.accessToken);
  const { id } = useParams();
  const navigate = useNavigate();

  const [editingParticipants, setEditingParticipants] = useState({});
  const data = [
    {
      id: "ASC_12",
      date: "Agenda_1",
      name: "ABC 1",
      branch: "TL",
      priority: "Employee",
      progress: "TRACK-1",
      lastdate: "25-05-2025",
    },
    {
      id: "ASC_13",
      date: "Agenda_2",
      name: "ABC 2",
      branch: "TL",
      priority: "Employee",
      progress: "TRACK-2",
      lastdate: "25-05-2025",
    },
  ];
  const thead = () => [
    { data: "MeetId" },
    { data: "Agenda" },
    { data: "Consultant" },
    { data: "OrgBy" },
    { data: "Attendees" },
    { data: "Summary" },
    { data: "Last Meet" },
    { data: "view" },
  ];

  const tbody = () => {
    if (!data) return [];
    return data.map((user) => ({
      id: user.id,
      data: [
        { data: user.id },
        { data: user.name },
        { data: user.date },
        { data: user.branch },
        { data: user.priority },
        {
          data: user.progress,
        },
        { data: user.lastdate },
        {
          data: (
            <Link to="/project_tasklist">
              <button className="bg-red-400/25 text-xs dark:bg-red-700/15 px-3 py-1 dark:text-red-200 text-red-700 rounded-sm">
                View
              </button>
            </Link>
          ),
        },
      ],
    }));
  };
  const filterOptions = [
    { value: "client", label: "Client" },
    { value: "Project", label: "Project" },
    { value: "Leads", label: "Leads" },
    { value: "Employee", label: "Employee" },
  ];

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Paid", label: "Paid" },
    { value: "Un Paid", label: "Un-Paid" },
  ];

  // Fetch task data
  const fetchTaskData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/project/task/read?taskid=${id}`
      );
      setTaskData(response?.data?.data[0]);

      // Initialize editing state for each participant
      const participantsState = {};
      response?.data?.data[0]?.participantdetails?.forEach((participant) => {
        participantsState[participant.participants_id] = {
          status: participant.status,
          rating: participant.rating || 0,
          showRating: false,
        };
      });
      setEditingParticipants(participantsState);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, [id]);
  const handleOnExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, "BRANDSPYRE");
    XLSX.writeFile(wb, "EmployeeList.xlsx");
  };
  // Handle participant status change
  const handleStatusChange = (participantId, newStatus) => {
    setEditingParticipants((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        status: newStatus,
        showRating: newStatus === "verified-closed",
      },
    }));

    if (newStatus !== "verified-closed") {
      handleUpdateParticipant(participantId, newStatus);
    }
  };

  const handleRatingChange = (participantId, newRating) => {
    setEditingParticipants((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        rating: newRating,
      },
    }));
  };

  // Submit rating for verified-closed status
  const handleRatingSubmit = async (participantId) => {
    const { status, rating } = editingParticipants[participantId];

    if (rating < 1 || rating > 5) {
      notify.error("Please select a rating between 1 and 5");
      return;
    }

    await handleUpdateParticipant(participantId, status, rating);

    // Hide rating input after submission
    setEditingParticipants((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        showRating: false,
      },
    }));
  };
  const tabs = [
    { id: "taskmeber", label: "Tasks Details" },
    { id: "taskdoc", label: "Task Documents" },
  ];
  // Update participant status and rating
  const handleUpdateParticipant = async (
    participantId,
    status,
    rating = null
  ) => {
    const statusData = {
      data: {
        status,
        ...(status === "verified-closed" && rating !== null ? { rating } : {}),
      },
    };

    try {
      await apiClient.put(
        `/project/task/members/edit/${participantId}`,
        statusData
      );

      // Update local state
      setTaskData((prev) => ({
        ...prev,
        participantdetails: prev.participantdetails.map((p) =>
          p.participants_id === participantId
            ? {
                ...p,
                status,
                ...(status === "verified-closed" ? { rating } : {}),
              }
            : p
        ),
      }));

      notify.success("Status updated successfully!");
    } catch (err) {
      console.error("Error updating participant:", err);
      notify.error("Failed to update status");
      // Revert changes on error
      fetchTaskData();
    }
  };

  // Handle adding new participant
  const handleAddParticipant = (taskData) => {
    setSelectedTask(taskData);
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    notify.success("Member added successfully!");
    fetchTaskData();
  };
  const handleView = (memberId) => {
    navigate(`/member_view/${memberId}`);
  };
  // const handleRemoveParticipant = async (memberId) => {
  //   try {
  //     await apiClient.delete(
  //       `/project/task/members/delete/${memberId}`,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     notify.success("Participant removed successfully!");
  //     fetchTaskData();
  //   } catch (err) {
  //     console.error("Error removing participant:", err);
  //     notify.error("Failed to remove participant");
  //   }
  // };
  const handleRemoveParticipant = async (memberId) => {
  try {
    await apiClient.delete(
      `/project/task/members/delete/${memberId}`,
      {
        data: {
          data: { delete_type: 'permanent' }, // or 'temp' if you want soft delete
        },
      }
    );
    notify.success("Participant removed successfully!");
    fetchTaskData();
  } catch (err) {
    console.error("Error removing participant:", err);
    notify.error("Failed to remove participant");
  }
};

  const handleMeetingSuccess = () => {
    setShowMeetingModal(false);
    notify.success("Meeting and Document Created successfully!");
  };
  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!taskData) return <div className="p-4">No task data found</div>;

  return (
    <>
      <div className="flex justify-between">
<div className="p-4 text-red-700 mb-10">
          <div className="flex gap-5">
            <h1 className="text-2xl font-bold">Task View Page</h1>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-3 mt-2 bg-green-100 text-green-800 dark:bg-green-800/25 dark:text-green-400">
              <Dot />
              {taskData.status}
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
          {taskData.task_title}
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
              Project:
            </span>{" "}
            {taskData.projecttitle}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Milestone:
            </span>{" "}
            {taskData.milestonetitle}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Priority:
            </span>{" "}
            {taskData.task_priority}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Assigned By:
            </span>{" "}
            {taskData.handlername}
          </div>
          <div>
            <span className="font-medium text-green-700 dark:text-gray-100">
              <CalendarCheck2 className="inline" size={20} /> Start Date:
            </span>{" "}
            {new Date(taskData.start_date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium text-red-700 dark:text-gray-100">
              <CalendarClock className="inline" size={20} /> End Date:
            </span>{" "}
            {new Date(taskData.end_date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Duration:
            </span>{" "}
            {taskData.duration_days} days
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Team:
            </span>{" "}
            {taskData.teamname}
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-100">
              Client:
            </span>{" "}
            {taskData.client_name}
          </div>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-200 mt-4">
          <p>
            <span className="font-semibold">Task Description:</span>
            <br />
            {taskData.notes}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm mt-4">
          <div className="text-gray-700 dark:text-gray-200">
            <span className="font-semibold">Task Progress:</span>
          </div>
          <div className="flex items-center">
            <div className="w-[250px] rounded-full h-2.5 bg-gray-200 dark:bg-gray-700">
              <div
                className={`bg-red-700 h-2.5 rounded-full transition-all duration-500`}
                style={{ width: `70%` }}
              ></div>
            </div>
            <span className="text-red-700 ml-3">70%</span>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700 mt-5 mb-5">
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
      {activeTab === "taskmeber" && (
        <>
          <div className="w-full max-w-full mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-600 dark:text-white">
                Task Participants
              </h2>
              <div className="flex">
                <button
                  onClick={() => handleAddParticipant(taskData)}
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-1.5 rounded text-sm"
                >
                  <UserPlus2 size={15} className="inline" /> Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {taskData.participantdetails?.map((participant) => (
                <div
                  key={participant.participants_id}
                  className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow hover:transition-shadow hover:scale-103"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-white">
                        {participant.subtitle}
                      </h3>
                      <p className="text-sm text-red-600 dark:text-gray-300">
                        {participant.name}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <StarRating
                        rating={participant.rating || 0}
                        editable={false}
                      />
                      <button
                        onClick={() => handleView(participant.participants_id)}
                        className="text-red-600 hover:text-red-800"
                        title="View"
                      >
                        <Eye size={20} />
                      </button>


                      <button
                        onClick={() => handleRemoveParticipant(participant.participants_id)}
                        className="text-red-600 hover:text-red-800"
                        title="remove"
                      >
                        <Trash2 size={20} />
                      </button>

                    </div>
                  </div>

                  <div className="mt-2">
                    <select
                      value={
                        editingParticipants[participant.participants_id]
                          ?.status || participant.status
                      }
                      onChange={(e) =>
                        handleStatusChange(
                          participant.participants_id,
                          e.target.value
                        )
                      }
                      className="w-full p-2 text-md rounded border dark:bg-gray-600 dark:border-gray-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="inprocess">In Progress</option>
                      <option value="archived">Archived</option>
                      <option value="drop">Drop</option>
                      <option value="verified-closed">Verified & Closed</option>
                      <option value="rework">Rework</option>
                    </select>

                    {editingParticipants[participant.participants_id]
                      ?.showRating && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Rate this task (1-5):
                          </span>
                          <StarRating
                            rating={
                              editingParticipants[participant.participants_id]
                                ?.rating || 0
                            }
                            editable={true}
                            onRatingChange={(rating) =>
                              handleRatingChange(
                                participant.participants_id,
                                rating
                              )
                            }
                          />
                        </div>
                        <button
                          onClick={() =>
                            handleRatingSubmit(participant.participants_id)
                          }
                          className="w-full bg-red-700 hover:bg-red-800 text-white py-1 rounded text-sm"
                        >
                          Submit Rating
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-red-600 dark:text-gray-300 p-4 flex justify-end">
                    {new Date(participant.lastupdate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                // </Link>
              ))}
            </div>
          </div>

          {/* Rest of your components (DataTable, Activity section, etc.) */}

          <div className="flex">
            {/* <div className="w-[70%] mt-10">
              <div className="flex flex-col">
                <div className="p-4 flex-grow">
                  <div className="flex items-end justify-end">
                    <button
                      onClick={handleOnExport}
                      className="text-gray-400 bg-white focus:outline-non font-medium text-xs rounded-sm border border-dotted border-gray-400 hover:text-red-700/70 px-3 dark:bg-gray-800 dark:text-gray-300 py-1 text-center mr-5 mb-5 flex items-center"
                    >
                      <FileDown />
                      Export Excel
                    </button>
                    <button
                      onClick={() => setShowModal(true)}
                      className="text-white text-xs bg-red-700 focus:outline-non font-medium rounded px-3 py-2.5 text-center mr-5 mb-5 flex items-center"
                    >
                      + Add MOM
                    </button>
                  </div>

                  <div className="flex justify-between">
                    <Dropdown
                      options={filterOptions}
                      selectedValue={selectedFilter}
                      onSelect={setSelectedFilter}
                      placeholder="Filter By"
                      className="w-[150px]"
                    />
                    <Dropdown
                      options={statusOptions}
                      selectedValue={selectStatus}
                      onSelect={setSelectStatus}
                      placeholder="Payment Status"
                      className="w-[150px]"
                    />
                    <Dropdown
                      options={filterOptions}
                      selectedValue={selectedFilter}
                      onSelect={setSelectedFilter}
                      placeholder="Sort by"
                      className="w-[150px]"
                    />
                    <SearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search users..."
                    />
                  </div>

                  <DataTable thead={thead} tbody={tbody} />
                  <div className=" bottom-0 border-t border-gray-200 dark:border-gray-700 p-4 mt-10">
                    <CustomPagination
                      total={100}
                      currentPage={currentPage}
                      defaultPageSize={10}
                      onChange={setCurrentPage}
                      paginationLabel="employees"
                      isScroll={true}
                    />
                  </div>
                </div>
              </div>
            </div> */}

            {/* <div className="w-[25%] max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4 mt-10">
              <h1 className="text-xl font-semibold text-gray-600  dark:text-white">
                Project Activity
              </h1>
              <p className="text-gray-500">What is your task status</p>

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
                  <label className="text-gray-500 dark:text-gray-200 ">
                    Comments
                  </label>
                  <textarea
                    placeholder="Post your comment"
                    className="w-[250px] p-2 h-40 border mt-5 border-gray-200 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-white focus:outline-none focus:border-gray-200"
                  ></textarea>
                </div>

                <button className="w-full bg-red-700 hover:bg-red-800 text-white p-2 rounded-md focus:outline-none">
                  Submit
                </button>
              </div>
            </div> */}
          </div>
        </>
      )}
{activeTab === 'taskdoc' &&(
  <TaskDocuments/>
)}
      {/* Add Member Modal */}
      <Modal
        isVisible={showMeetingModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowMeetingModal(false)}
        title="Create Meeting"
        closeOnOutsideClick={false}
      >
        <TaskMeetingForm
          taskData={taskData}
          onSuccess={handleMeetingSuccess}
          onCancel={() => setShowMeetingModal(false)}
        />
      </Modal>
      <Modal
        isVisible={showCreateModal}
        className="w-full md:w-[800px]"
        onClose={() => setShowCreateModal(false)}
        title="Add Task Member Form"
        closeOnOutsideClick={false}
      >
        <AddNewTaskMember
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
          taskData={selectedTask}
          closeOnOutsideClick={false}
        />
      </Modal>
    </>
  );
};

export default TaskViewPage;

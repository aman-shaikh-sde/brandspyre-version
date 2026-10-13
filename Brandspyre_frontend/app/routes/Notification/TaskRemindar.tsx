import {
  Bell,
  Dot,
  Eye,
  KeyRound,
  Trash2,
  User2,
  Calendar,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { useAuthStore } from "src/stores/authStore";
import { Link } from "react-router-dom";

interface Task {
  id: number;
  task_title: string;
  task_priority: string;
  start_date: string;
  end_date: string;
  status: string;
  handler_by: string;
  project_code: string;
  milestone_code: string;
  handlername: string;
  projecttitle: string;
  milestonetitle: string;
  participantdetails: {
    name: string;
    status: string;
  }[];
}

function TaskRemindar() {
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    fetchOverdueTasks();
  }, [selectedDate]);

  const fetchOverdueTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      const response = await apiClient.get(
        `/project/task/read?overdue=${formattedDate}`
      );

      if (response.data.message === "View Project Task Info Success") {
        setOverdueTasks(response.data.data);
      } else {
        setError("Failed to fetch overdue tasks");
      }
    } catch (err) {
      setError("Error fetching overdue tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified-closed":
      case "archived":
        return "green";
      case "inprocess":
        return "blue";
      case "rework":
      case "drop":
        return "red";
      case "draft":
      default:
        return "gray";
    }
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-10">
        <div className="text-gray-500 text-xl font-bold">Task Reminder</div>
        <div className="flex items-center gap-2">
          <Calendar className="text-gray-500" size={20} />
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            dateFormat="yyyy-MM-dd"
            className="border rounded p-2"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">Loading overdue tasks...</div>
      )}
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      <div className="w-full flex flex-col justify-evenly gap-8">
        {overdueTasks.length === 0 && !loading && (
          <div className="text-center py-4 text-gray-500">
            No overdue tasks found for {selectedDate.toDateString()}
          </div>
        )}

        {overdueTasks.map((task) => {
          const statusColor = getStatusColor(task.status);
          const bgColor =
            statusColor === "green"
              ? "bg-green-500"
              : statusColor === "blue"
                ? "bg-blue-700"
                : statusColor === "red"
                  ? "bg-red-700"
                  : "bg-gray-500";
          const textColor =
            statusColor === "green"
              ? "text-green-500"
              : statusColor === "blue"
                ? "text-blue-700"
                : statusColor === "red"
                  ? "text-red-700"
                  : "text-gray-500";
          const hoverBgColor =
            statusColor === "green"
              ? "hover:bg-green-500/50"
              : statusColor === "blue"
                ? "hover:bg-blue-700/50"
                : statusColor === "red"
                  ? "hover:bg-red-700/50"
                  : "hover:bg-gray-500/50";
          const hoverTextColor =
            statusColor === "green"
              ? "hover:text-green-800"
              : statusColor === "blue"
                ? "hover:text-blue-800"
                : statusColor === "red"
                  ? "hover:text-red-800"
                  : "hover:text-gray-800";

          return (
            <div
              key={task.id}
              className="bg-white w-full h-[100%] flex rounded-sm shadow-lg"
            >
              <div>
                <div className={`${bgColor} rounded-r-lg w-4 h-[220px]`}></div>
              </div>
              <div className="ms-4 w-full p-4">
                <div className="md:flex gap-5">
                  <User2 className="font-light text-gray-600" size={25} />
                  <h1 className="text-xl font-medium text-gray-600">
                    Task ID: {task.id} - {task.task_title}
                  </h1>
                </div>
                <div className="md:flex md:w-full justify-between mt-2">
                  <div>
                    <p className="text-gray-600">
                      Priority: {task.task_priority} | Status: {task.status}
                    </p>
                    <p className="text-gray-600">
                      Start: {formatDate(task.start_date)} | Due:{" "}
                      {formatDate(task.end_date)}
                    </p>
                    <p className="text-gray-600">
                      Project: {task.projecttitle} | Milestone:{" "}
                      {task.milestonetitle}
                    </p>
                    <p className="text-gray-600">
                      Handler: {task.handlername} | Participants:{" "}
                      {task.participantdetails.map((p) => p.name).join(", ")}
                    </p>
                  </div>
                  <div className="md:flex flex-col">
                    <div>
                      <p
                        className={`w-[120px] h-[30px] ${bgColor}/25 ${textColor} rounded-3xl`}
                      >
                        <Dot className="inline" /> Overdue
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:flex justify-between mt-4">
                  <div className="flex gap-8">
                    <Link to={`/task_view/${encodeURIComponent(task.id)}`}>
                      <button
                        className={`${bgColor}/25 px-3 py-2 rounded-sm ${textColor} ${hoverBgColor} ${hoverTextColor} flex gap-1`}
                      >
                        <Eye size={15} className="mt-1" />
                        View Detail
                      </button>
                    </Link>
                  </div>
                  <div></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TaskRemindar;

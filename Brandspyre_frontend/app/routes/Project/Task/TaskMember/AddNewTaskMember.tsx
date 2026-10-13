import { apiClient } from "src/services/apiClient";
import {
  Banknote,
  CalendarCheck,
  ClipboardList,
  Flag,
  Hash,
  ListChecks,
  Mail,
  Milestone,
  Network,
  Percent,
  Plus,
  Tag,
  Target,
  Trash2,
  User,
  User2Icon,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import { AiFillProject } from "react-icons/ai";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useClientStore from "src/stores/ClientStore";
import useLeadsStore from "src/stores/LeadsStore";
import useProjectStore from "src/stores/ProjectStore";
import useBranchStore from "src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import { BASE_URL } from "~/constants/api";

const AddNewTaskMember = ({ taskData, onSuccess, onCancel }) => {
  console.log("taskdattaaaa", taskData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const token = useAuthStore((state) => state.accessToken);

  const [formData, setFormData] = useState({
    branchcode: taskData.branchcode,
    task_id: taskData.id,
    collaborate: [
      {
        subtask_title: "",
        staff_id: "",
        status: "open",
      },
    ],
    status: "draft",
  });

  useEffect(() => {
    setTeamMembers([]);
  }, []);

  // Fetch team members when team_id changes
  //   useEffect(() => {
  //     if (formData.team_id) {
  //       fetchTeamMembers(formData.team_id);
  //     } else {
  //       setTeamMembers([]);
  //     }
  //   }, [formData.team_id]);

  const fetchTeamMembers = async () => {
    const teamId = taskData.team_id;
    console.log("teamiddd", teamId);
    try {
      const response = await apiClient.get(
        `/teams/read/profile?team_id=${teamId}`
      );
      console.log("teammeberrssss", response);
      if (response.data && response.data.data) {
        // Filter out team leads (role === "lead")
        const members = response.data.data.members;
        console.log("memberrss", members);
        setTeamMembers(members);
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
      notify.error("Failed to load team members");
    }
  };
  useEffect(() => {
    fetchTeamMembers();
  }, []);


  const handleCollaborateChange = (index, e) => {
    const { name, value } = e.target;
    const updatedCollaborate = [...formData.collaborate];
    updatedCollaborate[index] = {
      ...updatedCollaborate[index],
      [name]: value,
    };
    setFormData((prev) => ({
      ...prev,
      collaborate: updatedCollaborate,
    }));
  };

  const addCollaborate = () => {
    setFormData((prev) => ({
      ...prev,
      collaborate: [
        ...prev.collaborate,
        {
          subtask_title: "",
          staff_id: "",
          status: "open",
        },
      ],
    }));
  };

  const removeCollaborate = (index) => {
    if (formData.collaborate.length === 1) return;
    const updatedCollaborate = formData.collaborate.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      collaborate: updatedCollaborate,
    }));
  };


//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     const taskDatas = {
//       data: {
//         branchcode: taskData.branchcode,
//         task_id: taskData.id,
//         collaborate: formData.collaborate,
//       },
//     };

//     try {
//       const response = await apiClient.post(
//         `/project/task/members/create`,
//         taskDatas,
//         {
//
//         }
//       );
//       console.log(
//         "responsekipppedd",
//         response.data.data.skipped[0].reason,
//         response
//       );
//       if (
//         response.status === 200 &&
//         response.data.data.skipped[0].reason !== ""
//       ) {
//         setError(response.data.data.skipped[0].reason);
//       } else if (response.status === 200) {
//         notify.success("Task Member added successfully!");
//         onSuccess();
//       } else {
//         setError(response.data.message || "Failed to create task");
//       }
     
//     } catch (err) {
//       setError(err.response?.data?.message || "An error occurred");
//       notify.error(err.response?.data?.message || "Error creating task");
//     } finally {
//       setLoading(false);
//       setError(null)
  
//     }
//   };
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const taskDatas = {
    data: {
      branchcode: taskData.branchcode,
      task_id: taskData.id,
      collaborate: formData.collaborate,
    },
  };

  try {
    const response = await apiClient.post(
      `/project/task/members/create`,
      taskDatas
    );

    // Check if response has skipped data
    if (response.data?.data?.skipped?.length > 0) {
      const skipReason = response.data.data.skipped[0].reason;
      if (skipReason) {
        setError(skipReason);
        notify.error(skipReason); // Notify user about the skip reason
        return; // Exit early since this is a "soft" error
      }
    }

    // Check for successful response
    if (response.status === 200 || response.status === 201) {
      notify.success("Task Member added successfully!");
      onSuccess(); // Call success callback
    } else {
      throw new Error(response.data?.message || "Failed to create task");
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || 
                        err.message || 
                        "An error occurred while creating task";
    setError(errorMessage);
    notify.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Collaborators
        </h3>
        {formData.collaborate.map((collaborate, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 relative"
          >
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <ClipboardList className="inline mr-1" size={14} /> Sub Task
                Title
              </p>
              <input
                name="subtask_title"
                value={collaborate.subtask_title}
                onChange={(e) => handleCollaborateChange(index, e)}
                type="text"
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="Enter Subtask Title"
                required
              />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Team Member
              </p>
              <select
                name="staff_id"
                value={collaborate.staff_id}
                onChange={(e) => handleCollaborateChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="">Select Team Member</option>
                {teamMembers?.map((member) => (
                  <option key={member.staff_id} value={member.staff_id}>
                    {member.staff_name} ({member.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Tag className="inline mr-1" size={14} /> Collaboration Status
              </p>
              <select
                name="status"
                value={collaborate.status}
                onChange={(e) => handleCollaborateChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="draft">Draft</option>
                <option value="inprocess">In Progress</option>
                <option value="verified-closed">Completed</option>
                <option value="archived">Archived</option>
                <option value="rework">Rework</option>
                <option value="drop">Drop</option>
              </select>
            </div>

            {index > 0 && (
              <button
                type="button"
                onClick={() => removeCollaborate(index)}
                className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addCollaborate}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <Plus size={16} /> Add Another Collaborator
        </button>
      </div>{" "}
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
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm disabled:opacity-70"
        >
          {loading ? <ButtonLoader /> : "Create Task"}
        </button>
      </div>
    </div>
  );
};

export default AddNewTaskMember;

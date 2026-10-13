import { apiClient } from "src/services/apiClient";
import {
  CalendarCheck,
  ClipboardList,
  Flag,
  Hash,
  ListChecks,
  Plus,
  Tag,
  Target,
  Trash2,
  User,
  Users,
  Milestone,
  Network,
} from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { BASE_URL } from "~/constants/api";

const EditRoleForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [milestoneOptions, setMilestoneOptions] = useState([]);
  
  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : null) || storeRole || "staff";
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
  const token = useAuthStore((state) => state.accessToken);

  const branchCodeOption =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];

  const [formData, setFormData] = useState({
  branchcode: "",
  project_code: "",
  
  start_date: "",
  
  documentFile: null as File | null,
});


  // Fetch teams and projects when branchcode changes
  useEffect(() => {
    if (formData.branchcode) {
      fetchTeams(formData.branchcode);
      fetchProjects(formData.branchcode);
    } else {
      setTeamOptions([]);
      setTeamMembers([]);
      setProjectOptions([]);
      setMilestoneOptions([]);
    }
  }, [formData.branchcode]);

  // Fetch milestones when project_code changes
  useEffect(() => {
    if (formData.project_code) {
      fetchMilestones(formData.project_code);
    } else {
      setMilestoneOptions([]);
    }
  }, [formData.project_code]);

  // Fetch team members when team_id changes
  useEffect(() => {
    if (formData.team_id) {
      fetchTeamMembers(formData.team_id);
    } else {
      setTeamMembers([]);
    }
  }, [formData.team_id]);

  const fetchTeams = async (branchcode) => {
    try {
      const response = await apiClient.get(
        `/teams/read?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((team) => ({
          value: team.team_id,
          label: team.team_name,
          team_lead: team.team_lead,
        }));
        setTeamOptions(options);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      notify.error("Failed to load teams");
    }
  };

  const fetchProjects = async (branchcode) => {
    try {
      const response = await apiClient.get(
        `/project/overview/dropdown?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((project) => ({
          value: project.project_code,
          label: project.title,
        }));
        setProjectOptions(options);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      notify.error("Failed to load projects");
    }
  };

  const fetchMilestones = async (project_code) => {
    try {
      const response = await apiClient.get(
        `/project/milestone/dropdown?project_code=${project_code}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((milestone) => ({
          value: milestone.milestone_code,
          label: milestone.miles_title,
        }));
        setMilestoneOptions(options);
      }
    } catch (err) {
      console.error("Error fetching milestones:", err);
      notify.error("Failed to load milestones");
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await apiClient.get(
        `/teams/read/profile?team_id=${teamId}`
      );

      if (response.data && response.data.data) {
        // Filter out team leads (role === "lead")
        const members = response.data.data.members.filter(
          (member) => member.role !== "lead"
        );
        setTeamMembers(members);

        // Auto-set handler_by to the team lead
        const teamLead = response.data.data.members.find(
          (member) => member.role === "lead"
        );
        if (teamLead) {
          setFormData((prev) => ({
            ...prev,
            handler_by: teamLead.staff_id,
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
      notify.error("Failed to load team members");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset project_code and milestone_code when branch changes
    if (name === "branchcode") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        project_code: "",
        milestone_code: ""
      }));
    } 
    // Reset milestone_code when project changes
    else if (name === "project_code") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        milestone_code: ""
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

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
          subtask_title: '',
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

  const validateForm = () => {
    if (!formData.branchcode) {
      setError("Branch code is required");
      return false;
    }
    if (!formData.project_code) {
      setError("Project is required");
      return false;
    }
    if (!formData.milestone_code) {
      setError("Milestone is required");
      return false;
    }
    if (!formData.task_title) {
      setError("Task title is required");
      return false;
    }
    if (!formData.start_date || !formData.end_date) {
      setError("Both start and end dates are required");
      return false;
    }
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError("End date must be after start date");
      return false;
    }
    if (!formData.team_id) {
      setError("Team is required");
      return false;
    }
    if (!formData.handler_by) {
      setError("Handler is required");
      return false;
    }

    // Validate collaborate
    for (const collab of formData.collaborate) {
      if (!collab.staff_id) {
        setError("All collaborators must have a staff selected");
        return false;
      }
    }

    return true;
  };


const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setFormData({ ...formData, documentFile: e.target.files[0] });
  }
};


 const handleSubmit = async () => {
  setLoading(true);
  setError("");

  const form = new FormData();

  form.append("branchcode", formData.branchcode);
  form.append("project_id", formData.project_code); // Match your backend field
  // form.append("client_id", formData.client_id || ""); // Optional, if needed
  // form.append("staff_id", userId?.toString() || ""); // Assuming staff_id = logged-in user
  // form.append("name", formData.task_title || ""); // Assuming 'task_title' is document name
  // form.append("type", formData.task_priority || ""); // If you store priority as type
  // form.append("field", formData.notes || ""); // Assuming 'notes' can be field
  form.append("on_date", formData.start_date || "");
  // form.append("description", formData.collaborate || ""); // Adjust if needed

  if (formData.documentFile) {
    form.append("file", formData.documentFile); // Important: field name must match multer's .single('file')
  }

  try {
    const response = await apiClient.post(`/upload`, form, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Do NOT manually set 'Content-Type' here. Let Axios set it for FormData.
      },
    });

    if (response.status === 201 || response.status === 200) {
      notify.success("Document uploaded successfully!");
      onSuccess();
    } else {
      setError(response.data.message || "Upload failed");
    }
  } catch (err: any) {
    setError(err.response?.data?.message || "An error occurred");
    notify.error(err.response?.data?.message || "Error uploading document");
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
          <Flag className="inline mr-2" /> Client Document
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Code
            </p>
            <select
              name="branchcode"
              value={formData.branchcode}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Branch</option>
              {branchCodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Network className="inline mr-1" size={14} /> Select Project
            </p>
            <select
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
              disabled={!formData.branchcode}
            >
              <option value="">Select Project</option>
              {projectOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Milestone className="inline mr-1" size={14} /> Select Document
            </p>
                 <input
  name="file"
  type="file"
  onChange={handleFileChange}
  className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
/>

          </div>

          

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Upload Date
            </p>
            <input
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>

          
        </div>

     
      </div>

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
          {loading ? <ButtonLoader /> : "Add Document"}
        </button>
      </div>
    </div>
  );
};

export default EditRoleForm;
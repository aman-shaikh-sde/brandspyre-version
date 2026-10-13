import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  FileText,
  Users,
  File,
  Check,
  X,
  Video,
  FileUp,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import Dropdown from "src/component/DrapDown";
import useBranchStore from "src/stores/useBranchStore";

const TaskMemberMeetingForm = ({ memberData, onSuccess, onCancel }) => {
  console.log("projectcodeee", memberData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [customTargets, setCustomTargets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCustomTargets, setShowCustomTargets] = useState(false);
  const token = useAuthStore((state) => state.accessToken);
  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = storeRole || (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : "") || "";
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
  const currentTenantId = useAuthStore((state) => state.tenantId);

  const branchCodeOption =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];

  const [filterTargets, setFilterTargets] = useState([
    {
      type: "",
      branchcode: "",
      teamId: "",
      staffType: "staff",
    },
  ]);

  const [formData, setFormData] = useState({
    branchcode: memberData.branchcode,
    task_participants: memberData.participants_id,
    title: "",
    notes: "",
    comm_type: "meeting",
    status: "active",
    doc_status: "none",
    meet_link: "",
    start_date_time: "2025-02-01T00:00:00Z,",
    end_date_time: "2025-02-01T23:59:59Z",
    category: "branch",
    field: "custom",
    doc: [],
    custom: [],
    communication_participants: [],
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const branchesRes = await apiClient.get(`/branch/dropdown`);
        setBranches(branchesRes.data.result);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        notify.error("Failed to load initial data");
      }
    };
    fetchInitialData();
  }, [token]);

  // Fetch teams when branchcode in filter targets changes
  useEffect(() => {
    const branchcodes = [
      ...new Set(
        filterTargets
          .filter((target) => target.type === "team" && target.branchcode)
          .map((target) => target.branchcode)
      ),
    ];

    const fetchTeamsForBranches = async () => {
      try {
        const teamsPromises = branchcodes.map(async (branchcode) => {
          const teamsRes = await apiClient.get(
            `/teams/read?branchcode=${branchcode}`
          );
          return teamsRes.data.data;
        });

        const teamsResults = await Promise.all(teamsPromises);
        setTeams(teamsResults.flat());
      } catch (err) {
        console.error("Error fetching teams:", err);
        notify.error("Failed to load teams");
      }
    };

    if (branchcodes.length > 0) {
      fetchTeamsForBranches();
    }
  }, [filterTargets, token]);

  // Fetch participants based on category and filters
  useEffect(() => {
    if (formData.category === "custom") {
      fetchCustomParticipants();
    } else if (formData.category === "branch" && formData.branchcode) {
      fetchBranchParticipants();
    } else if (formData.category === "team") {
      fetchTeamParticipants();
    }
  }, [formData.category, formData.branchcode, filterTargets]);

  const fetchBranchParticipants = async () => {
    try {
      const response = await apiClient.post(
        `/users/filter`,
        {
          branch: [formData.branchcode],
          team: [],
          type: ["staff", "client"],
        }
      );
      setStaffOptions([...response.data.staff, ...response.data.client]);
    } catch (err) {
      console.error("Error fetching branch participants:", err);
      notify.error("Failed to fetch participants");
    }
  };

  const fetchTeamParticipants = async () => {
    try {
      const response = await apiClient.post(
        `/users/filter`,
        {
          branch: [formData.branchcode],
          team: [],
          type: ["staff", "client"],
        }
      );
      setStaffOptions([...response.data.staff, ...response.data.client]);
    } catch (err) {
      console.error("Error fetching branch participants:", err);
      notify.error("Failed to fetch participants");
    }
    // Similar to fetchBranchParticipants but with team filter
    // Implement as needed
  };

  // const fetchCustomParticipants = async () => {
  //   try {
  //     const branchFilters = filterTargets
  //       .filter((target) => target.type === "branch" && target.branchcode)
  //       .map((target) => target.branchcode);

  //     const teamFilters = filterTargets
  //       .filter((target) => target.type === "team" && target.teamId)
  //       .map((target) => `${target.branchcode}/TEAM/${target.teamId.split('/').pop()}`);

  //     const staffTypeFilters = filterTargets.reduce((acc, target) => {
  //       if (target.type === "branch" || target.type === "team") {
  //         if (target.staffType === "staff") acc.push("staff");
  //         if (target.staffType === "client") acc.push("client");
  //       }
  //       return acc;
  //     }, []);

  //     const uniqueStaffTypes = [...new Set(staffTypeFilters)];

  //     if (branchFilters.length > 0 || teamFilters.length > 0) {
  //       const response = await apiClient.post(
  //         `/users/filter`,
  //         {
  //           branch: branchFilters,
  //           team: teamFilters,
  //           type: uniqueStaffTypes.length > 0 ? uniqueStaffTypes : ["staff", "client"],
  //         },
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       setStaffOptions([...response.data.staff, ...response.data.client]);
  //     } else {
  //       setStaffOptions([]);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching custom participants:", err);
  //     notify.error("Failed to fetch participants");
  //   }
  // };
  const fetchCustomParticipants = async () => {
    try {
      // Prepare branch filters - collect all branchcodes from branch-type targets
      const branchFilters = filterTargets
        .filter((target) => target.type === "branch" && target.branchcode)
        .map((target) => target.branchcode);

      // Prepare team filters - format them as "BRANCHCODE/TEAM/TEAMID"
      const teamFilters = filterTargets
        .filter(
          (target) =>
            target.type === "team" && target.teamId && target.branchcode
        )
        .map((target) => {
          // Extract just the team ID part (remove branchcode if included)
          const teamIdParts = target.teamId.split("/");
          const teamId = teamIdParts[teamIdParts.length - 1]; // Get last part which should be team ID
          return `${target.branchcode}/TEAM/${teamId}`;
        });

      // Also include branchcodes from team filters in the branch array
      const teamBranchFilters = filterTargets
        .filter((target) => target.type === "team" && target.branchcode)
        .map((target) => target.branchcode);

      // Combine branch filters and team branch filters
      const allBranchFilters = [
        ...new Set([...branchFilters, ...teamBranchFilters]),
      ];

      // Prepare staff type filters
      const staffTypeFilters = [];
      filterTargets.forEach((target) => {
        if (target.type === "branch" || target.type === "team") {
          if (target.staffType === "staff") staffTypeFilters.push("staff");
          if (target.staffType === "client") staffTypeFilters.push("client");
          if (target.staffType === "both") {
            staffTypeFilters.push("staff");
            staffTypeFilters.push("client");
          }
        }
      });

      // Remove duplicate staff types
      const uniqueStaffTypes = [...new Set(staffTypeFilters)];

      console.log("Sending filter request with:", {
        branch: allBranchFilters,
        team: teamFilters,
        type:
          uniqueStaffTypes.length > 0 ? uniqueStaffTypes : ["staff", "client"],
      });

      // Only make the request if we have at least one branch or team filter
      if (allBranchFilters.length > 0 || teamFilters.length > 0) {
        const response = await apiClient.post(
          `/users/filter`,
          {
            branch: allBranchFilters,
            team: teamFilters,
            type:
              uniqueStaffTypes.length > 0
                ? uniqueStaffTypes
                : ["staff", "client"],
          }
        );
        setStaffOptions([...response.data.staff, ...response.data.client]);
      } else {
        setStaffOptions([]);
      }
    } catch (err) {
      console.error("Error fetching custom participants:", err);
      notify.error("Failed to fetch participants");
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "category") {
      setCustomTargets([]);
      setFilterTargets([
        { type: "", branchcode: "", teamId: "", staffType: "staff" },
      ]);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const uploadedFiles = files.map((file) => ({
      file, // Store the actual File object
      name: file.name,
      type: file.type.split("/")[1] || "file",
    }));

    setFormData((prev) => ({
      ...prev,
      doc: [...prev.doc, ...uploadedFiles],
    }));
  };

  const removeFile = (index) => {
    setFormData((prev) => {
      const updatedFiles = [...prev.doc];
      updatedFiles.splice(index, 1);
      return { ...prev, doc: updatedFiles };
    });
  };

  const addParticipant = (person) => {
    if (!participants.some((p) => p.person_id === person.person_id)) {
      setParticipants([
        ...participants,
        {
          person_id: person.person_id,
          role: person.role,
          isdocvisible: formData.comm_type === "doc",
        },
      ]);
    }
  };

  const removeParticipant = (personId) => {
    setParticipants(participants.filter((p) => p.person_id !== personId));
  };

  const toggleDocVisibility = (personId) => {
    setParticipants(
      participants.map((p) =>
        p.person_id === personId ? { ...p, isdocvisible: !p.isdocvisible } : p
      )
    );
  };

  // const addCustomTarget = (type, id) => {
  //   if (!customTargets.some((t) => t.target_id === id && t.type === type)) {
  //     setCustomTargets([...customTargets, { target_id: id, type }]);
  //   }
  // };
  const addCustomTarget = (type, id) => {
    // For team targets, we need to find the corresponding filter target to get the branchcode
    if (type === "team") {
      const target = filterTargets.find(
        (t) => t.type === "team" && t.teamId === id
      );
      if (target && target.branchcode) {
        const teamIdParts = id.split("/");
        const teamId = teamIdParts[teamIdParts.length - 1]; // Get just the team ID
        const formattedId = `${target.branchcode}/TEAM/${teamId}`;

        if (
          !customTargets.some(
            (t) => t.target_id === formattedId && t.type === type
          )
        ) {
          setCustomTargets([
            ...customTargets,
            { target_id: formattedId, type },
          ]);
        }
        return;
      }
    }

    // For branch targets or if team branchcode not found
    if (!customTargets.some((t) => t.target_id === id && t.type === type)) {
      setCustomTargets([...customTargets, { target_id: id, type }]);
    }
  };
  const removeCustomTarget = (type, id) => {
    setCustomTargets(
      customTargets.filter((t) => !(t.target_id === id && t.type === type))
    );
  };

  // const handleFilterTargetChange = (index, field, value) => {
  //   const updatedTargets = [...filterTargets];
  //   updatedTargets[index][field] = value;

  //   if (field === "type") {
  //     updatedTargets[index].branchcode = "";
  //     updatedTargets[index].teamId = "";
  //   }

  //   setFilterTargets(updatedTargets);
  // };
  const handleFilterTargetChange = (index, field, value) => {
    const updatedTargets = [...filterTargets];
    updatedTargets[index][field] = value;

    if (field === "type") {
      // Reset dependent fields when type changes
      updatedTargets[index].branchcode = "";
      updatedTargets[index].teamId = "";
    } else if (
      field === "branchcode" &&
      updatedTargets[index].type === "team"
    ) {
      // Reset teamId when branchcode changes for team type
      updatedTargets[index].teamId = "";
    }

    setFilterTargets(updatedTargets);
  };

  const addFilterTarget = () => {
    setFilterTargets([
      ...filterTargets,
      { type: "", branchcode: "", teamId: "", staffType: "staff" },
    ]);
  };

  const removeFilterTarget = (index) => {
    if (filterTargets.length > 1) {
      const updatedTargets = [...filterTargets];
      updatedTargets.splice(index, 1);
      setFilterTargets(updatedTargets);

      if (
        updatedTargets[index]?.type === "branch" &&
        updatedTargets[index]?.branchcode
      ) {
        setCustomTargets(
          customTargets.filter(
            (t) =>
              !(
                t.type === "branch" &&
                t.target_id === updatedTargets[index].branchcode
              )
          )
        );
      } else if (
        updatedTargets[index]?.type === "team" &&
        updatedTargets[index]?.teamId
      ) {
        setCustomTargets(
          customTargets.filter(
            (t) =>
              !(
                t.type === "team" &&
                t.target_id === updatedTargets[index].teamId
              )
          )
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare the meeting data in the required format
      const meetingData = {
        branchcode: memberData.branchcode,
        task_id: memberData.task_id,
        tenant_id: currentTenantId || undefined,
        title: formData.title,
        notes: formData.notes,
        comm_type: formData.comm_type,
        status: formData.status,
        meet_link: formData.meet_link,
        start_date_time: formData.start_date_time,
        end_date_time: formData.end_date_time,
        doc_status: formData.doc_status,
        category: formData.category,
        field: formData.field,
        custom: customTargets,
        communication_participants: participants,
      };

      // Create FormData for the request
      const formDataToSend = new FormData();

      // Append the meeting data as JSON string
      formDataToSend.append("data", JSON.stringify([meetingData]));

      // Append each file directly
      formData.doc.forEach((fileObj) => {
        formDataToSend.append("URL", fileObj.file);
      });
      console.log("formataaaanew form", formDataToSend);
      const response = await apiClient.post(
        `/doc_meet/create`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        onSuccess();
        setFormData({
          branchcode: memberData.branchcode,
          client_code: memberData.client_code,
          project_code: memberData.project_code,
          title: "",
          notes: "",
          comm_type: "meeting",
          status: "active",
          doc_status: "none",
          meet_link: "",
          start_date_time: "2025-02-01T00:00:00Z,",
          end_date_time: "2025-02-01T23:59:59Z",
          category: "branch",
          field: "custom",
          doc: [],
          custom: [],
          communication_participants: [],
        });
      } else {
        setError(response.data.message || "Failed to create communication");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(
        `Error creating ${formData.comm_type === "meeting" ? "meeting" : "document"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          {formData.comm_type === "meeting" ? (
            <Video className="inline mr-2" />
          ) : (
            <FileUp className="inline mr-2" />
          )}
          {formData.comm_type === "meeting"
            ? "Meeting Information"
            : "Document Information"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FileText className="inline mr-1" size={14} /> Title
              <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Title"
              required
            />
          </div>

          {/* Communication Type */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Type
              <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <select
              name="comm_type"
              value={formData.comm_type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="meeting">Meeting</option>
              <option value="doc">Document</option>
              <option value="followup">Follow-up</option>
            </select>
          </div>

          {/* Status */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Status
            </p>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {/* Document Status (shown only for documents) */}
          {formData.comm_type === "doc" && (
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <File className="inline mr-1" size={14} /> Document Status
              </p>
              <select
                name="doc_status"
                value={formData.doc_status}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              >
                <option value="none">None</option>
                <option value="archived">Archived</option>
                <option value="verified-closed">Verified & Closed</option>
                <option value="rework">Rework</option>
              </select>
            </div>
          )}

          {/* Meeting Link (shown only for meetings) */}
          {formData.comm_type === "meeting" && (
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <LinkIcon className="inline mr-1" size={14} /> Meeting Link
                <span className="text-red-700 text-lg m-2">*</span>
              </p>
              <input
                name="meet_link"
                value={formData.meet_link}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="url"
                placeholder="https://meet.google.com/example"
                required
              />
            </div>
          )}

          {/* Start Date/Time (shown only for meetings) */}
          {formData.comm_type === "meeting" && (
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Calendar className="inline mr-1" size={14} /> Start Date/Time
                <span className="text-red-700 text-lg m-2">*</span>
              </p>
              <input
                name="start_date_time"
                value={formData.start_date_time}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="datetime-local"
                required
              />
            </div>
          )}

          {/* End Date/Time (shown only for meetings) */}
          {formData.comm_type === "meeting" && (
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Clock className="inline mr-1" size={14} /> End Date/Time
                <span className="text-red-700 text-lg m-2">*</span>
              </p>
              <input
                name="end_date_time"
                value={formData.end_date_time}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="datetime-local"
                required
              />
            </div>
          )}

          {/* Category */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Users className="inline mr-1" size={14} /> Category
              <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="branch">Branch</option>
              <option value="team">Team</option>
              <option value="all">All</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Field */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Field
            </p>
            <select
              name="field"
              value={formData.field}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            >
              <option value="project">Project</option>
              <option value="task">Task</option>
              <option value="lead">Lead</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <FileText className="inline mr-1" size={14} /> Notes
          </p>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Notes..."
            required
          />
        </div>

        {/* File Upload (shown only for documents) */}
        {formData.comm_type === "doc" && (
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <FileUp className="inline mr-1" size={14} /> Documents
            </p>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:bg-[var(--color-hover)]"
            />
            {formData.doc.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.doc.map((file, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Filters Section (shown only when category is custom) */}
        {formData.category === "custom" && (
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowCustomTargets(!showCustomTargets)}
            >
              <h4 className="text-sm font-semibold">
                <Users className="inline mr-2" size={16} />
                Custom Filters ({customTargets.length})
              </h4>
              {showCustomTargets ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>

            {showCustomTargets && (
              <div className="mt-4 space-y-4">
                {filterTargets.map((target, index) => (
                  <div
                    key={index}
                    className="space-y-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-medium">
                        Filter {index + 1}
                      </h5>
                      {filterTargets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFilterTarget(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Minus size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Filter Type
                        </label>
                        <select
                          value={target.type}
                          onChange={(e) =>
                            handleFilterTargetChange(
                              index,
                              "type",
                              e.target.value
                            )
                          }
                          className="w-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none"
                        >
                          <option value="">Select filter type</option>
                          <option value="branch">Branch</option>
                          <option value="team">Team</option>
                        </select>
                      </div>

                      {(target.type === "branch" || target.type === "team") && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Branch
                          </label>
                          <select
                            value={target.branchcode}
                            onChange={(e) => {
                              handleFilterTargetChange(
                                index,
                                "branchcode",
                                e.target.value
                              );
                              handleFilterTargetChange(index, "teamId", "");
                            }}
                            className="w-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none"
                          >
                            <option value="">Select branch</option>
                            {branches.map((branch) => (
                              <option
                                key={branch.branchcode}
                                value={branch.branchcode}
                              >
                                {branch.branchcode} - {branch.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {target.type === "team" && target.branchcode && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Team
                          </label>
                          <select
                            value={target.teamId}
                            // onChange={(e) => {
                            //   handleFilterTargetChange(index, "teamId", e.target.value);
                            //   if (e.target.value) {
                            //     addCustomTarget("team", e.target.value);
                            //   }
                            // }}
                            // In your team select onChange handler:
                            onChange={(e) => {
                              handleFilterTargetChange(
                                index,
                                "teamId",
                                e.target.value
                              );
                              if (e.target.value) {
                                // Pass both the teamId and branchcode to addCustomTarget
                                addCustomTarget("team", e.target.value);
                              }
                            }}
                            className="w-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none"
                          >
                            <option value="">Select team</option>
                            {teams
                              .filter(
                                (team) => team.branchcode === target.branchcode
                              )
                              .map((team) => (
                                <option key={team.team_id} value={team.team_id}>
                                  {team.team_name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      {(target.type === "branch" || target.type === "team") && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Staff Type
                          </label>
                          <select
                            value={target.staffType}
                            onChange={(e) =>
                              handleFilterTargetChange(
                                index,
                                "staffType",
                                e.target.value
                              )
                            }
                            className="w-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 focus:outline-none"
                          >
                            <option value="staff">Staff</option>
                            <option value="client">Client</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {target.type === "branch" && target.branchcode && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            addCustomTarget("branch", target.branchcode)
                          }
                          className="text-xs bg-red-700 hover:bg-red-700 text-white px-2 py-1 rounded"
                        >
                          Add Branch Filter
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addFilterTarget}
                  className="flex items-center text-sm text-blue-500 hover:text-blue-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Another Filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants Section */}
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <h4 className="text-sm font-semibold">
              <Users className="inline mr-2" size={16} />
              Participants ({participants.length})
            </h4>
            {showParticipants ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>

          {showParticipants && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  {formData.category === "custom"
                    ? "Select participants from filtered results"
                    : `Select participants from ${formData.category}`}
                </p>
                {staffOptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffOptions.map((person) => (
                      <div
                        key={person.person_id}
                        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        <span>
                          {person.person_id} ({person.role})
                        </span>
                        {participants.some(
                          (p) => p.person_id === person.person_id
                        ) ? (
                          <button
                            type="button"
                            onClick={() => removeParticipant(person.person_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addParticipant(person)}
                            className="text-green-500 hover:text-green-700"
                          >
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No participants available based on current filters
                  </p>
                )}
              </div>

              {participants.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">
                    Selected Participants
                  </p>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.person_id}
                        className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        <span>
                          {participant.person_id} ({participant.role})
                        </span>
                        <div className="flex items-center space-x-2">
                          {formData.comm_type === "doc" && (
                            <label className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={participant.isdocvisible}
                                onChange={() =>
                                  toggleDocVisibility(participant.person_id)
                                }
                                className="rounded"
                              />
                              <span className="text-xs">View Doc</span>
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              removeParticipant(participant.person_id)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader />
          ) : formData.comm_type === "meeting" ? (
            "Create Meeting"
          ) : (
            "Upload Document"
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskMemberMeetingForm;

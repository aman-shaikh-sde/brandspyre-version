// import { apiClient } from "src/services/apiClient";
// import {
//   Banknote,
//   CalendarCheck,
//   ClipboardList,
//   Flag,
//   Hash,
//   ListChecks,
//   Mail,
//   Milestone,
//   Network,
//   Percent,
//   Plus,
//   Tag,
//   Target,
//   Trash2,
//   User,
//   User2Icon,
// } from "lucide-react";
// import { useState } from "react";
// import toast from "react-hot-toast";
// import { AiFillProject } from "react-icons/ai";
// import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
// import { useAuthStore } from "src/stores/authStore";
// import useClientStore from "src/stores/ClientStore";
// import useLeadsStore from "src/stores/LeadsStore";
// import useProjectStore from "src/stores/ProjectStore";
// import useBranchStore from "src/stores/useBranchStore";
// import useEmployeeStore from "src/stores/useEmployeeStore";
// import { BASE_URL } from "~/constants/api";

// const AddNewTaskForm = ({ onSuccess, onCancel }) => {
//   const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);
//   const [loading, setLoading] = useState(false);
//   const clientcodeOptions = useClientStore((state) => state.clientscodeOptions);
//   const [error, setError] = useState(null);
//   const allProjectcodeOptions = useProjectStore(
//     (state) => state.allProjectcodeOptions
//   );
//   const employeeOption = useEmployeeStore(
//     (state) => state.branchEmployeeOptions
//   );
//   const campaignCodeOption = useLeadsStore(
//     (state) => state.campaigncodeOptions
//   );
// const milestonecodeOption=useProjectStore((state)=>state.allMilestonecodeOptions)
//   const token = useAuthStore((state) => state.accessToken);
//   const [formData, setFormData] = useState({
//     branchcode: "",
//     client_code: "",

//     project_code: "",
//     milestone_code: "",
//     task_title: "",
//     task_priority: "",
//     start_date: "",
//     end_date: "",
//     handler_by: "",
//     notes: "",
//     collaborate: [
//       {
//         staff_id: "",
//         status: "open",
//       },
//     ],
//     status: "draft",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleCollaborate = (index, e) => {
//     const { name, value } = e.target;
//     const updatedCollaborate = [...formData.collaborate];
//     updatedCollaborate[index] = {
//       ...updatedCollaborate[index],
//       [name]: value,
//     };
//     setFormData((prev) => ({
//       ...prev,
//       contacts: updatedCollaborate,
//     }));
//   };

//   const addCollaborate = () => {
//     setFormData((prev) => ({
//       ...prev,
//       collaborate: [
//         ...prev.collaborate,
//         {
//           staff_id: "",
//           status: "open",
//         },
//       ],
//     }));
//   };
//   const removeCollaborate = (index) => {
//     if (formData.collaborate.length === 1) return;
//     const updatedCollaborate = formData.collaborate.filter(
//       (_, i) => i !== index
//     );
//     setFormData((prev) => ({
//       ...prev,
//       collaborate: updatedCollaborate,
//     }));
//   };
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     const milestoneData = {
//       data: [
//         {
//           branchcode: formData.branchcode,
//           client_code: formData.client_code,
//           project_code: formData.project_code,
//           milestone_code: formData.milestone_code,
//           task_title: formData.task_title,
//           task_priority: formData.task_priority,
//           start_date: formData.start_date,
//           end_date: formData.end_date,
//           handler_by: formData.handler_by,
//           notes: formData.notes,
//           collaborate: formData.collaborate,
//           status: formData.status,
//         },
//       ],
//     };
//     console.log("formdataaa>>>fortaskkk", milestoneData);

//     try {
//       const response = await apiClient.post(
//         `/project/milestone/create`,
//         milestoneData,
//         {
//
//         }
//       );

//       if (response.status === 201) {
//         notify.success("Lead created successfully!");
//         onSuccess();
//       } else {
//         setError(response.data.message || "Failed to create lead");
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "An error occurred");
//       notify.error(error || "Error creating lead");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
//       {/* Milestone Basic Details Section */}
//       <div className="space-y-4">
//         <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
//           <Flag className="inline mr-2" /> Task Information
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <Hash className="inline mr-1" size={14} /> Branch Code
//             </p>
//             <select
//               name="branchcode"
//               value={formData.branchcode}
//               onChange={handleChange}
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               required
//             >
//               <option value="">Select Branch</option>
//               {branchCodeOption?.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <Network className="inline mr-1" size={14} /> Related Project
//             </p>
//             <select
//               name="project_code"
//               value={formData.project_code}
//               onChange={handleChange}
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               required
//             >
//               <option value="">Select Project</option>
//               {allProjectcodeOptions?.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <Milestone className="inline mr-1" size={14} /> Select Milestone
//             </p>
//             <select
//               name="milestone_code"
//               value={formData.milestone_code}
//               onChange={handleChange}
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               required
//             >
//               <option value="">Select Milestone</option>
//               {milestonecodeOption?.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <ClipboardList className="inline mr-1" size={14} /> Task Title
//               Task Title
//             </p>
//             <input
//               name="task_title"
//               value={formData.task_title}
//               onChange={handleChange}
//               type="text"
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               placeholder="Enter task name"
//             />
//           </div>
//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <User2Icon className="inline mr-1" size={14} /> Select Client
//             </p>
//             <select
//               name="client_code"
//               value={formData.client_code}
//               onChange={handleChange}
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               required
//             >
//               <option value="">Select Client</option>
//               {clientcodeOptions?.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <Tag className="inline mr-1" size={14} /> Task Priority
//             </p>
//             <select
//               name="task_priority"
//               value={formData.task_priority}
//               onChange={handleChange}
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               required
//             >
//               <option value="">Select Task Type</option>
//               <option value="minor">Minor</option>
//               <option value="major">Major</option>
//               <option value="critical">Critical</option>
//               <option value="blocker">Blocker</option>
//             </select>
//           </div>
//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <CalendarCheck className="inline mr-1" size={14} /> Start Date
//             </p>
//             <input
//               name="start_date"
//               value={formData.start_date}
//               onChange={handleChange}
//               type="date"
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//             />
//           </div>
//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <CalendarCheck className="inline mr-1" size={14} /> Due Date
//             </p>
//             <input
//               name="end_date"
//               value={formData.end_date}
//               onChange={handleChange}
//               type="date"
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//             />
//           </div>
//           {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <Banknote className="inline mr-1" size={14} /> Milestone Base
//               Amount
//             </p>
//             <input
//               name="base_amount"
//               value={formData.base_amount}
//               onChange={handleChange}
//               type="number"
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               placeholder="Enter amount"
//             />
//           </div>
//           <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//             <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//               <Percent className="inline mr-1" size={14} /> Addtional Amount
//             </p>
//             <input
//               name="additional_amount"
//               value={formData.additional_amount}
//               onChange={handleChange}
//               type="number"
//               className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//               placeholder="Enter Addtional Amount"
//             />
//           </div> */}
//         </div>
//         <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//           <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//             <User className="inline mr-1" size={14} /> Handle By
//           </p>
//           <select
//             name="handler_by"
//             value={formData.handler_by}
//             onChange={handleChange}
//             className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//             required
//           >
//             {employeeOption?.map((option) => (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//           <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//             <Tag className="inline mr-1" size={14} /> Status
//           </p>
//           <select
//             name="status"
//             value={formData.status}
//             onChange={handleChange}
//             className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//             required
//           >
//             <option value="active">Active</option>
//             <option value="drop">Drop</option>
//             <option value="draft">Draft</option>
//             <option value="paused">Paused</option>
//             <option value="completed">Completed</option>
//             <option value="archived">Archived</option>
//           </select>
//         </div>
//       </div>
//       <div className="space-y-4">
//         <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
//           Contacts
//         </h3>
//         {formData.collaborate.map((collobrate, index) => (
//           <div
//             key={index}
//             className="grid grid-cols-1 md:grid-cols-2 gap-4 relative"
//           >
//             <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//               <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 <User className="inline mr-1" size={14} /> Staff Id
//               </p>
//               <select
//                 name="staff_id"
//                 value={collobrate.staff_id}
//                 onChange={(e) => handleCollaborate(index, e)}
//                 className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//                 required
//               >
//                 {employeeOption?.map((option) => (
//                   <option key={option.value} value={option.value}>
//                     {option.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//               <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                 <Tag className="inline mr-1" size={14} /> Collabrate Status
//               </p>
//               <select
//                 name="status"
//                 value={collobrate.status}
//                 onChange={(e) => handleCollaborate(index, e)}
//                 className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
//                 required
//               >
//                 <option value="open">Open</option>
//                 <option value="closed">Closed</option>
//               </select>
//             </div>

//             {index > 0 && (
//               <button
//                 type="button"
//                 onClick={() => removeCollaborate(index)}
//                 className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
//               >
//                 <Trash2 size={16} />
//               </button>
//             )}
//           </div>
//         ))}

//         <button
//           type="button"
//           onClick={addCollaborate}
//           className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
//         >
//           <Plus size={16} /> Add Another Collobrate
//         </button>
//       </div>
//       <div className="space-y-4">
//         <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
//           <ListChecks className="inline mr-2" /> Notes
//         </h3>
//         <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//           <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
//             <Target className="inline mr-1" size={14} /> Task Notes
//           </p>
//           <textarea
//             name="notes"
//             value={formData.notes}
//             onChange={handleChange}
//             className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
//             placeholder="Enter the Task Notes"
//           />
//         </div>
//       </div>

//       {/* Dependencies Section */}
//       {/* <div className="space-y-4">
//         <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
//           <Hash className="inline mr-2" /> Dependencies
//         </h3>
//         <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
//           <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
//             Prerequisites
//           </p>
//           <textarea
//             className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[60px]"
//             placeholder="What needs to be completed before this milestone can start?"
//           />
//         </div>
//       </div> */}

//       <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//         <button
//           type="button"
//           className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
//           onClick={onCancel}
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           onClick={handleSubmit}
//           className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
//         >
//           {loading ? <ButtonLoader /> : "Create Milestone"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AddNewTaskForm;
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
import{formatDate} from '../../../../src/utils/dateUtils';
import AsyncSelect from "react-select/async";

const AddNewTaskForMilestone = ({milestone, onSuccess, onCancel }) => {
  console.log("milestoneedataa", milestone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamOptions, setTeamOptions] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const permissions = useAuthStore((state) => state.permissions);
  // const userRole = permissions[0].role;
  const userRole = useAuthStore((state) => state.role);
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
  const branchCodeOption =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];
  const milestonecodeOption = useProjectStore(
    (state) => state.allMilestonecodeOptions
  );

  const token = useAuthStore((state) => state.accessToken);

  const [formData, setFormData] = useState({
    branchcode: milestone.branchcode,
    milestone_code: milestone.milestone_code,
    task_title: "",
    task_priority: "",
    start_date: "",
    end_date: "",
    team_id: "",
    handler_by: "",
    notes: "",
    collaborate: [
      {
        subtask_title: "",
        staff_id: "",
        status: "open",
      },
    ],
    status: "draft",
  });

  // Fetch teams when branchcode changes
  useEffect(() => {
    if (formData.branchcode) {
      fetchTeams(formData.branchcode);
    } else {
      setTeamOptions([]);
      setTeamMembers([]);
    }
  }, [formData.branchcode]);

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

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await apiClient.get(
        `/teams/read/profile?team_id=${teamId}`
      );

      if (response.data && response.data.data) {
        // Filter out team leads (role === "lead")
        const members = response.data.data.members;
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const validateForm = () => {
    if (!formData.branchcode) {
      setError("Branch code is required");
      return false;
    }
    if (!formData.milestone_code) {
      setError("Milestone code is required");
      return false;
    }
    if (!formData.task_title) {
      setError("Task title is required");
      return false;
    }
    if (!formData.task_priority) {
      setError("Task priority is required");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const taskData = {
      data: [
        {
          branchcode: formData.branchcode,
          milestone_code: milestone.milestone_code,
          task_title: formData.task_title,
          task_priority: formData.task_priority,
          start_date: formData.start_date,
          end_date: formData.end_date,
          handler_by: formData.handler_by,
          team_id: formData.team_id,
          notes: formData.notes,
          collaborate: formData.collaborate,
          status: formData.status,
        },
      ],
    };

    try {
      const response = await apiClient.post(
        `/project/task/create`,
        taskData
      );

      if (response.status === 201) {
        notify.success("Task created successfully!");
        onSuccess();
      } else {
        const backendError = response.data?.data?.failed?.[0]?.error || response.data?.message || "Failed to create task";
        setError(backendError);
        notify.error(backendError);
      }
    } catch (err) {
      const backendError = err.response?.data?.data?.failed?.[0]?.error || err.response?.data?.message || "An error occurred";
      setError(backendError);
      notify.error(backendError);
    } finally {
      setLoading(false);
    }
  };




const loadTeams = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = teamOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };


const loadStaffs = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = teamMembers.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };


    const loadProjects = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = projectOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };

      const loadMilestones = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = milestoneOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };


        const loadBranches = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = branchCodeOption.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };






  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <h3 className="text-md  font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Flag className="inline mr-2" /> Task Information
        </h3>
        <h2 className="text-lg font-medium text-red-700 dark:text-gray-300 mt-2 text-center ">
      <span className="text-gray-600 mr-4"> Milestone Duration: </span>{formatDate(milestone.start_date)} - {formatDate(milestone.end_date)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Code
            </p>
           {/* <select
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
            </select>*/}

             <AsyncSelect
          cacheOptions
          defaultOptions={branchCodeOption}
          name="branchcode"
          loadOptions={loadBranches}
       onChange={(selected: Option | null) =>
    setFormData((prev) => ({
      ...prev,
      branchcode: selected ? selected.value : "",
    }))
  }
    value={
    branchCodeOption.find((opt) => opt.value === formData.branchcode) || null
  }
          // isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search branch"
        />





          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Users className="inline mr-1" size={14} /> Select Team
            </p>
{/*            <select
              name="team_id"
              value={formData.team_id}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
              disabled={!formData.branchcode}
            >
              <option value="">Select Team</option>
              {teamOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>*/}

                             <AsyncSelect
          cacheOptions
          defaultOptions={teamOptions}
          name="team_id"
          loadOptions={loadTeams}
          onChange={(selected: Option | null) =>
    setFormData((prev) => ({
      ...prev,
      team_id: selected ? selected.value : "",
    }))
  }
          value={teamOptions.find((opt) => opt.value === formData.team_id) || null}
          isDisabled={teamOptions.length === 0}
          placeholder="Select or search team"
        />



          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Milestone className="inline mr-1" size={14} /> Select Milestone
            </p>
            <select
              name="milestone_code"
              value={formData.milestone_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Milestone</option>
              {milestonecodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Task Title
            </p>
            <input
              name="task_title"
              value={formData.task_title}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Task Priority
            </p>
            <select
              name="task_priority"
              value={formData.task_priority}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Priority</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
              <option value="blocker">Blocker</option>
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Start Date
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

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Due Date
            </p>
            <input
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <User className="inline mr-1" size={14} /> Handle By (Team Lead)
          </p>
          <input
            name="handler_by"
            value={formData.handler_by}
            readOnly
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Tag className="inline mr-1" size={14} /> Status
          </p>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
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
      </div>
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
          {/*    <select
                name="staff_id"
                value={collaborate.staff_id}
                onChange={(e) => handleCollaborateChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!formData.team_id}
              >
                <option value="">Select Team Member</option>
                {teamMembers?.map((member) => (
                  <option key={member.staff_id} value={member.staff_id}>
                    {member.staff_name} ({member.department})
                  </option>
                ))}
              </select>*/}

                 <AsyncSelect
  cacheOptions
  defaultOptions={teamMembers.map((member) => ({
    value: member.staff_id,
    label: `${member.staff_name} (${member.staff_id})`,
  }))}
  loadOptions={(inputValue: string) =>
    Promise.resolve(
      teamMembers
        .filter(
          (member) =>
            member.staff_name.toLowerCase().includes(inputValue.toLowerCase()) ||
            member.staff_id.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((member) => ({
          value: member.staff_id,
          label: `${member.staff_name} (${member.staff_id})`,
        }))
    )
  }
  isDisabled={!formData.team_id}
  value={
    collaborate.staff_id
      ? {
          value: collaborate.staff_id,
          label: `${collaborate.staff_id}`,
        }
      : null
  }
  onChange={(selectedOption) =>
    handleCollaborateChange(index, {
      target: { name: "staff_id", value: selectedOption?.value ?? "" },
    })
  }
/>

              
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
          disabled={!formData.team_id}
        >
          <Plus size={16} /> Add Another Collaborator
        </button>
      </div>{" "}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <ListChecks className="inline mr-2" /> Notes
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <Target className="inline mr-1" size={14} /> Task Notes
          </p>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Enter the Task Notes"
          />
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
          {loading ? <ButtonLoader /> : "Create Task"}
        </button>
      </div>
    </div>
  );
};

export default AddNewTaskForMilestone;

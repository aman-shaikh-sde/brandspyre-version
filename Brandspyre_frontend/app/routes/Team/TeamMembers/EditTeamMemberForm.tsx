// import React, { useState, useEffect } from "react";
// import { apiClient } from "src/services/apiClient";
// import { BASE_URL } from "~/constants/api";
// import toast, { Toaster } from "react-hot-toast";
// import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
// import { useAuthStore } from "src/stores/authStore";
// import useBranchStore from "src/stores/useBranchStore";
// import useEmployeeStore from "src/stores/useEmployeeStore";

// function EditTeamMemberForm({ member, onSuccess, onCancel }) {
//   const [formData, setFormData] = useState({
//     team_id: "",
//     branchcode: "",
//     staff_id: "",
//     role_in_team: "",
//     status: "active",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const token = useAuthStore((state) => state.accessToken);
//   const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);
//   const employeeOption = useEmployeeStore(
//     (state) => state.branchEmployeeOptions
//   );
//   useEffect(() => {
//     if (member) {
//       setFormData({
//         team_id: member.team_id,
//         branchcode: member.branchcode,
//         staff_id: member.staff_id,
//         role_in_team: member.role_in_team,
//         status: member.status,
//       });
//     }
//   }, [member]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const teamData = {
//       userData: {
//         team_id: formData.team_id,
//         branchcode: formData.branchcode,
//         staff_id: formData.staff_id,
//         role_in_team: formData.role_in_team,
//         status: formData.status,
//       },
//     };
//     console.log("teamupdatedata", teamData);
//     try {
//       const response = await apiClient.put(`/teams/edit`, teamData, {
//
//       });
//       if (response.status === 201) {
//         onSuccess();
//       } else {
//         setError(response.data.message || "Failed to update team");
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "An error occurred");
//       notify.error(`${error}, Error in update team`, {
//         style: {
//           border: "1px solid  rgb(185 28 28)",
//           padding: "14px",
//           width: "900px",
//           color: " rgb(185 28 28)",
//         },
//         iconTheme: {
//           primary: " rgb(185 28 28)",
//           secondary: "#FFFAEE",
//         },
//       });
//       setError(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="text-medium dark:bg-gray-800 dark:text-gray-200">
//       {error && <div className="text-red-500 mb-4">{error}</div>}
//       <Toaster position={toastposition} />
//       <form onSubmit={handleSubmit}>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//           <div>
//             <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//               Role In Team
//             </label>
//             <input
//               name="role_in_team"
//               value={formData.role_in_team}
//               onChange={handleChange}
//               className="max-w-[400px] w-[300px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               rows="3"
//               placeholder="Role In Team"
//             />
//           </div>

//           {/* Status */}
//           <div className="flex flex-col py-2 text-left">
//             <label className="text-sm text-gray-700 dark:text-gray-300 mb-1">
//               Status
//             </label>
//             <select
//               name="status"
//               value={formData.status}
//               onChange={handleChange}
//               className="max-w-[400px] w-[300px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               required
//             >
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//           </div>
//         </div>
//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-hover-secondary)] text-gray-800 dark:text-gray-700  hover-effect rounded  dark:hover:bg-gray-500 transition"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white rounded hover-effect transition"
//             disabled={loading}
//           >
//             {loading ? <ButtonLoader /> : "Update Branch"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default EditTeamMemberForm;
import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { ClipboardList, FileText } from "lucide-react";

function EditTeamMemberForm({ member, onSuccess, onCancel }) {
  console.log("teammember in editt",member)
  const id=member.id;
  const [formData, setFormData] = useState({
    team_id: "",
    branchcode: "",
    staff_id: "",
    role: "member",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (member) {
      setFormData({
        team_id: member.team_id,
        branchcode: member.branchcode,
        staff_id: member.staff_id,
        role: member.role,
        status: member.status,
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const teamData = {
      userData: {
        team_id: formData.team_id,
        branchcode: formData.branchcode,
        staff_id: formData.staff_id,
        role: formData.role,
        status: formData.status,
      },
    };

    try {
      const response = await apiClient.put(`/members/edit/${id}`, teamData);
      if (response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update team");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(`${error}, Error in update team`, {
        style: {
          border: "1px solid  rgb(185 28 28)",
          padding: "14px",
          width: "900px",
          color: " rgb(185 28 28)",
        },
        iconTheme: {
          primary: " rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {error && <div className="text-red-500 mb-4">{error}</div>}
<form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
            Edit Team Member
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <ClipboardList className="inline mr-1" size={14} /> Role In Team
              </p>
              <input
                name="role_in_team"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="Role In Team"
                required
              />
            </div> */}

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <FileText className="inline mr-1" size={14} /> Status
              </p>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Update Member"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditTeamMemberForm;
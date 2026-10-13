// import { useEffect, useState } from "react";
// import { apiClient } from "src/services/apiClient";
// import { BASE_URL } from "~/constants/api";
// import toast, { Toaster } from "react-hot-toast";
// import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
// import { useAuthStore } from "src/stores/authStore";
// import {
//   Building,
//   Calendar,
//   ClipboardList,
//   DollarSign,
//   FileText,
//   IndianRupee,
//   Percent,
//   User,
// } from "lucide-react";
// import useEmployeeStore from "src/stores/useEmployeeStore";
// const departmentOptions = [
//   "architecture",
//   "visualization",
//   "structural",
//   "drafting",
//   "hr",
//   "sales",
//   "consulting",
// ];



// const AddSalaryRevision = ({ onCancel }) => {
//   return (
//     <>
//       <div className="text-medium dark:bg-gray-800 dark:text-gray-200">
//         <div className="text-medium flex gap-5">
//           <div className="flex flex-col py-2 text-left mt-1">
//             <label
//               htmlFor=""
//               className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//             >
//               Employee Name
//             </label>
//             <input
//               className=" bg-blue-200/25  w-[300px] dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               type="text"
//             />
//           </div>

//           <div className="flex flex-col py-2 text-left mt-1">
//             <label
//               htmlFor=""
//               className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//             >
//               Department
//             </label>
//             <input
//               className=" bg-blue-200/25  w-[300px] dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               type="text"
//             />
//           </div>
//         </div>
//         <div>
//           <div className="text-medium flex gap-5">
//             <div className="flex flex-col py-2 text-left mt-1">
//               <label
//                 htmlFor=""
//                 className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//               >
//                 Designation
//               </label>
//               <input
//                 className=" bg-blue-200/25  w-[300px] dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//                 type="text"
//               />
//             </div>
            
//             <div className="flex flex-col py-2 text-left mt-1 w-[300px] ">
//               <label
//                 htmlFor=""
//                 className="text-sm text-gray-700 dark:text-gray-300 mb-3 "
//               >
//                 Current Salary
//               </label>
//               <input
//                 className=" bg-blue-200/25  w-[300px] dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//                 type="text"
//               />
//             </div>
//           </div>
//         </div>
    
//         <div className="text-medium sm:flex justify-between">
//              <div className="flex flex-col py-2 text-left mt-1 w-[180px]">
//             <label
//               htmlFor=""
//               className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//             >
//               Proposed Salary
//             </label>
//             <input
//               className="  bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               type="text"
//             />
//           </div>
//           <div className="flex flex-col py-2 text-left mt-1 w-[180px]">
//             <label
//               htmlFor=""
//               className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//             >
//               Increment Percentage
//             </label>
//             <input
//               className="  bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               type="text"
//             />
//           </div>
//           <div className="flex flex-col py-2 text-left mt-1 w-[180px]">
//             <label
//               htmlFor=""
//               className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//             >
//               Requested By
//             </label>
//             <input
//               className="  bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded"
//               type="text"
//             />
//           </div>
//         </div>
//         <div className="text-medium sm:flex gap-5">
//           <div className="flex flex-col py-2 text-left mt-1">
//             <label
//               htmlFor=""
//               className="text-sm text-gray-700 dark:text-gray-300 mb-3"
//             >
//               Status
//             </label>
//             <input className="max-w-full w-[300px] bg-blue-200/25 dark:bg-gray-700 text-sm px-2 py-2 border border-gray-400 dark:border-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600 focus:border-gray-400 dark:focus:border-gray-500 rounded" />
//           </div>
//         </div>
//         <div className="flex justify-end gap-3 mt-6">
//           <button
//             type="button"
//             className="px-4 py-2 bg-red-700/20 text-red-700 hover-effect  dark:text-gray-700 rounded hover:bg-red-700/15 dark:hover:bg-gray-500 transition"
//             onClick={onCancel}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)]  text-white rounded hover:bg-gradient-to-b hover-effect transition"
//           >
//             Submit
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };
// export default AddSalaryRevision;





import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import {
  Building,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  Percent,
  User,
} from "lucide-react";

const departmentOptions = [
  "architecture",
  "visualization",
  "structural",
  "drafting",
  "hr",
  "sales",
  "consulting",
];

const AddSalaryRevision = ({ onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = storeRole || (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : "") || "";
  const branchcodeForNor = useAuthStore((state) => state.branchcode);

  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);

  const [formData, setFormData] = useState({
    staff_id: "",
    department: "",
    designation: "",
    current_salary: "",
    proposed_salary: "",
    increment_percentage: "",
    requested_by: "",
    status: "pending",
  });

  useEffect(() => {
    if (selectedDepartment) {
      fetchStaffOptions();
    }
  }, [selectedDepartment]);

  const fetchStaffOptions = async () => {
    setIsFetchingStaff(true);
    try {
      let url = `/users/dropdown?department=${selectedDepartment}`;
      if (userRole !== "superadmin") {
        url += `&branchcode=${branchcodeForNor}`;
      }
      const response = await apiClient.get(url);
      if (response.data && response.data.data) {
        const options = response.data.data.map((user) => ({
          value: user.staff_id,
          label: `${user.firstname} ${user.lastname} - ${user.designation}`,
        }));
        setStaffOptions(options);
      }
    } catch (err) {
      notify.error("Failed to fetch staff options", {
        style: {
          border: "1px solid rgb(185 28 28)",
          padding: "14px",
          color: "rgb(185 28 28)",
        },
        iconTheme: {
          primary: "rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
    } finally {
      setIsFetchingStaff(false);
    }
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setFormData((prev) => ({ ...prev, department: e.target.value, staff_id: "" }));
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

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
    try {
      const response = await apiClient.post(
        `/salary/revision/create`,
        { revisionData: formData }
      );

      if (response.status === 201) {
        onSuccess?.();
        notify.success("Salary revision request created successfully!");
      } else {
        setError(response.data.message || "Failed to create revision");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error creating revision", {
        style: {
          border: "1px solid rgb(185 28 28)",
          padding: "14px",
          color: "rgb(185 28 28)",
        },
        iconTheme: {
          primary: "rgb(185 28 28)",
          secondary: "#FFFAEE",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
{/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Salary Revision Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Building className="inline mr-1" size={14} /> Department <span className="text-red-700">*</span>
            </p>
            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
              required
            >
              <option value="">Select Department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Staff */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Employee <span className="text-red-700">*</span>
            </p>
            {isFetchingStaff ? (
              <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
            ) : (
              <select
                name="staff_id"
                value={formData.staff_id}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
                required
              >
                <option value="">Select Staff</option>
                {staffOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Designation */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Designation
            </p>
            <input
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
              placeholder="Designation"
            />
          </div>

          {/* Current Salary */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Current Salary
            </p>
            <input
              name="current_salary"
              value={formData.current_salary}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
              placeholder="Current Salary"
            />
          </div>

          {/* Proposed Salary */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Proposed Salary
            </p>
            <input
              name="proposed_salary"
              value={formData.proposed_salary}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
              placeholder="Proposed Salary"
            />
          </div>

          {/* Increment % */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> Increment %
            </p>
            <input
              name="increment_percentage"
              value={formData.increment_percentage}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
              placeholder="Increment %"
            />
          </div>

          {/* Requested By */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Requested By
            </p>
            <input
              name="requested_by"
              value={formData.requested_by}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
              placeholder="Requested By"
            />
          </div>

          {/* Status */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Status
            </p>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium mt-1 focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
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
          {loading ? <ButtonLoader /> : "Submit Revision"}
        </button>
      </div>
    </div>
  );
};

export default AddSalaryRevision;

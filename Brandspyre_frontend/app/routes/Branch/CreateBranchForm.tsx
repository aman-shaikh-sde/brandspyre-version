import { apiClient } from "src/services/apiClient";
import { useEffect, useState } from "react";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import {
  CalendarCheck,
  ClipboardList,
  Hash,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  FileText,
  File,
  Building,
  Contact2,
  User2,
  PlusCircleIcon,
  NetworkIcon,
} from "lucide-react";
import useBranchStore from "src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";

const CreateBranchForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const allEmployeecodeOptions = useEmployeeStore(
    (state) => state.allEmployeecodeOptions
  );
  console.log("employeeopionsmnagerr", allEmployeecodeOptions);
  const { fetchEmployee, fetchBranchEmployee, isStoreLoading } =
    useEmployeeStore();
  // const [formData, setFormData] = useState({
  //   branch_hours: "",
  //   branchcode: "",
  //   role: "",
  //   name: "",
  //   location: "",
  //   mobile: "",
  //   email: "",
  //   manager_id: "",
  //   managername: "",
  //   notes: "",
  //   status: "active",
  //   closeReason: "",
  // });

    const [formData, setFormData] = useState({
    branch_hours: "",
    branchcode: "",
    role: "admin",
    name: "",
    location: "",
    mobile: "",
    email: "",
    manager_id: "BRCODE_01",     // default manager id
    managername: "almino",  // default manager name
    notes: "",
    status: "active",
    closeReason: "",
});


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    fetchEmployee(token);
  }, [token]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post(`/branch/create`, formData);
      if (response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to create branch");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(`${error}, Error in create Branch`, {
        style: {
          border: "1px solid rgb(185 28 28)",
          padding: "14px",
          width: "900px",
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
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
         <NetworkIcon className="inline mr-2"/> Branch Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Name<span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Branch Name"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Code <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="branchcode"
              value={formData.branchcode}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Branch Code"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Branch Hours <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="branch_hours"
              value={formData.branch_hours}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Branch Hours"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <MapPin className="inline mr-1" size={14} /> Location <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Branch Location"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
           <Contact2 className="inline mr-2"/>  Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Phone className="inline mr-1" size={14} /> Mobile <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Branch Mobile Number"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Mail className="inline mr-1" size={14} /> Email <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="email"
              placeholder="Branch Email"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
{/*        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
         <User2 className="inline mr-2"/>    Manager Information 
        </h3>
*/}        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700" style={{ display: "none" }}
>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Manager ID <span className="text-red-700 text-lg m-2">*</span>
            </p>
            {/*<select
              name="manager_id"
              value={formData.manager_id}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              {allEmployeecodeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>*/}
            <input type="hidden" name="manager_id" value={formData.manager_id} />

          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700" style={{ display: "none" }}
>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Manager Name <span className="text-red-700 text-lg m-2">*</span>
            </p>
<input type="hidden" name="managername" value={formData.managername} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <PlusCircleIcon className="inline mr-2"/>   Additional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="inActive">Inactive</option>
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Role <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Role"
              required
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <FileText className="inline mr-1" size={14} /> Notes
          </p>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Branch notes..."
            required
          />
        </div>

        {formData.status === "inActive" && (
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <FileText className="inline mr-1" size={14} /> Close Reason
            </p>
            <textarea
              name="closeReason"
              value={formData.closeReason}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[60px]"
              placeholder="Closing reason..."
              required
            />
          </div>
        )}
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
          {loading ? <ButtonLoader /> : "Create Branch"}
        </button>
      </div>
    </div>
  );
};

export default CreateBranchForm;

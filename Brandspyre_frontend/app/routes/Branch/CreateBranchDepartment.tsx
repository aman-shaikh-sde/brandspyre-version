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

const CreateBranchDepartment = ({branch, onSuccess, onCancel }) => {
    console.log("roleeebranchhc",branch)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchs = useAuthStore((state) => state.branchcode);
  const allEmployeecodeOptions = useEmployeeStore(
    (state) => state.allEmployeecodeOptions
  );
  console.log("employeeopionsmnagerr", allEmployeecodeOptions);
  const { fetchEmployee, fetchBranchEmployee, isStoreLoading } =
    useEmployeeStore();
  const branchData = branch?.[0];
  console.log('branchdataaa', branchData);
  const [formData, setFormData] = useState({
    branchcode: branchData?.branchcode || "",
    department: "",
    status: "active",
  });

  useEffect(() => {
    if (branch?.[0]?.branchcode) {
      setFormData((prev) => ({
        ...prev,
        branchcode: branch[0].branchcode,
      }));
    }
  }, [branch]);

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
      const response = await apiClient.post(`/createDepartment`, formData);
      if (response.status === 201) {
        onSuccess();
        alert ("department created successfully!");
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
          <PlusCircleIcon className="inline mr-2"/>   Add Department
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
              <ClipboardList className="inline mr-1" size={14} /> Department <span className="text-red-700 text-lg m-2">*</span>
            </p>
            <input
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Department"
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
            placeholder="Department description or notes..."
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

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="crm-btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="crm-btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : "Create Department"}
        </button>
      </div>
    </div>
  );
};

export default CreateBranchDepartment;

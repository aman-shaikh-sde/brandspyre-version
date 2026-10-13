import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Calendar, CalendarDays, ClipboardList, Hash, Languages, Notebook } from "lucide-react";

function EditLeaveForm({ branch, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    description: "",
    total_days: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchcode = useAuthStore((state) => state.branchcode);
  useEffect(() => {
    if (branch) {
        console.log("branchdata for leaveedit",branch)
      setFormData({
        name: branch.name || "",
        year: branch.year || "",
        description: branch.description || "",
        total_days: branch.total_days || "",
        status: branch.status || "",
      });
    }
  }, [branch]);

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
    const softData = {
      branchcode: branchcode,
      name: formData.name,
      year: formData.year,
      description: formData.description,
      total_days: Number(formData.total_days),
      status: formData.status,
    };
    try {
      const response = await apiClient.put(
        `/master/leavetypes/edit/${branch.id}`,
        softData
      );
      if (response.status === 200 || response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update leave");
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || "An error occurred";
      setError(errMsg);
      notify.error(`${errMsg}, Error in edit leave`, {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-medium dark:bg-gray-800 dark:text-gray-200">
      {error && <div className="text-red-500 mb-4">{error}</div>}
<form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Leave Type
            </p>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Leave Type"
            />
          </div>
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar className="inline mr-1" size={14} /> Year
            </p>
            <input
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              name="year"
              value={formData.year}
              onChange={handleChange}
              placeholder="Enter Year"
              required
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Notebook className="inline mr-1" size={14} /> Description
            </p>
            <input
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter Description"
              required
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarDays className="inline mr-1" size={14} /> Total Days
            </p>
            <input
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              name="total_days"
              value={formData.total_days}
              onChange={handleChange}
              placeholder=" Enter Total Days"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} />
              Type Status
            </p>
            <select
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="">Select Type Status</option>
              <option value="open">Open</option>
              <option value="close">Close</option>
            </select>
          </div>
        </div>
     
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[var(--color-secondary)] hover:bg-[var(--color-hover-secondary)] text-gray-800 dark:text-gray-700  hover-effect rounded  dark:hover:bg-gray-500 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-hover)] text-white rounded hover-effect transition"
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditLeaveForm;

import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Hash } from "lucide-react";

function EditSoftwareForm({ branch, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchcode = useAuthStore((state) => state.branchcode);
  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || "",
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
    };
    try {
      const response = await apiClient.put(
        `/master/software/edit/${branch.id}`,
        softData
      );
      if (response.status === 200 || response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update software");
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || "An error occurred";
      setError(errMsg);
      notify.error(`${errMsg}, Error in edit software`,
         {
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
           <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Hash className="inline mr-1" size={14} /> Software Title
          </p>
          <input
            type="text"
             name="name"
              value={formData.name}
              onChange={handleChange}
            className="w-[300px] bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            placeholder="Enter Software name"
          />
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

export default EditSoftwareForm;

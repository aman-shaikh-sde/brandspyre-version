import { apiClient } from "src/services/apiClient";
import { useState } from "react";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Hash } from "lucide-react";

const CreateSoftwareForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchcode=useAuthStore((state)=>state.branchcode);
  const [formData, setFormData] = useState({
    name: "",
  });
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
      name: formData.name
    };
    try {
      const response = await apiClient.post(`/master/software/create`, softData);
      if (response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to create software title");
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || "An error occurred";
      setError(errMsg);
      notify.error(`${errMsg}, Error in creating software title` );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="text-medium dark:bg-gray-800 dark:text-gray-200">
{error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
     
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Hash size={14} className="text-slate-400" /> Software Title <span className="text-red-600 font-bold">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. AutoCAD 2026 / Revit Enterprise"
              required
              className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 cursor-pointer text-xs transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Create Software Title"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreateSoftwareForm;

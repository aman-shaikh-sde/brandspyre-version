import { apiClient } from "src/services/apiClient";
import { CalendarClock, Tag, BookOpenText, Hash, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useLeadsStore from "src/stores/LeadsStore";
import useBranchStore from "src/stores/useBranchStore";
import { BASE_URL } from "~/constants/api";

const EditFollowupForm = ({ leadId, followupId, onSuccess, onCancel }) => {
  console.log("leadidddddddfolowup", leadId, followupId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);
  const campaignCodeOption = useLeadsStore(
    (state) => state.campaigncodeOptions
  );
  const [followData, setFollowData] = useState(null);

  const [formData, setFormData] = useState({
    branchcode: "",
    campaign_code: "",
    lead_id: leadId,
    next_date: new Date().toISOString().split("T")[0],
    status: "active",
    notes: "",
  });

  useEffect(() => {
    const fetchFollowup = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(
          `/campaign/followup/read/${followupId}`
        );
        setFollowData(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchFollowup();
  }, [followupId, token]);
  console.log("setfollowdataaa", followData);

  useEffect(() => {
    if (followData) {
      setFormData({
        branchcode: followData.branchcode || "",
        campaign_code: followData.campaign_code || "",
        lead_id: leadId,
        next_date: followData.next_date || followData.nextfollowupdate || new Date().toISOString().split("T")[0],
        status: followData.status || "active",
        notes: followData.notes || followData.summary || "",
      });
    }
  }, [followData, leadId]);

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

    const apiData = {
      data: formData,
    };

    try {
      const response = await apiClient.put(
        `/campaign/followup/edit/${followupId}`,
        apiData
      );

      if (response.status === 201) {
        notify.success("Followup updated successfully!");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update followup");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error updating followup");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this followup?"))
      return;

    setLoading(true);
    try {
      const response = await apiClient.delete(
        `/campaign/followup/delete/${followupId}`,
        {
          data: {
            data: {
              branchcode: formData.branchcode,
              campaign_code: formData.campaign_code,
              lead_id: leadId,
            },
          },
        }
      );

      if (response.status === 201) {
        notify.success("Followup deleted successfully!");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to delete followup");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error deleting followup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Edit Followup
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
              <Hash className="inline mr-1" size={14} /> Camapign Code
            </p>
            <select
              name="campaign_code"
              value={formData.campaign_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Camapign</option>
              {campaignCodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarClock className="inline mr-1" size={14} /> Next Follow-up
              Date
            </p>
            <input
              name="next_date"
              value={formData.next_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
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
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookOpenText className="inline mr-2" /> Notes
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Enter followup notes..."
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleDelete}
          className="px-5 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <ButtonLoader />
          ) : (
            <>
              <Trash2 size={16} /> Delete
            </>
          )}
        </button>

        <div className="flex justify-end gap-4 ml-auto">
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
            onClick={handleSubmit}
            className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Update Followup"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFollowupForm;

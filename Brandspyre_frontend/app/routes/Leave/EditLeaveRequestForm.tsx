import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Calendar, ClipboardList, FileText, Clock, ArrowRight } from "lucide-react";

const EditLeaveRequestForm = ({ leaveRequest, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
    remarks: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);

  const leaveTypeOptions = [
    { value: "casual", label: "Casual Leave" },
    { value: "sick", label: "Sick Leave" },
    { value: "event", label: "Event Leave" },
  ];

  useEffect(() => {
    if (leaveRequest) {
      setFormData({
        leave_type: leaveRequest.leave_type || "",
        start_date: leaveRequest.start_date || "",
        end_date: leaveRequest.end_date || "",
        reason: leaveRequest.reason || "",
        remarks: leaveRequest.remarks || ""
      });
    }
  }, [leaveRequest]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };
    console.log("leaverequesttt",leaveRequest)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setError("End date cannot be before start date");
      notify.error("End date cannot be before start date");
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.put(
        `/users/leavereq/edit/${leaveRequest.req_id}`,
        formData
      );

      if (response.status === 200) {
        notify.success("Leave request updated successfully");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update leave request");
        notify.error(response.data.message || "Failed to update leave request");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(err.response?.data?.message || "Failed to update leave request");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Clock className="inline mr-2" /> Update Leave Request
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Leave Type
            </p>
            <select
              name="leave_type"
              value={formData.leave_type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              {leaveTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar className="inline mr-1" size={14} /> Start Date
            </p>
            <input
              name="start_date"
              type="date"
              value={formatDateForInput(formData.start_date)}
              onChange={(e) => handleDateChange("start_date", e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar className="inline mr-1" size={14} /> End Date
            </p>
            <input
              name="end_date"
              type="date"
              value={formatDateForInput(formData.end_date)}
              onChange={(e) => handleDateChange("end_date", e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
              min={formData.start_date || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <FileText className="inline mr-1" size={14} /> Reason
          </p>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Reason for leave..."
            required
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <FileText className="inline mr-1" size={14} /> Remarks
          </p>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[60px]"
            placeholder="Additional remarks..."
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center py-2">{error}</div>
      )}

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
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : "Update Leave Request"}
        </button>
      </div>
    </div>
  );
};

export default EditLeaveRequestForm;
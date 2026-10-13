import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Calendar, ClipboardList, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const HRLeaveApprovalForm = ({ leaveRequest, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    action: "approved",
    remarks: "",
    approved_dates: [],
    approval_type: "full" 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const token = useAuthStore((state) => state.accessToken);

  const getAllDatesInRange = (startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  useEffect(() => {
    if (leaveRequest) {
      const allDates = getAllDatesInRange(leaveRequest.start_date, leaveRequest.end_date);
      setSelectedDates(allDates);
      
      setFormData({
        action: leaveRequest.status === "pending" ? "approved" : leaveRequest.status,
        remarks: leaveRequest.remarks || "",
        approved_dates: allDates.map(date => date.toISOString().split('T')[0]),
        approval_type: "full"
      });
    }
  }, [leaveRequest]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === "action" || name === "approval_type" ? { approved_dates: [] } : {})
    }));
  };

  const handleDateSelection = (date) => {
    const dateString = date.toISOString().split('T')[0];
    setFormData(prev => {
      const newApprovedDates = prev.approved_dates.includes(dateString)
        ? prev.approved_dates.filter(d => d !== dateString)
        : [...prev.approved_dates, dateString];
      
      return {
        ...prev,
        approved_dates: newApprovedDates,
        approval_type: newApprovedDates.length === selectedDates.length ? "full" : "partial"
      };
    });
  };

  const handleSelectAllDates = () => {
    const allDateStrings = selectedDates.map(date => date.toISOString().split('T')[0]);
    setFormData(prev => ({
      ...prev,
      approved_dates: allDateStrings,
      approval_type: "full"
    }));
  };

  const handleClearDates = () => {
    setFormData(prev => ({
      ...prev,
      approved_dates: [],
      approval_type: "partial"
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.action === "approved" && formData.approval_type === "partial" && formData.approved_dates.length === 0) {
      setError("Please select at least one date for partial approval");
      notify.error("Please select at least one date for partial approval");
      setLoading(false);
      return;
    }

    try {
      const payload = formData.approval_type === "full" 
        ? { action: formData.action, remarks: formData.remarks }
        : { 
            action: formData.action, 
            remarks: formData.remarks,
            approved_dates: formData.approved_dates 
          };

      const response = await apiClient.put(
        `/users/leaveaproved/edit/${leaveRequest.req_id}`,
        payload
      );

      if (response.status === 200) {
        notify.success(`Leave request ${formData.action} successfully`);
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update leave status");
        notify.error(response.data.message || "Failed to update leave status");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(err.response?.data?.message || "Failed to update leave status");
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <ClipboardList className="inline mr-2" /> Leave Request Approval
        </h3>

        <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Staff ID
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                {leaveRequest?.staff_id}
              </p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Leave Type
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 capitalize">
                {leaveRequest?.leave_type}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Start Date
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                {formatDateDisplay(leaveRequest?.start_date)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                End Date
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                {formatDateDisplay(leaveRequest?.end_date)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Reason
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
              {leaveRequest?.reason}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Action
            </p>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="approved"
                  checked={formData.action === "approved"}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-green-600 dark:text-green-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <CheckCircle className="inline mr-1" size={14} /> Approve
                </span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="rejected"
                  checked={formData.action === "rejected"}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-red-600 dark:text-red-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <XCircle className="inline mr-1" size={14} /> Reject
                </span>
              </label>
            </div>
          </div>

          {formData.action === "approved" && (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Approval Type
                </p>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="approval_type"
                      value="full"
                      checked={formData.approval_type === "full"}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600 dark:text-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Full Approval (All Days)
                    </span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="approval_type"
                      value="partial"
                      checked={formData.approval_type === "partial"}
                      onChange={handleChange}
                      className="form-radio h-4 w-4 text-blue-600 dark:text-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Partial Approval (Select Dates)
                    </span>
                  </label>
                </div>
              </div>

              {formData.approval_type === "partial" && (
                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Select Dates to Approve
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllDates}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearDates}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {selectedDates.map((date) => {
                      const dateString = date.toISOString().split('T')[0];
                      const isSelected = formData.approved_dates.includes(dateString);
                      
                      return (
                        <button
                          key={dateString}
                          type="button"
                          onClick={() => handleDateSelection(date)}
                          className={`p-2 rounded text-center text-sm ${
                            isSelected
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              <FileText className="inline mr-1" size={14} /> Remarks
            </p>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
              placeholder={
                formData.action === "approved" 
                  ? formData.approval_type === "full" 
                    ? "Approval remarks..." 
                    : "Partial approval remarks..."
                  : "Rejection reason..."
              }
              required
            />
          </div>
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
          className={`px-5 py-2 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm ${
            formData.action === "approved" 
              ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
              : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
          }`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : 
            formData.action === "approved" 
              ? formData.approval_type === "full" 
                ? "Approve All Days" 
                : `Approve ${formData.approved_dates.length} Days`
              : "Reject Leave Request"
          }
        </button>
      </div>
    </div>
  );
};

export default HRLeaveApprovalForm;
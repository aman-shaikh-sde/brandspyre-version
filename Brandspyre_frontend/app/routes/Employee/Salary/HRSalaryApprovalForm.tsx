import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { Award, Calendar, Percent, CheckCircle, XCircle } from "lucide-react";

const HRSalaryApprovalForm = ({ salaryRequest, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);

  // Initialize form data with the salaryRequest props
  const [formData, setFormData] = useState({
    performance_id: salaryRequest?.performance_id || "",
    hr_rating: salaryRequest?.hr_rating || "",
    increment_percentage: salaryRequest?.increment_percentage || "",
    closingDate: salaryRequest?.closingDate || "",
    increment_effective_date: salaryRequest?.increment_effective_date || "",
    status: salaryRequest?.status || "pending",
  });

  // Update form data when salaryRequest prop changes
  useEffect(() => {
    if (salaryRequest) {
      setFormData({
        performance_id: salaryRequest.performance_id || "",
        hr_rating: salaryRequest.hr_rating || "",
        increment_percentage: salaryRequest.increment_percentage || "",
        closingDate: salaryRequest.closingDate || "",
        increment_effective_date: salaryRequest.increment_effective_date || "",
        status: salaryRequest.status || "pending",
      });
    }
  }, [salaryRequest]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      hr_rating: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put(
        `/users/hr_rating/edit`,
        {
          reviewData: {
            performance_id: formData.performance_id,
            hr_rating: formData.hr_rating,
            increment_percentage: formData.increment_percentage,
            closingDate: formData.closingDate,
            increment_effective_date: formData.increment_effective_date,
            status: formData.status,
          },
        }
      );

      if (response.status === 200) {
        notify.success("Performance rating updated successfully!");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update performance rating");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error updating performance rating");
    } finally {
      setLoading(false);
    }
  };

  // Rating scale component
  const RatingScale = ({ value, onChange }) => (
    <div className="flex items-center gap-2 mt-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm 
            ${value >= rating ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          {rating}
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {value ? (
          value <= 2 ? (
            <span className="text-red-500 flex items-center">
              <XCircle size={14} className="mr-1" /> Needs Improvement
            </span>
          ) : value <= 4 ? (
            <span className="text-yellow-500 flex items-center">
              <CheckCircle size={14} className="mr-1" /> Good
            </span>
          ) : (
            <span className="text-green-500 flex items-center">
              <Award size={14} className="mr-1" /> Excellent
            </span>
          )
        ) : null}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 bg-white p-6 rounded-lg">
<h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
        HR Performance Review
      </h2>

      {/* Performance ID */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Performance ID
        </p>
        <input
          name="performance_id"
          value={formData.performance_id}
          className="w-full bg-transparent text-sm font-medium text-gray-900 mt-1 focus:outline-none"
          readOnly
        />
      </div>

      {/* HR Rating */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
          <Award className="mr-1" size={14} /> HR Rating (1-5)
        </p>
        <RatingScale
          value={formData.hr_rating}
          onChange={handleRatingChange}
        />
      </div>

      {/* Increment Percentage */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
          <Percent className="mr-1" size={14} /> Increment Percentage
        </p>
        <input
          type="number"
          name="increment_percentage"
          value={formData.increment_percentage}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-gray-900 mt-1 focus:outline-none"
          placeholder="Enter increment percentage"
          min="0"
          max="100"
          step="0.01"
        />
      </div>

      {/* Closing Date */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
          <Calendar className="mr-1" size={14} /> Review Closing Date
        </p>
        <input
          type="date"
          name="closingDate"
          value={formData.closingDate}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-gray-900 mt-1 focus:outline-none"
          required
        />
      </div>

      {/* Increment Effective Date */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center">
          <Calendar className="mr-1" size={14} /> Increment Effective Date
        </p>
        <input
          type="date"
          name="increment_effective_date"
          value={formData.increment_effective_date}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-gray-900 mt-1 focus:outline-none"
          required
        />
      </div>

      {/* Status */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </p>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-gray-900 mt-1 focus:outline-none"
          required
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200 font-medium text-sm"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : "Update Review"}
        </button>
      </div>
    </div>
  );
};

export default HRSalaryApprovalForm;
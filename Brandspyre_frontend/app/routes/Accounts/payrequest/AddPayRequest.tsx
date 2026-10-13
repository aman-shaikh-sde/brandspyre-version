
import { apiClient } from "src/services/apiClient";
import { Banknote, Building, CalendarCheck, ClipboardList, ListChecks, User, FileText, Percent, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { useStaffFilter } from "~/routes/hooks/UseStaffFilter";
import { formatDate } from "src/utils/dateUtils";

const AddPayRequest = ({ project, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const token = useAuthStore((state) => state.accessToken);
  
  const {
    departmentOptions,
    selectedDepartment,
    staffOptions,
    isFetchingStaff,
    handleDepartmentChange,
  } = useStaffFilter(project.branchcode);

  const [formData, setFormData] = useState({
    project_code: project.project_code,
    project_amount: project.budget || 0,
    invoice_no: "",
    invoice_date: new Date().toISOString().split('T')[0], 
    due_date: "",
    cgst_percentage: 0,
    sgst_percentage: 0,
    discount: 0,
    roundoff: 0,
    paid_amount: 0,
    balance_amount: project.budget || 0,
    notes: "",
    created_by: useAuthStore.getState().user?.staff_id || "",
    approved_staff_id: "",
    data: []
  });

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const response = await apiClient.get(
          `/project/milestone/dropdown?project_code=${project.project_code}&paystatus=none`
        );

        if (response.data && response.data.data) {
          setMilestones(response.data.data);
          
          const initialMilestoneData = response.data.data.map(milestone => ({
            milestone_code: milestone.milestone_code,
            milestone_amount: milestone.base_amount || 0,
            notes: "",
            due_date: milestone.end_date || "",
            permission: false,
            isrevised: false
          }));
          
          setFormData(prev => ({
            ...prev,
            data: initialMilestoneData,
            due_date: response.data.data.length > 0 
              ? response.data.data[response.data.data.length - 1].end_date || ""
              : ""
          }));
        }
      } catch (err) {
        console.error("Error fetching milestones:", err);
        notify.error("Failed to load milestones");
      }
    };

    if (project.project_code) {
      fetchMilestones();
    }
  }, [project.project_code, token]);

  const handleMilestoneChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedData = [...formData.data];
    
    updatedData[index] = {
      ...updatedData[index],
      [name]: type === 'checkbox' ? checked : value
    };
    
    setFormData(prev => ({
      ...prev,
      data: updatedData
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'paid_amount') {
      const paid = parseFloat(value) || 0;
      const balance = (parseFloat(formData.project_amount) || 0) - paid;
      setFormData(prev => ({
        ...prev,
        [name]: value,
        balance_amount: balance.toFixed(2)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    if (!formData.approved_staff_id) {
      setError("Approved staff is required");
      return false;
    }
    
    if (!formData.invoice_no) {
      setError("Invoice number is required");
      return false;
    }
    
    if (!formData.invoice_date) {
      setError("Invoice date is required");
      return false;
    }
    
    if (!formData.due_date) {
      setError("Due date is required");
      return false;
    }
    
    if (formData.data.length === 0) {
      setError("At least one milestone is required");
      return false;
    }
    
    for (const milestone of formData.data) {
      if (!milestone.due_date) {
        setError("Due date is required for all milestones");
        return false;
      }
      if (!milestone.milestone_amount || isNaN(milestone.milestone_amount) || milestone.milestone_amount <= 0) {
        setError("Valid amount is required for all milestones");
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.post(
        `/project/req/create`,
        formData
      );

      if (response.status === 201) {
        notify.success("Payment request created successfully!");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to create payment request");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(err.response?.data?.message || "Error creating payment request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Project Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Project Code
            </p>
            <input
              value={formData.project_code}
              readOnly
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Project Amount
            </p>
            <input
              name="project_amount"
              value={formData.project_amount}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Project Duration
          </p>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
            {formatDate(project.start_date)} - {formatDate(project.end_date)}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Invoice Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FileText className="inline mr-1" size={14} /> Invoice Number
            </p>
            <input
              name="invoice_no"
              value={formData.invoice_no}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter invoice number"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Invoice Date
            </p>
            <input
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Due Date
            </p>
            <input
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> CGST (%)
            </p>
            <input
              name="cgst_percentage"
              value={formData.cgst_percentage}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="CGST percentage"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> SGST (%)
            </p>
            <input
              name="sgst_percentage"
              value={formData.sgst_percentage}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="SGST percentage"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Discount
            </p>
            <input
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Discount amount"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Round Off
            </p>
            <input
              name="roundoff"
              value={formData.roundoff}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Round off amount"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Banknote className="inline mr-1" size={14} /> Paid Amount
            </p>
            <input
              name="paid_amount"
              value={formData.paid_amount}
              onChange={handleChange}
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Amount already paid"
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Banknote className="inline mr-1" size={14} /> Balance Amount
            </p>
            <input
              name="balance_amount"
              value={formData.balance_amount}
              readOnly
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <ListChecks className="inline mr-1" size={14} /> Notes
          </p>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            placeholder="Additional notes"
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Approval Information
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Building className="inline mr-1" size={14} /> Department
          </p>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              handleDepartmentChange(e.target.value);
              setFormData(prev => ({
                ...prev,
                approved_staff_id: ""
              }));
            }}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
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
        
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <User className="inline mr-1" size={14} /> Created By
          </p>
          {isFetchingStaff ? (
            <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
          ) : (
            <select
              name="created_by"
              value={formData.created_by}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
              disabled={!selectedDepartment || staffOptions.length === 0}
            >
              <option value="">Select Staff</option>
              {staffOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {selectedDepartment && staffOptions.length === 0 && !isFetchingStaff && (
            <div className="text-xs text-gray-500 mt-1">
              No staff found in this department
            </div>
          )}
        </div>
             <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <User className="inline mr-1" size={14} /> Approved Staff
          </p>
          {isFetchingStaff ? (
            <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
          ) : (
            <select
              name="approved_staff_id"
              value={formData.approved_staff_id}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
              disabled={!selectedDepartment || staffOptions.length === 0}
            >
              <option value="">Select Staff</option>
              {staffOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {selectedDepartment && staffOptions.length === 0 && !isFetchingStaff && (
            <div className="text-xs text-gray-500 mt-1">
              No staff found in this department
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Milestone Payments
        </h3>
        
        {milestones.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No milestones found for this project
          </div>
        ) : (
          formData.data.map((milestone, index) => (
            <div key={index} className="border rounded-lg p-4 dark:border-gray-700">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <ClipboardList size={16} />
                {milestones[index]?.miles_title || `Milestone ${index + 1}`}
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-2">
                  {milestone.milestone_code}
                </span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/70 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Banknote className="inline mr-1" size={14} /> Amount
                  </p>
                  <input
                    name="milestone_amount"
                    value={milestone.milestone_amount}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    type="number"
                    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/70 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <CalendarCheck className="inline mr-1" size={14} /> Due Date
                  </p>
                  <input
                    name="due_date"
                    value={milestone.due_date}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    type="date"
                    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/70 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <ListChecks className="inline mr-1" size={14} /> Notes
                  </p>
                  <input
                    name="notes"
                    value={milestone.notes}
                    onChange={(e) => handleMilestoneChange(index, e)}
                    type="text"
                    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                    placeholder="Payment notes"
                  />
                </div>
                
                <div className="flex items-center gap-4 p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="permission"
                      checked={milestone.permission}
                      onChange={(e) => handleMilestoneChange(index, e)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    Permission
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isrevised"
                      checked={milestone.isrevised}
                      onChange={(e) => handleMilestoneChange(index, e)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    Is Revised
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200 font-medium text-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={loading || milestones.length === 0}
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm disabled:opacity-70"
        >
          {loading ? <ButtonLoader /> : "Create Payment Request"}
        </button>
      </div>
    </div>
  );
};

export default AddPayRequest;
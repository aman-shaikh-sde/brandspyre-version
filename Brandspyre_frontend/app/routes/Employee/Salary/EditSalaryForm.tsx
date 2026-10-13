import { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { Calendar, ClipboardList, DollarSign, FileText, Percent } from "lucide-react";
import useEmployeeStore from "src/stores/useEmployeeStore";

const EditSalaryForm = ({ salary, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore(state => state.accessToken);
      const employeeOption = useEmployeeStore((state) => state.branchEmployeeOptions);

  const [formData, setFormData] = useState({
    staff_id: "",
    basicsalary: "",
    hra: "",
    lpa: "",
    gross_salary: "",
    net_salary: "",
    bonus: "",
    pf: "",
    esi: "",
    tds: "",
    other_allowance: "",
    deductions: "",
    remarks: "",
    processondate: "",
    processtilldate: "",
    status: "active"
  });

  useEffect(() => {
    if (salary) {
      setFormData({
        staff_id: salary.staff_id || "",
        basicsalary: salary.basicsalary || "",
        hra: salary.hra || "",
        lpa: salary.lpa || "",
        gross_salary: salary.gross_salary || "",
        net_salary: salary.net_salary || "",
        bonus: salary.bonus || "",
        pf: salary.pf || "",
        esi: salary.esi || "",
        tds: salary.tds || "",
        other_allowance: salary.other_allowance || "",
        deductions: salary.deductions || "",
        remarks: salary.remarks || "",
        processondate: salary.processondate || "",
        processtilldate: salary.processtilldate || "",
        status: salary.status || "active"
      });
    }
  }, [salary]);

  useEffect(() => {
    const basic = Number(formData.basicsalary) || 0;
    const hra = Number(formData.hra) || 0;
    const lpa = Number(formData.lpa) || 0;
    const otherAllowance = Number(formData.other_allowance) || 0;

    const gross = basic + hra + lpa + otherAllowance;

    const pf = Number(formData.pf) || 0;
    const esi = Number(formData.esi) || 0;
    const tds = Number(formData.tds) || 0;
    const otherDeductions = Number(formData.deductions) || 0;

    const totalDeductions = pf + esi + tds + otherDeductions;
    const net = gross - totalDeductions;

    setFormData((prev) => {
      if (prev.gross_salary === String(gross) && prev.net_salary === String(net)) {
        return prev;
      }
      return {
        ...prev,
        gross_salary: String(gross),
        net_salary: String(net),
      };
    });
  }, [
    formData.basicsalary,
    formData.hra,
    formData.lpa,
    formData.other_allowance,
    formData.pf,
    formData.esi,
    formData.tds,
    formData.deductions,
  ]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.put(`/users/salary/edit/${salary.id}`, 
        { userData: formData }
      );
      
      if (response.status === 201) {
        onSuccess();
        notify.success("Salary updated successfully!");
      } else {
        setError(response.data.message || "Failed to update salary");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error updating salary", {
        style: {
          border: "1px solid rgb(185 28 28)",
          padding: "14px",
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
{/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FileText className="inline mr-1" size={14} /> Staff ID
            </p>
            <input
                 name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                
             readOnly
              />

      
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar className="inline mr-1" size={14} /> Process On Date
            </p>
            <input
              name="processondate"
              value={formData.processondate}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="date"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Calendar className="inline mr-1" size={14} /> Process Till Date
            </p>
            <input
              name="processtilldate"
              value={formData.processtilldate}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="date"
            />
          </div>
        </div>
      </div>

      {/* Salary Components Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Salary Components
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Basic Salary
            </p>
            <input
              name="basicsalary"
              value={formData.basicsalary}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="Basic Salary"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> HRA
            </p>
            <input
              name="hra"
              value={formData.hra}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="HRA"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> LPA
            </p>
            <input
              name="lpa"
              value={formData.lpa}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="LPA"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Bonus
            </p>
            <input
              name="bonus"
              value={formData.bonus}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="Bonus"
              required
            />
          </div>
        </div>
      </div>

      {/* Deductions Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Deductions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> PF
            </p>
            <input
              name="pf"
              value={formData.pf}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="PF"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> ESI
            </p>
            <input
              name="esi"
              value={formData.esi}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="ESI"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> TDS
            </p>
            <input
              name="tds"
              value={formData.tds}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="TDS"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Other Allowance
            </p>
            <input
              name="other_allowance"
              value={formData.other_allowance}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="Other Allowance"
              required
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Deductions
            </p>
            <input
              name="deductions"
              value={formData.deductions}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="Deductions"
              required
            />
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Salary Totals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Gross Salary
            </p>
            <input
              name="gross_salary"
              value={formData.gross_salary}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="Gross Salary"
              required
              readOnly
            />
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <DollarSign className="inline mr-1" size={14} /> Net Salary
            </p>
            <input
              name="net_salary"
              value={formData.net_salary}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="number"
              placeholder="Net Salary"
              required
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Additional Information
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
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FileText className="inline mr-1" size={14} /> Remarks
            </p>
            <input
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Remarks"
              required
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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
          {loading ? <ButtonLoader /> : "Update Salary"}
        </button>
      </div>
    </div>
  );
};

export default EditSalaryForm;
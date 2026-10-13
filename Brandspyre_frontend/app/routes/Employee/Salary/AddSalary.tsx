import { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import {
  Building,
  Calendar,
  ClipboardList,
  DollarSign,
  FileText,
  IndianRupee,
  Percent,
  User,
} from "lucide-react";
import useEmployeeStore from "src/stores/useEmployeeStore";

import AsyncSelect from "react-select/async";
const CreateSalaryForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);


  const [departments, setDepartments] = useState<Department[]>([]);
  // const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);

  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, string[]>
  >({});
  // const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [designationOptions, setDesignationOptions] = useState<Option[]>([]);
  const [error, setError] = useState("");
  const [roleOptions, setRoleOptions] = useState([]);

  
  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = storeRole || (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : "") || "";
  const branchcodeForNor = useAuthStore((state) => state.branchcode);

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
    status: "active",
  });

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

 useEffect(() => {
    if (selectedDepartment) {
      fetchStaffOptions();
    }
  }, [selectedDepartment]);

  const fetchStaffOptions = async () => {
    setIsFetchingStaff(true);
    try {
      let url = `/users/dropdown?department=${selectedDepartment}`;
      
      // If user is not superadmin, add branchcode to the URL
      if (userRole !== "superadmin") {
        url += `&branchcode=${branchcodeForNor}`;
      }

      const response = await apiClient.get(url);

      if (response.data && response.data.data) {
        const options = response.data.data.map(user => ({
          value: user.staff_id,
          label: `${user.firstname + user.lastname} - ${user.staff_id}`
        }));
        setStaffOptions(options);
      }
    } catch (err) {
      notify.error("Failed to fetch staff options", {
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
      setIsFetchingStaff(false);
    }
  };



useEffect(() => {
  async function fetchData() {
    try {
      const [deptRes, desigRes] = await Promise.all([
        fetch(`/getDepartments`),
        fetch(`/getDesignations`),
      ]);

      const deptData = await deptRes.json();
      const desigData = await desigRes.json();

      // Set full department list
      setDepartments(deptData.data);

      // Department options (names only)
      const deptNames = deptData.data
        .map((d: Department) => d.name)
        .filter(Boolean)
        .map((name: string) => ({ value: name, label: name }));
      setDepartmentOptions(deptNames);

      // Build mapping { departmentName: [designation1, designation2] }
      const deptDesigs: Record<string, Option[]> = {};

      desigData.data.forEach((item: Designation) => {
        const dept = item.department;
        if (!deptDesigs[dept]) {
          deptDesigs[dept] = [];
        }
        deptDesigs[dept].push({
          value: item.designation,
          label: item.designation,
        });
      });

      setDepartmentDesignations(deptDesigs); // You probably want to save it in state
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  fetchData(); // ✅ call the async function

}, []); // ✅ empty dependency array (or add dependencies as needed)

   const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    // Reset staff_id when department changes
    setFormData(prev => ({ ...prev, staff_id: "" }));
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

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
    try {
      const response = await apiClient.post(
        `/users/salary/create`,
        { userDatas: [formData] }
      );

      if (response.status === 201) {
        onSuccess();
        notify.success("Salary created successfully!");
      } else {
        setError(response.data.message || "Failed to create salary");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error creating salary", {
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


  const loadDeps = (inputValue: string, callback: (options: Option[]) => void) => {
  const filtered = departmentOptions.filter((c) =>
    c.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  callback(filtered);
};


     const loadStaffs = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = staffOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };


  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
{/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Staff ID
            </p>
            <select
              name="staff_id"
              value={formData.staff_id}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              {employeeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div> */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Building className="inline mr-1" size={14} /> Department <span className="text-red-700 text-lg m-2">*</span>
            </p>
            {/*<select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>*/}

           <AsyncSelect
  cacheOptions
  defaultOptions={departmentOptions} // must be [{ value, label }]
  name="department"
  loadOptions={loadDeps}
  onChange={(selected: Option | null) => {
    setSelectedDepartment(selected ? selected.value : ""); // ✅ update local state
    setFormData((prev) => ({
      ...prev,
      department: selected ? selected.value : "",
      staff_id: "", // ✅ reset staff_id when department changes
    }));
  }}
  value={
    departmentOptions.find((opt) => opt.value === formData.department) || null
  }
  placeholder="Select or search department"
/>


          </div>

          {/* Staff ID Selection */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Staff ID <span className="text-red-700 text-lg m-2">*</span>
            </p>
            {isFetchingStaff ? (
              <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
            ) : (
              // <select
              //   name="staff_id"
              //   value={formData.staff_id}
              //   onChange={handleChange}
              //   className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              //   required
              //   disabled={!selectedDepartment || staffOptions.length === 0}
              // >
              //   <option value="">Select Staff</option>
              //   {staffOptions.map((option) => (
              //     <option key={option.value} value={option.value}>
              //       {option.label}
              //     </option>
              //   ))}
              // </select>



            <AsyncSelect
          cacheOptions
          defaultOptions={staffOptions}
          name="staff_id"
          loadOptions={loadStaffs}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, staff_id: selected ? selected.value : "" })
          }
          value={staffOptions.find((opt) => opt.value === formData.staff_id) || null}
          isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search staff"
        />


            )}
            {selectedDepartment && staffOptions.length === 0 && !isFetchingStaff && (
              <div className="text-xs text-gray-500 mt-1">No staff found in this department</div>
            )}
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
              <IndianRupee className="inline mr-1" size={14} /> Basic Salary <span className="text-red-700 text-lg m-2">*</span>
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
              <IndianRupee className="inline mr-1" size={14} /> HRA
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
              <IndianRupee className="inline mr-1" size={14} /> LPA
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
              <IndianRupee className="inline mr-1" size={14} /> Bonus
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
              <Percent className="inline mr-1" size={14} /> PF <span className="text-red-700 text-lg m-2">*</span>
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
              {statusOptions.map((option) => (
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
          {loading ? <ButtonLoader /> : "Create Salary"}
        </button>
      </div>
    </div>
  );
};

export default CreateSalaryForm;


import { apiClient } from "src/services/apiClient";
import { useEffect,useState } from "react";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import { User, ClipboardList, FileText, Building, Hash } from "lucide-react";
import { useStaffFilter } from "~/routes/hooks/UseStaffFilter";
import useBranchStore from "src/stores/useBranchStore";
import AsyncSelect from "react-select/async";
import { useLocation } from "react-router-dom";

const CreateTeamMembersForm = ({ onSuccess, onCancel, team }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const employeeOption = useEmployeeStore((state) => state.branchEmployeeOptions);
   const permissions = useAuthStore((state) => state.permissions);
  // const userRole = permissions[0].role;
    const userRole = useAuthStore((state) => state.role);
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
  const branchCodeOptions =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];
  

        const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, string[]>
  >({});
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);

  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);






  const {
    // departmentOptions,
    selectedDepartment,
    // staffOptions,
    // isFetchingStaff,
    handleDepartmentChange,
  } = useStaffFilter(team.branchcode);
  const [formData, setFormData] = useState({
    team_id: team.team_id,
    branchcode: team.branchcode,
    staff_id: "",
    role: "member",
    status: "active",
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
    // const teamMemberData = {
    //   userDatas: [formData],
    // };

     // remove department from formData
  const { department, ...filteredFormData } = formData;

  const teamMemberData = {
    userDatas: [filteredFormData],
  };

    
    try {
      const response = await apiClient.post(
        `/members/create`,
        teamMemberData
      );
      if (response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to Add Member");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(`${error}, Error In Add Team Member`, {
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


  useEffect(() => {
  async function fetchData() {
    try {
      if (!formData.branchcode) return; // ✅ prevent empty requests

      const token = useAuthStore.getState().accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const [deptRes, desigRes] = await Promise.all([
        fetch(
          `/getDepartments?branch_code=${encodeURIComponent(
            formData.branchcode
          )}`, { headers }
        ),
        fetch(`/getDesignations?branch_code=${encodeURIComponent(
          formData.branchcode
        )}`, { headers }),
      ]);

      const deptData = await deptRes.json();
      const desigData = await desigRes.json();

      // set full dept list
      setDepartments(deptData.data);

      // ✅ Department options converted to {value, label}
      const deptNames = deptData.data
        .map((d: Department) => d.name)
        .filter(Boolean)
        .map((name: string) => ({ value: name, label: name }));

      setDepartmentOptions(deptNames);

      // Build mapping { departmentName: [{value, label}, {value, label}] }
      const deptDesigs: Record<string, { value: string; label: string }[]> = {};
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
      setDepartmentDesignations(deptDesigs);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  }

  fetchData();
}, [formData.branchcode]);




  // ✅ Update designation options when department changes
  useEffect(() => {
    if (formData.department) {
      setDesignationOptions(departmentDesignations[formData.department] || []);
    } else {
      setDesignationOptions([]);
    }
  }, [formData.department, departmentDesignations]);


    useEffect(() => {
  async function fetchStaff() {
    if (!formData.department) {
      setStaffOptions([]);
      return;
    }

    setIsFetchingStaff(true);
    try {
      const res = await fetch(`/getStaff?department=${encodeURIComponent(formData.department)}&branch_code=${encodeURIComponent(
            formData.branchcode
          )}`);
      const data = await res.json();

      if (data?.status && Array.isArray(data.data)) {
        const options = data.data.map((staff: any) => {
          const fullname = `${staff.firstname || ""} ${staff.lastname || ""}`.trim();
          return {
            value: staff.staff_id,
            label: fullname ? `${fullname} (${staff.staff_id})` : `${staff.staff_id}`,
          };
        });
        setStaffOptions(options);
      } else {
        setStaffOptions([]);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      setStaffOptions([]);
    } finally {
      setIsFetchingStaff(false);
    }
  }

  fetchStaff();
}, [formData.department,formData.branchcode]);


   const loadStaffs = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = staffOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };




      const loadDeps = (inputValue: string, callback: (options: Option[]) => void) => {
  const filtered = departmentOptions.filter((c) =>
    c.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  callback(filtered);
};




  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
{error && <div className="text-red-500 mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
            Add Team Member
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
         
              {/* Department */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Building className="inline mr-1" size={14} /> Department
              </p>
              {/*<select
                value={selectedDepartment}
                onChange={(e) => {
                  handleDepartmentChange(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    handler_by: "",
                    handler_to: "",
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
              </select>*/}


                                 <AsyncSelect
  cacheOptions
  defaultOptions={departmentOptions}
  name="department"
  loadOptions={(inputValue, callback) => {
    const filtered = departmentOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  }}
  onChange={(selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      department: selected ? selected.value : "",
    }));
  }}
  value={
    departmentOptions.find((opt) => opt.value === formData.department) || null
  }
  placeholder="Select or search department"
/>


            </div>

            {/* Handler By */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} />Select Member
              </p>
{/*              {isFetchingStaff ? (
                <div className="text-sm text-gray-500 mt-1">
                  Loading staff...
                </div>
              ) : (
                <select
                  name="staff_id"
                  value={formData.staff_id}
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
              )}*/}



                     {isFetchingStaff ? (
        <div className="text-sm text-gray-500 mt-1">Loading clients...</div>
      ) : (
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




              {selectedDepartment &&
                staffOptions.length === 0 &&
                !isFetchingStaff && (
                  <div className="text-xs text-gray-500 mt-1">
                    No staff found in this department
                  </div>
                )}
            </div>
           

            {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <ClipboardList className="inline mr-1" size={14} /> Role In Team
              </p>
              <input
                name="role_in_team"
                value={formData.role_in_team}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="Role In Team"
                required
              />
            </div> */}

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <FileText className="inline mr-1" size={14} /> Status
              </p>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="active">Active</option>
                <option value="inActive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 cursor-pointer text-xs transition"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTeamMembersForm;
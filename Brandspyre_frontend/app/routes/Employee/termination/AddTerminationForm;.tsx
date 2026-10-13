import { apiClient } from "src/services/apiClient";
import { useState, useEffect } from "react";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import { Users, User, Hash, Building, Briefcase, Calendar, FileText } from "lucide-react";
import { useStaffFilter } from "~/routes/hooks/UseStaffFilter";
import AsyncSelect from "react-select/async";
const AddTerminationForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingTeam, setFetchingTeam] = useState(false);
  // const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const permissions = useAuthStore((state) => state.permissions);
  const storeRole = useAuthStore((state) => state.role);
  const userRole = (Array.isArray(permissions) && permissions.length > 0 ? permissions[0]?.role : null) || storeRole || "staff";
  // const branchCode = useBranchStore((state) => state.branchCodeOptions);
  // const branchcodeForNor = useAuthStore((state) => state.branchcode);
      // const [staffOptions, setStaffOptions] = useState([]);

  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);


  const [teamOptions, setTeamOptions] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);



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


  // Branch code options based on user role
  const branchCodeOptions =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];

  // Form state
  const [formData, setFormData] = useState({
    staff_id: "",
    staff_name: "",
    branchcode: "",
    branch_name: "",
    department: "",
    designation: "",
    team_id: "",
    team_name: "",
    team_lead_id: "",
    team_lead_name: "",
    termination_type: "resignation",
    termination_reason: "",
    last_working_day: "",
    reliving_date: "",
    exit_notes: "",
    created_by: userRole,
  });

  // Staff filter hook
  // const {
    // departmentOptions,
    // selectedDepartment,
    // staffOptions,
    // isFetchingStaff,
    // handleDepartmentChange,
  // } = useStaffFilter(formData.branchcode);


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
          label: `${user.firstname + user.lastname} - ${user.staff_id}`,
          dept: user.department,
    desig: user.designation,
    branchcode: user.branchcode,
    branch_name: user.branch_name, // if backend sends it
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
        fetch(`/getDepartments?branch_code=${encodeURIComponent(
            formData.branchcode
          )}`),
        fetch(`/getDesignations?branch_code=${encodeURIComponent(
            formData.branchcode
          )}`),
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

}, [formData.branchcode]); // ✅ empty dependency array (or add dependencies as needed)

   const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    // Reset staff_id when department changes
    setFormData(prev => ({ ...prev, staff_id: "" }));
  };




  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  useEffect(() => {
    if (formData.branchcode) {
      fetchTeams(formData.branchcode);
      // fetchProjects(formData.branchcode);
    } else {
      setTeamOptions([]);
      setTeamMembers([]);
      // setProjectOptions([]);
      // setMilestoneOptions([]);
    }
  }, [formData.branchcode]);



  // Fetch team details when staff is selected
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!formData.staff_id) return;
      
      setFetchingTeam(true);
      try {
        const response = await apiClient.get(`/teams/members/read?staff_id=${formData.staff_id}`);

        if (response.data.data) {
          const teamData = response.data.data;
          setFormData(prev => ({
            ...prev,
            team_id: teamData.team_id,
            team_name: teamData.team_name,
            team_lead_id: teamData.team_lead,
            team_lead_name: teamData.team_lead_name,
            branch_name: teamData.name,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch team details:", err);
      } finally {
        setFetchingTeam(false);
      }
    };

    fetchTeamDetails();
  }, [formData.staff_id, token]);

  // Set staff name when staff is selected
  // useEffect(() => {
  //   if (formData.staff_id && staffOptions.length > 0) {
  //     const selectedStaff = staffOptions.find(option => option.value === formData.staff_id);
  //     if (selectedStaff) {
  //       setFormData(prev => ({
  //         ...prev,
  //         staff_name: selectedStaff.label.split(' - ')[0],
  //         department: selectedStaff.dept || "",
  //         designation: selectedStaff.desig || ""
  //       }));
  //     }
  //   }
  // }, [formData.staff_id, staffOptions]);


useEffect(() => {
  if (formData.staff_id && staffOptions.length > 0) {
    const selectedStaff = staffOptions.find(
      (option) => option.value === formData.staff_id
    );

    if (selectedStaff) {
      setFormData((prev) => ({
        ...prev,
        staff_name: selectedStaff.label.split(" - ")[0],
        department: selectedStaff.dept || prev.department,
        designation: selectedStaff.desig || prev.designation,
        branchcode: selectedStaff.branchcode || prev.branchcode,
        branch_name: selectedStaff.branch_name || prev.branch_name,
      }));
    }
  }
}, [formData.staff_id, staffOptions]);


  const fetchTeams = async (branchcode) => {
    try {
      const response = await apiClient.get(
        `/teams/read?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((team) => ({
          value: team.team_id,
          label: team.team_name,
          team_lead: team.team_lead,
        }));
        setTeamOptions(options);
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
      notify.error("Failed to load teams");
    }
  };

const fetchTeamMembers = async (teamId) => {
    try {
      const response = await apiClient.get(
        `/teams/read/profile?team_id=${teamId}`
      );

      if (response.data && response.data.data) {
        // Filter out team leads (role === "lead")
        const members = response.data.data.members.filter(
          (member) => member.role !== "lead"
        );
        setTeamMembers(members);

        // Auto-set handler_by to the team lead
        const teamLead = response.data.data.members.find(
          (member) => member.role === "lead"
        );
        if (teamLead) {
          setFormData((prev) => ({
            ...prev,
            handler_by: teamLead.staff_id,
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
      notify.error("Failed to load team members");
    }
  };






  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await apiClient.post(`/user_resign_form/create`, formData);
      
      if (response.status === 201) {
        notify.success("Resignation submitted successfully");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to submit resignation");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(err.response?.data?.message || "Failed to submit resignation", {
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



      const loadBranches = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = branchCodeOption.filter((c) =>
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


     const loadStaffs = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = staffOptions.filter((c) =>
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
            Resignation Form
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Code */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Hash className="inline mr-1" size={14} /> Branch Code
              </p>
              {/*<select
                name="branchcode"
                value={formData.branchcode}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="">Select Branch</option>
                {branchCodeOptions?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>*/}



                  
{/*        <AsyncSelect
  cacheOptions
  defaultOptions={branchCodeOptions}
  name="branchcode"
  loadOptions={loadBranches}
  onChange={(selected: Option | null) => {
    const fakeEvent = {
      target: { value: selected ? selected.value : "" },
    };
    handleBranchChange(fakeEvent);

    setFormData((prev) => ({
      ...prev,
      branchcode: selected ? selected.value : "",
      // staff_id: "", // reset staff_id if needed
    }));
  }}
  value={
    branchCodeOptions.find((opt) => opt.value === formData.branchcode) || null
  }
  placeholder="Select or search branch"
/>*/}


<AsyncSelect
  cacheOptions
  defaultOptions={branchCodeOptions}
  loadOptions={loadBranches}
  onChange={(selected) => {
    setFormData((prev) => ({
      ...prev,
      branchcode: selected ? selected.value : "",
      branch_name: selected ? selected.label : "",
    }));
  }}
  value={
    branchCodeOptions.find(
      (opt) => opt.value === formData.branchcode
    ) || null
  }
  placeholder="Select or search branch"
/>



            </div>

            {/* Branch Name (readonly) */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Building className="inline mr-1" size={14} /> Branch Name
              </p>
              <input
                name="branch_name"
                value={formData.branch_name}
                readOnly
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Department */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Building className="inline mr-1" size={14} /> Department
              </p>
 {/*             <select
                value={selectedDepartment}
                onChange={(e) => {
                  handleDepartmentChange(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    staff_id: "",
                    staff_name: "",
                    department: "",
                    designation: "",
                    team_id: "",
                    team_name: "",
                    team_lead_id: "",
                    team_lead_name: ""
                  }));
                }}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!formData.branchcode}
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

            {/* Designation (readonly) */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Briefcase className="inline mr-1" size={14} /> Designation
              </p>
              <input
                name="designation"
                value={formData.designation}
                readOnly
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Staff Selection */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Select Staff
              </p>
              {isFetchingStaff ? (
                <div className="text-sm text-gray-500 mt-1">
                  Loading staff...
                </div>
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
                <div className="text-xs text-gray-500 mt-1">
                  No staff found in this department
                </div>
              )}
            </div>

            {/* Staff Name (readonly) */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Staff Name
              </p>
              <input
                name="staff_name"
                value={formData.staff_name}
                readOnly
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Team Info (readonly) */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Users className="inline mr-1" size={14} /> Team Name
              </p>
              <input
                name="team_name"
                value={formData.team_name}
                readOnly
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Team Lead
              </p>
              <input
                name="team_lead_name"
                value={formData.team_lead_name}
                readOnly
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* Termination Type */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Termination Type
              </p>
              <select
                name="termination_type"
                value={formData.termination_type}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="resignation">Resignation</option>
                <option value="termination">Termination</option>
                <option value="retirement">Retirement</option>
              </select>
            </div>

            {/* Termination Reason */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Termination Reason
              </p>
              <select
                name="termination_reason"
                value={formData.termination_reason}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              >
                <option value="">Select Reason</option>
                <option value="Personal">Personal</option>
                <option value="Career Growth">Career Growth</option>
                <option value="Health Reasons">Health Reasons</option>
                <option value="Relocation">Relocation</option>
                <option value="Better Opportunity">Better Opportunity</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Last Working Day */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Calendar className="inline mr-1" size={14} /> Last Working Day
              </p>
              <input
                name="last_working_day"
                type="date"
                value={formData.last_working_day}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              />
            </div>

            {/* Reliving Date */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Calendar className="inline mr-1" size={14} /> Reliving Date
              </p>
              <input
                name="reliving_date"
                type="date"
                value={formData.reliving_date}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
              />
            </div>

            {/* Exit Notes */}
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700 col-span-1 md:col-span-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <FileText className="inline mr-1" size={14} /> Exit Notes
              </p>
              <textarea
                name="exit_notes"
                value={formData.exit_notes}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none min-h-[80px]"
                placeholder="Enter your exit notes..."
              />
            </div>
          </div>
        </div>

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
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Submit Resignation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTerminationForm;;
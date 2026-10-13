import { apiClient } from "src/services/apiClient";
import {
  Banknote,
  Building,
  CalendarCheck,
  ClipboardList,
  Flag,
  Hash,
  ListChecks,
  Percent,
  Tag,
  Target,
  User,
} from "lucide-react";
import { useState,useEffect ,useRef } from "react";
import { notify } from "~/services/notificationService";
import { AiFillProject } from "react-icons/ai";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useClientStore from "src/stores/ClientStore";
import useLeadsStore from "src/stores/LeadsStore";
import useProjectStore from "src/stores/ProjectStore";
import useBranchStore from "src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import { BASE_URL } from "~/constants/api";
import { useStaffFilter } from "~/routes/hooks/UseStaffFilter";
import {formatDate} from "../../../../src/utils/dateUtils"

import AsyncSelect from "react-select/async";
import { useLocation } from "react-router-dom";


const AddMilestone = ({ project,onSuccess, onCancel }) => {
  console.log("projectdataaaa>>>>>",project)
  const [loading, setLoading] = useState(false);
  const clientcodeOptions = useClientStore((state) => state.clientscodeOptions);
  const [error, setError] = useState(null);
  const allProjectcodeOptions = useProjectStore(
    (state) => state.allProjectcodeOptions
  );
   const permissions = useAuthStore((state) => state.permissions);
  // const userRole = permissions[0].role;
   const userRole = useAuthStore((state) => state.role);
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
    
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, string[]>
  >({});
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);

  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);


  const [stafftoOptions, setStafftoOptions] = useState<{ value: string; label: string }[]>([]);
  const [isFetchingtoStaff, setIsFetchingtoStaff] = useState(false);



    const {
      // departmentOptions,
      selectedDepartment,
      // staffOptions,
      // isFetchingStaff,
      handleDepartmentChange,
    } = useStaffFilter(project.branchcode);
  const branchCodeOptions =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];

  const employeeOption = useEmployeeStore(
    (state) => state.branchEmployeeOptions
  );
  const campaignCodeOption = useLeadsStore(
    (state) => state.campaigncodeOptions
  );

  const token = useAuthStore((state) => state.accessToken);
  const [formData, setFormData] = useState({
    branchcode: "",

    // project_code: "",
    milestone_code: "",
    miles_title: "",
    milestone_type: "",
    start_date: "",
    end_date: "",
    base_amount: 0,
    additional_amount: 0,
    revision_reason: "",
    handler_by: "",
    approved_staff_id: "",
    isrevised: false,
    status: "draft",
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

    const milestoneData = {
      data: [
        {
          branchcode: project.branchcode,
          project_code: project.project_code,
          milestone_code: formData.milestone_code,
          miles_title: formData.miles_title,
          // milestone_type: formData.milestone_type,
                  milestone_type:
          formData.milestone_type === "other" ? formData.customType : formData.milestone_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          base_amount: Number(formData.base_amount),
          additional_amount: Number(formData.additional_amount),
          revision_reason: formData.revision_reason,
          handler_by: formData.handler_by,
          approved_staff_id: formData.approved_staff_id,
          isrevised: formData.isrevised === "true",
          // status: formData.status,
          status: formData.status === "other" ? formData.customStatus : formData.status,
        },
      ],
    };
    console.log("formdataaa>>>", formData);
    try {
      const response = await apiClient.post(
        `/project/milestone/create`,
        milestoneData
      );

      if (response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to create lead");
                alert ("Failed to create milestone. Please verfify the milestone or project status! if it fine please check whether you have enough permission to create.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
                      alert ("Failed to create milestone. Please verfify the milestone or project status! if it fine please check whether you have enough permission to create.");
      notify.error(error || "Error creating milestone");
    } finally {
      setLoading(false);
    }
  };



  //         useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       const [deptRes, desigRes] = await Promise.all([
  //         fetch("http://localhost:3000/api/getDepartments"),
  //         fetch("http://localhost:3000/api/getDesignations"),
  //       ]);

  //       const deptData = await deptRes.json();
  //       const desigData = await desigRes.json();

  //       // set full dept list
  //       setDepartments(deptData.data);

  //       // Department options (names only)
  //       const deptNames = deptData.data.map((d: Department) => d.name).filter(Boolean);
  //       setDepartmentOptions(deptNames);

  //       // Build mapping { departmentName: [designation1, designation2] }
  //       const deptDesigs: Record<string, string[]> = {};
  //       desigData.data.forEach((item: Designation) => {
  //         const dept = item.department;
  //         if (!deptDesigs[dept]) {
  //           deptDesigs[dept] = [];
  //         }
  //         deptDesigs[dept].push(item.designation);
  //       });
  //       setDepartmentDesignations(deptDesigs);
  //     } catch (err) {
  //       console.error("Error fetching data", err);
  //     }
  //   }

  //   fetchData();
  // }, []);



useEffect(() => {
  if (project) {
    let formattedStart = "";
    if (project.start_date) {
      const d = new Date(project.start_date);
      if (!isNaN(d.getTime())) {
        formattedStart = d.toISOString().split('T')[0];
      }
    }
    let formattedEnd = "";
    if (project.end_date) {
      const d = new Date(project.end_date);
      if (!isNaN(d.getTime())) {
        formattedEnd = d.toISOString().split('T')[0];
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      branchcode: project.branchcode || "",
      milestone_code: prev.milestone_code || (project.project_code ? `${project.project_code}-STONE-` : ""),
      start_date: prev.start_date || formattedStart,
      end_date: prev.end_date || formattedEnd,
    }));
  }
}, [project]);



useEffect(() => {
  async function fetchData() {
    try {
      if (!project.branchcode) return; // ? prevent empty requests

      const [deptRes, desigRes] = await Promise.all([
        fetch(
          `/getDepartments?branch_code=${encodeURIComponent(
            project.branchcode
          )}`
        ),
        fetch(`/getDesignations`),
      ]);

      const deptData = await deptRes.json();
      const desigData = await desigRes.json();

      // set full dept list
      setDepartments(deptData.data);

      // ? Department options converted to {value, label}
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
}, [project.branchcode]);


  // ? Update designation options when department changes
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
            project.branchcode
          )}`);
      const data = await res.json();

      if (data?.status && Array.isArray(data.data)) {
        const options = data.data.map((staff: any) => ({
          value: staff.staff_id,  // unique id (e.g. "BRCODE_01/02")
          label: `${staff.firstname} ${staff.lastname} (${staff.designation})`, // display name
        }));
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
}, [formData.department,project.branchcode]);



useEffect(() => {
  async function fetchtoStaff() {
    if (!formData.department) {
      setStafftoOptions([]);
      return;
    }

    setIsFetchingtoStaff(true);
    try {
      const res = await fetch(`/getStaff?department=${encodeURIComponent(formData.department)}&branch_code=${encodeURIComponent(
            project.branchcode
          )}`);
      const data = await res.json();

      if (data?.status && Array.isArray(data.data)) {
        const options = data.data.map((staff: any) => ({
          value: staff.staff_id,  // unique id (e.g. "BRCODE_01/02")
          label: `${staff.firstname} ${staff.lastname} (${staff.designation})`, // display name
        }));
        setStafftoOptions(options);
      } else {
        setStafftoOptions([]);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      setStafftoOptions([]);
    } finally {
      setIsFetchingtoStaff(false);
    }
  }

  fetchtoStaff();
}, [formData.department,project.branchcode]);


        const [types, setTypes] = useState<string[]>([]);

         const [statuses, setStatuses] = useState<string[]>([]);



useEffect(() => {
  const fetchMilestoneTypes = async () => {
    try {
      const res = await fetch(`/getmilestonetype`, {
        headers: {
          Authorization: `Bearer ${token}`, // only if required
        },
      });
      const json = await res.json();

      if (json?.milestone_types) {
        // directly set since backend already returns unique list
        // setCommtypes(json.comm_types);
        setTypes(json.milestone_types);
        // setStatuses(json.status);
      } else {
        // setCommtypes([]);
        setTypes([]);
        // setStatuses([]);
      }
    } catch (error) {
      console.error("Failed to load comm types:", error);
    }
  };

  fetchMilestoneTypes();
}, [token]);

useEffect(() => {
  const fetchMilestoneStatuses = async () => {
    try {
      const res = await fetch(`/getmilestonetype`, {
        headers: {
          Authorization: `Bearer ${token}`, // only if required
        },
      });
      const json = await res.json();

      if (json?.status_types) {
        // directly set since backend already returns unique list
        // setCommtypes(json.comm_types);
        // setTypes(json.milestone_types);
        setStatuses(json.status_types);
      } else {
        // setCommtypes([]);
        // setTypes([]);
        setStatuses([]);
      }
    } catch (error) {
      console.error("Failed to load comm types:", error);
    }
  };

  fetchMilestoneStatuses();
}, [token]);


// At the top (in your component)
const [query, setQuery] = useState("");
const [showDropdown, setShowDropdown] = useState(false);
const dropdownRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowDropdown(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Filter milestone types based on input
const filteredTypes = types.filter((type) =>
  type.toLowerCase().includes(query.toLowerCase())
);






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
      {/* Milestone Basic Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Flag className="inline mr-2" /> Milestone Information
        </h3>
           <h2 className="text-md font-medium text-red-700 dark:text-gray-300 mt-2 text-center ">
              <span className="text-gray-600 mr-4"> Project Duration: </span>{formatDate(project.start_date)} - {formatDate(project.end_date)}
                </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Milestone Code
              Milestone Code
            </p>
            <input
              name="milestone_code"
              value={formData.milestone_code}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter milestone code"
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Milestone
              Title
            </p>
            <input
              name="miles_title"
              value={formData.miles_title}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter milestone name"
            />
          </div>

          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
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
          </div> */}

          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Related Project
            </p>
            <select
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select Project</option>
              {allProjectcodeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div> */}

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Milestone Type
            </p>
{/*            <select
              name="milestone_type"
              value={formData.milestone_type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select type</option>
              <option value="initial">Initial</option>
              <option value="revision-minor">Minor Revision</option>
              <option value="revision-major">Major Revision</option>
              <option value="feature_add">Feature Add</option>
              <option value="bug_fix">Changes Fix</option>
            </select>*/}
{/*
                                      <select
    name="milestone_type"
    value={formData.milestone_type}
    onChange={(e) => {
      const value = e.target.value;
      if (value === "other") {
        setFormData((prev) => ({ ...prev, milestone_type: "other", customType: "" }));
      } else {
        setFormData((prev) => ({ ...prev, milestone_type: value, customType: "" }));
      }
    }}
    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
    required
  >
    <option value="">Select type</option>
    {types.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
    <option value="other">Add New</option>
  </select>

  {/* Show custom input if "Other" selected */}
{/*}  {formData.milestone_type === "other" && (
    <input
      type="text"
      name="customType"
      value={formData.customType || ""}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, customType: e.target.value }))
      }
      className="mt-2 w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none border-b border-gray-300 dark:border-gray-600"
      placeholder="Enter new type"
      required
    />
  )}
*/}

<div className="relative" ref={dropdownRef}>
  <input
    type="text"
    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 border-b border-gray-300 dark:border-gray-600 focus:outline-none"
    placeholder="Select or type to search"
    value={formData.milestone_type === "other" ? "" : query}
    onClick={() => setShowDropdown(true)}
    onChange={(e) => {
      setQuery(e.target.value);
      setFormData((prev) => ({ ...prev, milestone_type: "" })); // Clear selection
      setShowDropdown(true);
    }}
    required
  />

  {showDropdown && (
    <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
      {filteredTypes.map((type) => (
        <li
          key={type}
          onClick={() => {
            setFormData((prev) => ({ ...prev, milestone_type: type, customType: "" }));
            setQuery(type);
            setShowDropdown(false);
          }}
          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {type}
        </li>
      ))}

      <li
        onClick={() => {
          setFormData((prev) => ({ ...prev, milestone_type: "other", customType: "" }));
          setQuery("");
          setShowDropdown(false);
        }}
        className="cursor-pointer px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        ? Add New
      </li>
    </ul>
  )}

  {/* Custom input if "Other" selected */}
  {formData.milestone_type === "other" && (
    <input
      type="text"
      name="customType"
      value={formData.customType || ""}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, customType: e.target.value }))
      }
      className="mt-2 w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none border-b border-gray-300 dark:border-gray-600"
      placeholder="Enter new type"
      required
    />
  )}
</div>






          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Start Date
            </p>
            <input
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Due Date
            </p>
            <input
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            />
          </div>
          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Banknote className="inline mr-1" size={14} /> Milestone Base
              Amount
            </p>
            <input
              name="base_amount"
              value={formData.base_amount}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter amount"
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Percent className="inline mr-1" size={14} /> Addtional Amount
            </p>
            <input
              name="additional_amount"
              value={formData.additional_amount}
              onChange={handleChange}
              type="number"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Addtional Amount"
            />
          </div> */}
        
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


{/*                      <select
          name="department"
          value={selectedDepartment}
          onChange={handleChange}
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
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt- focus:outline-none"
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
        
        </div>       <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Select Handler By
              </p>
              {/*{isFetchingStaff ? (
                <div className="text-sm text-gray-500 mt-1">
                  Loading staff...
                </div>
              ) : (
                <select
                  name="handler_by"
                  value={formData.handler_by}
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
    <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
  ) : (
    // <select
    //   name="handler_by"
    //   value={formData.handler_by}
    //   onChange={handleChange}
    //   className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
    //   required
    //   // disabled={!formData.handler_by || staffOptions.length === 0}
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
          name="handler_by"
          loadOptions={loadStaffs}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, handler_by: selected ? selected.value : "" })
          }
          value={staffOptions.find((opt) => opt.value === formData.handler_by) || null}
          isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search handler by"
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
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Select Approved Staff Id
              </p>
    {/*          {isFetchingStaff ? (
                <div className="text-sm text-gray-500 mt-1">
                  Loading staff...
                </div>
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
              )}*/}


                {isFetchingStaff ? (
    <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
  ) : (
    // <select
    //   name="approved_staff_id"
    //   value={formData.approved_staff_id}
    //   onChange={handleChange}
    //   className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
    //   required
    //   // disabled={!formData.handler_by || staffOptions.length === 0}
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
          name="approved_staff_id"
          loadOptions={loadStaffs}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, approved_staff_id: selected ? selected.value : "" })
          }
          value={staffOptions.find((opt) => opt.value === formData.approved_staff_id) || null}
          isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search client"
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
            <User className="inline mr-1" size={14} /> Approved Staff Id
          </p>
          <select
            name="approved_staff_id"
            value={formData.approved_staff_id}
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
            <Tag className="inline mr-1" size={14} /> Status
          </p>
          {/*<select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inprocess">In Progress</option>
            <option value="verified">Verified</option>
            <option value="archived">Archived</option>
            <option value="drop">Drop</option>
          </select>*/}



<select
    name="status"
    value={formData.status}
    onChange={(e) => {
      const value = e.target.value;
      if (value === "other") {
        setFormData((prev) => ({ ...prev, status: "other", customStatus: "" }));
      } else {
        setFormData((prev) => ({ ...prev, status: value, customStatus: "" }));
      }
    }}
    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
    required
  >
    <option value="">Select status</option>
    {statuses.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
    <option value="other">Other</option>
  </select>

  {/* Show custom input if "Other" selected */}
  {formData.status === "other" && (
    <input
      type="text"
      name="customStatus"
      value={formData.customStatus || ""}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, customStatus: e.target.value }))
      }
      className="mt-2 w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none border-b border-gray-300 dark:border-gray-600"
      placeholder="Enter new status"
      required
    />
  )}





        </div>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Tag className="inline mr-1" size={14} /> Revised Status
          </p>
          <select
            name="isrevised"
            value={formData.isrevised}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="true">Is Revised</option>
            <option value="false">Not Revised</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <ListChecks className="inline mr-2" /> Reason
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <Target className="inline mr-1" size={14} /> Revision Reason
          </p>
          <textarea
            name="revision_reason"
            value={formData.revision_reason}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="List the key deliverables for this milestone..."
          />
        </div>
      </div>

      {/* Dependencies Section */}
      {/* <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <Hash className="inline mr-2" /> Dependencies
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Prerequisites
          </p>
          <textarea
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[60px]"
            placeholder="What needs to be completed before this milestone can start?"
          />
        </div>
      </div> */}

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
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
        >
          {loading ? <ButtonLoader /> : "Create Milestone"}
        </button>
      </div>
    </div>
  );
};

export default AddMilestone;


import { apiClient } from "src/services/apiClient";
import {
  CalendarCheck,
  User,
  BookUser,
  Tag,
  BookOpenText,
  Hash,
  IndianRupee,
  Map,
  Network,
  Briefcase,
  Tent,
  Building,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import { BASE_URL } from "~/constants/api";
import { useStaffFilter } from "../../routes/hooks/UseStaffFilter";
import useBranchStore from "src/stores/useBranchStore";
import { Button } from "src/component/ui/Button";
import { FormLabel, FormInput, FormSelect, FormTextarea } from "src/component/ui/FormField";
import { FormSection } from "src/component/ui/FormSection";

import AsyncSelect from "react-select/async";
import { useMasterStore } from "src/stores/masterStore";

interface Option {
  value: string;
  label: string;
}

const AddNewProject = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
  const [isFetchingClients, setIsFetchingClients] = useState(false);

 const permissions = useAuthStore((state) => state.permissions);
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


  const [formData, setFormData] = useState({
      branchcode: userRole === "superadmin" ? "" : branchcodeForNor,
    client_code: "",
    project_code:"",
    title: "",
    priority: "",
    type: "",
    loc: "",
    budget: 0,
    overallcost: 0,
    start_date: "",
    end_date: "",
    handler_by: "",
    start_approval:"pending",
    notes: "",
    status: "draft",
  });
 const {
    // departmentOptions,
    selectedDepartment,
    // staffOptions,
    // isFetchingStaff,
    handleDepartmentChange,
  } = useStaffFilter(formData.branchcode);

  // Fetch campaigns and clients when branchcode changes
  useEffect(() => {
    if (formData.branchcode) {
      fetchCampaignOptions(formData.branchcode);
      fetchClientOptions(formData.branchcode);
    
    } else {
      setCampaignOptions([]);
      setClientOptions([]);
      
    }
  }, [formData.branchcode]);



useEffect(() => {
  const path = location.pathname.split("/").filter(Boolean); // e.g. ["client_view"]

  async function fetchData() {
    if (path[0] === "client_view") {
      const searchParams = new URLSearchParams(location.search);
      const clientCode = searchParams.get("client_code");

      if (!clientCode) return;

      try {
        const res = await apiClient.get(`/client/overview/read`, {
          params: {
            client_code: clientCode,
            page: 1,
            limit: 2,
          },
        });

        if (res.data?.data?.length > 0) {
          const client = res.data.data[0];
          setFormData((prev) => ({
            ...prev,
            branchcode: client.branchcode || "",
            client_code: client.client_code || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching client overview:", err);
      }
    }
  }

  fetchData();
}, [location.pathname, location.search, token]);

  const fetchCampaignOptions = async (branchcode) => {
    setIsFetchingCampaigns(true);
    try {
      const response = await apiClient.get(
        `/campaign/overview/dropdown?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((campaign) => ({
          value: campaign.campaign_code,
          label: campaign.campaignname,
        }));
        setCampaignOptions(options);
      } else {
        setCampaignOptions([]);
      }
    } catch (err) {
      notify.error("Failed to fetch campaign options");
      setCampaignOptions([]);
    } finally {
      setIsFetchingCampaigns(false);
    }
  };






  const fetchClientOptions = async (branchcode) => {
    setIsFetchingClients(true);
    try {
      const response = await apiClient.get(
        `/client/overview/dropdown?branchcode=${branchcode}`
      );

      if (response.data && response.data.data) {
        const options = response.data.data.map((client) => ({
          value: client.client_code,
          label: `${client.client_name} (${client.client_code})`,
        }));
        setClientOptions(options);
      } else {
        setClientOptions([]);
      }
    } catch (err) {
      notify.error("Failed to fetch client options");
      setClientOptions([]);
    } finally {
      setIsFetchingClients(false);
    }
  };

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

    const ProjectData = {
      data: {
        branchcode: formData.branchcode,
        client_code: formData.client_code,
        project_code:formData.project_code,
        title: formData.title,
        priority: formData.priority,
        // type: formData.type,

        type :formData.type === "other" ? formData.customType : formData.type,

// send `finalType` to backend

        loc: formData.loc,
        budget: formData.budget,
        overallcost: formData.overallcost,
        start_date: formData.start_date,
        end_date: formData.end_date,
        handler_by: formData.handler_by,
        start_approval:formData.start_approval,
        notes: formData.notes,
        // status: formData.status,
        status: formData.status === "other" ? formData.customStatus : formData.status,

      },
    };

    try {
      const response = await apiClient.post(
        `/project/overview/create`,
        ProjectData
      );

      if (response.status === 201) {
        notify.success("Project created successfully!");
        onSuccess();
      } else {
        setError(response.data.message || response.data.error || "Failed to create project");
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || "An error occurred";
      setError(errMsg);
      notify.error(errMsg);
    } finally {
      setLoading(false);
    }
  };


useEffect(() => {
  async function fetchData() {
    try {
      if (!formData.branchcode) return; // ✅ prevent empty requests

      const [deptRes, desigRes] = await Promise.all([
        fetch(
          `/getDepartments?branch_code=${encodeURIComponent(
            formData.branchcode
          )}`
        ),
        fetch(`/getDesignations`),
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
        const options = data.data.map((staff: any) => ({
          value: staff.staff_id,  // unique id (e.g. "BRCODE_01/02")
          label: `${staff.firstname} ${staff.lastname} (${staff.staff_id})`, // display name
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
}, [formData.department]);



 const loadOptions = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = clientOptions.filter((c) =>
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




      const loadDeps = (inputValue: string, callback: (options: Option[]) => void) => {
  const filtered = departmentOptions.filter((c) =>
    c.label.toLowerCase().includes(inputValue.toLowerCase())
  );
  callback(filtered);
};


const tamilNaduCities = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
  "Salem",
  "Tirunelveli",
  "Tiruppur",
  "Erode",
  "Vellore",
  "Thoothukudi",
  "Nagercoil",
  "Thanjavur",
  "Dindigul",
  "Kanchipuram",
  "Karaikudi",
  "Cuddalore",
  "Nagapattinam",
  "Sivakasi",
  "Villupuram",
  "Rajapalayam",
  // ➕ you can add more cities
];

const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e); // update formData
    const value = e.target.value.toLowerCase();

    if (!value) {
      setSuggestions([]);
      return;
    }

const filtered = tamilNaduCities.filter((city) =>
      city.toLowerCase().startsWith(value)
    );
    setSuggestions(filtered);
  };

  const handleSelect = (city: string) => {
    handleChange({ target: { name: "loc", value: city } } as any);
    setSuggestions([]);
  };


// const [types, setTypes] = useState<string[]>([]);

//  useEffect(() => {
//   const fetchTypes = async () => {
//     try {
//       const res = await fetch(`/project/overview/dropdown/type`, {
//         headers: {
//           Authorization: `Bearer ${token}`, // optional if API requires auth
//         },
//       });
//       const json = await res.json();

//       if (json?.data) {
//         // Extract unique types
//         const extracted = Array.from(
//           new Set(json.data.map((item: any) => item.type))
//         );
//         setTypes(extracted);
//       } else {
//         setTypes([]);
//       }
//     } catch (error) {
//       console.error("Failed to load property types:", error);
//     }
//   };

//   fetchTypes();
// }, [token]);

  const mastersByCategory = useMasterStore((state) => state.mastersByCategory);

  useEffect(() => {
    if (token) {
      useMasterStore.getState().fetchMasters(token, "project_type");
    }
  }, [token]);

  const defaultProjectTypeOptions = [
    { value: "client_project", label: "Client Project" },
    { value: "internal_project", label: "Internal Project" },
    { value: "commercial", label: "Commercial" },
    { value: "residential", label: "Residential" },
    { value: "government", label: "Government / Public Sector" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "marketing_campaign", label: "Marketing Campaign" },
    { value: "event", label: "Event & Conference" },
    { value: "research", label: "Research & Development" },
    { value: "consulting", label: "Consulting" },
    { value: "construction", label: "Construction" },
    { value: "maintenance", label: "Maintenance / AMC" },
    { value: "service", label: "Professional Service" },
    { value: "implementation", label: "Software / System Implementation" },
    { value: "training", label: "Training & Enablement" },
    { value: "healthcare", label: "Healthcare & Life Sciences" },
    { value: "education", label: "Educational" },
    { value: "logistics", label: "Logistics & Supply Chain" },
    { value: "other", label: "Other" },
  ];

  const projectTypeOptions = useMemo(() => {
    const items = mastersByCategory["project_type"] || [];
    const dynamicOpts = items
      .filter((item) => item.isActive !== false)
      .map((item) => ({ value: item.key, label: item.label }));

    return dynamicOpts.length > 0 ? dynamicOpts : defaultProjectTypeOptions;
  }, [mastersByCategory]);






  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookUser className="inline mr-2" /> Project Information
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
              {branchCodeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Code - Dynamic */}
          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tent className="inline mr-1" size={14} /> Campaign Code
            </p>
            {isFetchingCampaigns ? (
              <div className="text-sm text-gray-500 mt-1">Loading campaigns...</div>
            ) : (
              <select
                name="campaign_code"
                value={formData.campaign_code}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!formData.branchcode || campaignOptions.length === 0}
              >
                <option value="">Select Campaign</option>
                {campaignOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {formData.branchcode && campaignOptions.length === 0 && !isFetchingCampaigns && (
              <div className="text-xs text-gray-500 mt-1">No campaigns found for this branch</div>
            )}
          </div> */}

          {/* Client Code - Dynamic */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Briefcase className="inline mr-1" size={14} /> Client Code
            </p>
            {/*{isFetchingClients ? (
              <div className="text-sm text-gray-500 mt-1">Loading clients...</div>
            ) : (
              <select
                name="client_code"
                value={formData.client_code}
                onChange={handleChange}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                required
                disabled={!formData.branchcode || clientOptions.length === 0}
              >
                <option value="">Select Client</option>
                {clientOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}*/}


              {isFetchingClients ? (
        <div className="text-sm text-gray-500 mt-1">Loading clients...</div>
      ) : (
        <AsyncSelect
          cacheOptions
          name="client_code"
          defaultOptions={clientOptions}
          loadOptions={loadOptions}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, client_code: selected ? selected.value : "" })
          }
          value={clientOptions.find((opt) => opt.value === formData.client_code) || null}
          isDisabled={!formData.branchcode || clientOptions.length === 0}
          placeholder="Select or search client"
        />
      )}




            {formData.branchcode && clientOptions.length === 0 && !isFetchingClients && (
              <div className="text-xs text-gray-500 mt-1">No clients found for this branch</div>
            )}
          </div>

     <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Network className="inline mr-1" size={14} /> Project Code
            </p>
            <input
              name="project_code"
              value={formData.project_code}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Project Name"
              required
            />
          </div>
          {/* Project Name */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Network className="inline mr-1" size={14} /> Project Name
            </p>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Project Name"
              required
            />
          </div>

          {/* Location */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Map className="inline mr-1" size={14} /> Location
            </p>
    {/*        <input
              name="loc"
              value={formData.loc}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Location"
              required
            />*/}


<div className="relative">
    <input
      name="loc"
      value={formData.loc}
      onChange={handleInputChange}
      type="text"
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none border-b border-gray-300 dark:border-gray-600"
      placeholder="Enter Location"
      required
      autoComplete="off"
    />

    {suggestions.length > 0 && (
      <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
        {suggestions.map((city) => (
          <li
            key={city}
            onClick={() => handleSelect(city)}
            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {city}
          </li>
        ))}
      </ul>
    )}
  </div>          </div>

          {/* Start Date */}
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
              required
            />
          </div>

          {/* End Date */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> End Date
            </p>
            <input
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />
          </div>

          {/* Department */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Building className="inline mr-1" size={14} /> Department
            </p>
{/*            <select
              value={selectedDepartment}
              onChange={(e) => {
                handleDepartmentChange(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  handler_by: "",
                  handler_to: ""
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


                      {/*<select
          name="department"
          value={formData.department}
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
              <User className="inline mr-1" size={14} /> Handler By
            </p>
          {/*  {isFetchingStaff ? (
              <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
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
            )}
            {selectedDepartment && staffOptions.length === 0 && !isFetchingStaff && (
              <div className="text-xs text-gray-500 mt-1">No staff found in this department</div>
            )}*/}

          {/*     {isFetchingStaff ? (
    <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
  ) : (
    <select
      name="handler_by"
      value={formData.handler_by}
      onChange={handleChange}
      className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
      required
      disabled={!formData.department || staffOptions.length === 0}
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
          name="handler_by"
          loadOptions={loadStaffs}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, handler_by: selected ? selected.value : "" })
          }
          value={staffOptions.find((opt) => opt.value === formData.handler_by) || null}
          isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search client"
        />
      )}



  {selectedDepartment && staffOptions.length === 0 && !isFetchingStaff && (
    <div className="text-xs text-gray-500 mt-1">
      No staff found in this department
    </div>
  )}





          </div>

          {/* Handler To */}
          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Handler To
            </p>
            {isFetchingStaff ? (
              <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
            ) : (
              <select
                name="handler_to"
                value={formData.handler_to}
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
              <div className="text-xs text-gray-500 mt-1">No staff found in this department</div>
            )}
          </div> */}

          {/* Priority */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Priority
            </p>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select priority</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
              <option value="blocker">Blocker</option>
            </select>
          </div>
        </div>
      </div>
      {(userRole === "superadmin" || userRole === "admin") && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
            Payment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <IndianRupee className="inline mr-1" size={14} /> Budget
              </p>
              <input
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                type="number"
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="Enter Budget"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <IndianRupee className="inline mr-1" size={14} /> Overall cost
              </p>
              <input
                name="overallcost"
                value={formData.overallcost}
                onChange={handleChange}
                type="number"
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                placeholder="Enter Overallcost"
              />
            </div>
          </div>
        </div>
      )}

      {/* Project & Status Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Project & Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Project Type
            </p>
            


            <select
              name="type"
              value={formData.type}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "other") {
                  setFormData((prev) => ({ ...prev, type: "other", customType: "" }));
                } else {
                  setFormData((prev) => ({ ...prev, type: value, customType: "" }));
                }
              }}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select project type</option>
              {projectTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Show custom input if "Other" selected */}
            {formData.type === "other" && (
              <input
                type="text"
                name="customType"
                value={formData.customType || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customType: e.target.value }))
                }
                className="mt-2 w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none border-b border-gray-300 dark:border-gray-600"
                placeholder="Enter custom project type"
                required
              />
            )}
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
              <option value="">Select status</option>
              <option value="draft">Draft</option>
              <option value="planning">Planning</option>
              <option value="inprocess">In Progress</option>
              <option value="active">Active</option>
              <option value="lead_review">Lead Review</option>
              <option value="client_review">Client Review</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="drop">Drop / Cancelled</option>
            </select>
          </div>



          </div>
        </div>

      {/* Notes & Summary Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookOpenText className="inline mr-2" /> Notes & Summary
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[100px]"
            placeholder="Enter project notes and summary..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          isLoading={loading}
        >
          Create Project
        </Button>
      </div>
    </div>
  );
};

export default AddNewProject;
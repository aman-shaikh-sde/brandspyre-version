import { apiClient } from "src/services/apiClient";
import {
  CalendarCheck,
  User,
  Phone,
  Mail,
  BookUser,
  Tag,
  BookOpenText,
  CalendarClock,
  Hash,
  IndianRupee,
  Map,
  Network,
  Briefcase,
  Tent,
  Building,
} from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useClientStore from "src/stores/ClientStore";
import useLeadsStore from "src/stores/LeadsStore";
import useBranchStore from "src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import { BASE_URL } from "~/constants/api";
import { useStaffFilter } from "~/routes/hooks/UseStaffFilter";

import AsyncSelect from "react-select/async";

import { useLocation } from "react-router-dom";

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


const EditProjectForm = ({ project,onSuccess, onCancel }) => {
  console.log("projectdataaa",project)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);
  const campaignCodeOption = useLeadsStore(
    (state) => state.campaigncodeOptions
  );

   const userRole=useAuthStore((state=>state.role))
      const [campaignOptions, setCampaignOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);
  const [isFetchingClients, setIsFetchingClients] = useState(false);


  const [selectedDepartments, setSelectedDepartments] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, string[]>
  >({});
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);

  const [staffOptions, setStaffOptions] = useState<{ value: string; label: string }[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);






  const employeeOption = useEmployeeStore(
    (state) => state.branchEmployeeOptions
  );
  const { fetchClients, isStoreLoading } = useClientStore();

  const clientcodeOptions = useClientStore((state) => state.clientscodeOptions);
  console.log("clientcodefor project", clientcodeOptions);
  useEffect(() => {
    fetchClients(token);
  }, []);
  const [formData, setFormData] = useState({
    branchcode: "",
    campaign_code: "",
    client_code: "",
    title: "",
    priority: "",
    type: "",
    loc: "",
    budget: 0,
    overallcost: 0,
    start_date: "",
    end_date: "",
    handler_by: "",
    handler_to: "",
    notes: "",
    status: "draft",
    start_approval:"pending",
    department:"",
  });
 useEffect(() => {
    if (project) {
      setFormData({
       branchcode:project .branchcode  || "",
          campaign_code: project.campaign_code || "",
          client_code: project.client_code || "",
          title: project.title || "",
          priority: project.priority || "",
          type: project.type || "",
          loc: project.loc || "",
          budget: project.budget || "",
          overallcost: project.overallcost || "",
          start_date: project.start_date || "",
          end_date: project.end_date || "",
          handler_by: project.handler_by || "",
          handler_to: project.handler_to || "",
          notes: project.notes || "",
          status: project.status || "",
          start_approval:project.start_approval || "",
          department:project.handler_department || "",
      });
    }
  }, [project]);
   const {
      // departmentOptions,
      selectedDepartment,

      // staffOptions,
      // isFetchingStaff,
      handleDepartmentChange,
    } = useStaffFilter(formData.branchcode);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


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
  if (formData.handler_by) {
    const encodedId = encodeURIComponent(formData.handler_by); // Handles 02/01 as 02%2F01
    fetch(`/get-staff-department/${encodedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.department) {
          setSelectedDepartments(data.department); // update only, no re-declare
        }
      });
  }
}, [formData.handler_by]);


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

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

    useEffect(() => {
  async function fetchData() {
    try {
      if (!formData.branchcode) return; // ? prevent empty requests

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
}, [formData.branchcode]);

      useEffect(() => {
  async function fetchStaff() {
    if (!formData.department) {
      setStaffOptions([]);
      return;
    }

    setIsFetchingStaff(true);
    try {
      const res = await fetch(`/getStaff?department=${encodeURIComponent(formData.department)}`);
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





  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const ProjectData = {
      data: 
        {
          branchcode: formData.branchcode,
          campaign_code: formData.campaign_code,
          project_code:project.project_code,
          client_code: formData.client_code,
          title: formData.title,
          priority: formData.priority,
          // type: formData.type,
          loc: formData.loc,
          budget: formData.budget,
          overallcost: formData.overallcost,
          start_date: formData.start_date,
          end_date: formData.end_date,
          handler_by: formData.handler_by,
          handler_to: formData.handler_to,
          notes: formData.notes,
          // status: formData.status,
          start_approval : formData.start_approval,

        status: formData.status === "other" ? formData.customStatus : formData.status,          
        type :formData.type === "other" ? formData.customType : formData.type,

        },
      
    };

    try {
      const response = await apiClient.put(
        `/project/overview/edit`,
        ProjectData
      );

      if (response.status === 201) {
        notify.success("Project Updated successfully!");
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update Project");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error updating project");
    } finally {
      setLoading(false);
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

        // set full dept list
        setDepartments(deptData.data);

        // Department options (names only)
        const deptNames = deptData.data.map((d: Department) => d.name).filter(Boolean);
        setDepartmentOptions(deptNames);

        // Build mapping { departmentName: [designation1, designation2] }
        const deptDesigs: Record<string, string[]> = {};
        desigData.data.forEach((item: Designation) => {
          const dept = item.department;
          if (!deptDesigs[dept]) {
            deptDesigs[dept] = [];
          }
          deptDesigs[dept].push(item.designation);
        });
        setDepartmentDesignations(deptDesigs);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    }

    fetchData();
  }, []);

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
      const res = await fetch(`/getStaff?department=${encodeURIComponent(formData.department)}`);
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
}, [formData.department]);



const [types, setTypes] = useState<string[]>([]);
const [statuses, setStatuses] = useState<string[]>([]);

 useEffect(() => {
  const fetchTypes = async () => {
    try {
      const res = await fetch(`/project/overview/dropdown/type`, {
        headers: {
          Authorization: `Bearer ${token}`, // optional if API requires auth
        },
      });
      const json = await res.json();

      if (json?.data) {
        // Extract unique types
        const extracted = Array.from(
          new Set(json.data.map((item: any) => item.type))
        );
        const extracted_statuses = Array.from(
          new Set(json.data.map((item: any) => item.status))
        );
        setTypes(extracted);
        setStatuses(extracted_statuses);
        
      } else {
        setTypes([]);
        setStatuses([]);
      }
    } catch (error) {
      console.error("Failed to load property types:", error);
    }
  };

  fetchTypes();
}, [token]);






  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
{/* Lead Basic Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookUser className="inline mr-2" /> Project Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lead Name */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Branch Code
            </p>
            <select
              name="branchcode"
              value={formData.branchcode}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
           
            >
              <option value="">Select Branch</option>
              {branchCodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tent className="inline mr-1" size={14} /> Camapign Code
            </p>
            <input
              name="campaign_code"
              value={formData.campaign_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
           readOnly
            />
              {/* <option value="">Select Camapign</option>
              {campaignCodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select> */}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Briefcase className="inline mr-1" size={14} /> Client Code
            </p>
{/*            <input
              name="client_code"
              value={formData.client_code}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              readOnly
            />*/}


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


              {/* <option value="">Select Client</option>
              {clientcodeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select> */}
          </div>
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

          {/* Phone */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Map className="inline mr-1" size={14} /> Location
            </p>
            <input
              name="loc"
              value={formData.loc}
              onChange={handleChange}
              type="text"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              placeholder="Enter Location"
              required
            />
          </div>

          {/* Email */}

          {/* Lead Date */}






    <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> Start Date
            </p>
{/*            <input
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />*/}

             <DatePicker
  selected={formData.start_date ? new Date(formData.start_date) : null}
  onChange={(date) =>
    setFormData({ ...formData, start_date: date.toISOString().slice(0, 10) })
  }
  className="w-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none rounded-md px-2 py-1"
/>
          </div>





          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <CalendarCheck className="inline mr-1" size={14} /> End Date
            </p>
            {/*<input
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              type="date"
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            />*/}

           <DatePicker
  selected={formData.end_date ? new Date(formData.end_date) : null}
  onChange={(date) =>
    setFormData({ ...formData, end_date: date.toISOString().slice(0, 10) })
  }
  className="w-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none rounded-md px-2 py-1"
/>

          </div>

          
  <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Building className="inline mr-1" size={14} /> Department
            </p>
            {/*<select
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
              <option value="">{selectedDepartments || 'N/A'}</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>*/}

                    {/*  <select
          name="department"
          value={selectedDepartment}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
          required
        >
          <option value="">{selectedDepartments || 'N/A'}</option>
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
            {/*{isFetchingStaff ? (
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
                <option value={formData.handler_by}>{formData.handler_by}</option>
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
               {isFetchingStaff ? (
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
      <option value={formData.handler_by}>{formData.handler_by}</option>
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
          </div>


          
          {/* <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Handler By
            </p>
            <select
              name="handler_by"
              value={formData.handler_by}
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
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Handler To
            </p>
            <select
              name="handler_to"
              value={formData.handler_to}
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
          {/* Communication Type */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} />
              Priority
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

          {/* Project Type */}
        </div>
      </div>

{(userRole === "superadmin" || userRole === "admin" ) && (

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
              <IndianRupee className="inline mr-1" size={14} /> Active Milestone cost
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Project & Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Project Type
            </p>
           {/* <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              <option value="">Select type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="land">Land</option>
            </select>*/}


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
    <option value="">Select type</option>
    {types.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
    <option value="other">Other</option>
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
      placeholder="Enter new type"
      required
    />
  )}


          </div>


    
{(userRole === "superadmin" || userRole === "admin" ) && (

                <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Tag className="inline mr-1" size={14} /> Approval Status
          </p>
          <select
            name="start_approval"
            value={formData.start_approval}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="not_confirmed">Not Confirmed</option>
            <option value="start">Start</option>
            {/*<option value="inprocess">In Progress</option>
            <option value="verified">Verified</option>
            <option value="archived">Archived</option>
            <option value="drop">Drop</option>*/}
          </select>
        </div>

)}


          {/* Status */}
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Tag className="inline mr-1" size={14} /> Status
            </p>
{/*            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
                <option value="draft">Draft</option>
              <option value="planning">Planning</option>
              <option value="inprocess">In Progress</option>
              <option value="active">Active</option>
              <option value="lead_review">Lead Review</option>
              <option value="completed">Completed</option>
              <option value="revised">Revised</option>
              <option value="client_review">Client_review</option>
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


{/*
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
    <option value="draft">Draft</option>
    <option value="planning">Planning</option>
    <option value="inprocess">In Progress</option>
    <option value="active">Active</option>
    <option value="lead_review">Lead Review</option>
    <option value="completed">Completed</option>
    <option value="revised">Revised</option>
    <option value="client_review">Client Review</option>
    <option value="drop">Drop</option>
    <option value="other">Other</option>
  </select>
*/}
  {/* Show input if "Other" selected */}
{/*  {formData.status === "other" && (
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


*/}
          </div>
        </div>
      </div>
      {/* Description Section */}
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
            placeholder="Enter lead summary and notes..."
          />
        </div>
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
          className="px-5 py-2 bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900 text-white rounded-md transition-colors duration-200 font-medium text-sm shadow-sm"
        >
          {loading ? <ButtonLoader /> : "Save Project"}
        </button>
      </div>
    </div>
  );
};

export default EditProjectForm;

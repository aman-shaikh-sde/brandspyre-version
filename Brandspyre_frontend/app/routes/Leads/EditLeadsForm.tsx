import { apiClient } from "src/services/apiClient";
import {
  CalendarCheck,
  User,
  Phone,
  Mail,
  BookUser,
  Tag,
  BookOpenText,
  Hash,
} from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useLeadsStore from "src/stores/LeadsStore";
import useBranchStore from "src/stores/useBranchStore";
import useEmployeeStore from "src/stores/useEmployeeStore";
import { BASE_URL } from "~/constants/api";
import AsyncSelect from "react-select/async";
import { useStaffFilter } from "../../routes/hooks/UseStaffFilter";

const EditLeadForm = ({ lead, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const staff_ids = useAuthStore((state) => state.staff_id);
  const [department, setDepartment] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<any[]>([]);
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);
  const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);


   const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(false);


  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, string[]>
  >({});
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);

  const [campaignOptions, setCampaignOptions] = useState([]);
  const campaignCodeOption = useLeadsStore(
    (state) => state.campaigncodeOptions
  );
  const employeeOption = useEmployeeStore(
    (state) => state.branchEmployeeOptions
  );

  const [formData, setFormData] = useState({
    branchcode: lead?.branchcode || "",
    campaign_code: lead?.campaign_code || "",
    lead_date: lead?.lead_date || new Date().toISOString().split("T")[0],
    lead_name: lead?.lead_name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    assignee_id: lead?.assignee_id || "",
    comm_type: lead?.comm_type || "",
    proj_type: lead?.proj_type || "",
    status: lead?.status || "active",
    summary: lead?.summary || "",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        branchcode: lead.branchcode,
        campaign_code: lead.campaign_code,
        lead_date: lead.lead_date,
        lead_name: lead.lead_name,
        phone: lead.phone,
        email: lead.email,
        assignee_id: lead.assignee_id,
        comm_type: lead.comm_type,
        proj_type: lead.proj_type,
        status: lead.status,
        summary: lead.summary,
      });
    }
  }, [lead]);

  
useEffect(() => {
    if (!staff_ids) return;

    const fetchDepartment = async () => {
      try {
        const res = await fetch(
          `/get-staff-department/${encodeURIComponent(staff_ids)}`
        );
        const data = await res.json();

        if (data?.status && data.department) {
          setDepartment(data.department);
        } else {
          setDepartment(null);
        }
      } catch (err) {
        console.error("Error fetching department:", err);
        setDepartment(null);
      }
    };

    fetchDepartment();
  }, [staff_ids]);

  // 2?? Fetch staff of that department
  useEffect(() => {
    if (!department) {
      setStaffOptions([]);
      return;
    }

    const fetchStaff = async () => {
      setIsFetchingStaff(true);
      try {
        const res = await fetch(
          `/getStaff?department=${encodeURIComponent(department)}`
        );
        const data = await res.json();

        if (data?.status && Array.isArray(data.data)) {
          const options = data.data.map((staff: any) => ({
            value: staff.staff_id,
            label: `${staff.firstname} ${staff.lastname} (${staff.staff_id})`,
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
    };

    fetchStaff();
  }, [department]);


    const {
    // departmentOptions,
    selectedDepartment,
    // staffOptions,
    // isFetchingStaff,
    handleDepartmentChange,
  } = useStaffFilter( formData.branchcode);
  useEffect(() => {
    if (formData.branchcode) {
      fetchCampaignOptions(formData.branchcode);
    } else {
      setCampaignOptions([]);
    }
  }, [formData.branchcode]);




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
      notify.error("Failed to fetch campaign options", {
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
      setCampaignOptions([]);
    } finally {
      setIsFetchingCampaigns(false);
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

    // const leadData = {
    //   data: formData,
    // };

const { department, ...rest } = formData;

const leadData = {
  data: rest,
};
    try {
      const response = await apiClient.put(
        `/campaign/leads/edit/${lead.id}`,
        leadData
      );

      if (response.status === 201) {
        onSuccess();
      } else {
        setError(response.data.message || "Failed to update lead");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(error || "Error updating lead");
    } finally {
      setLoading(false);
    }
  };

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


        const loadBranches = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = branchCodeOption.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };

        const loadCamps = (inputValue: string, callback: (options: Option[]) => void) => {
  const filtered = campaignOptions.filter((c) =>
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
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          <BookUser className="inline mr-2" />
          Edit Lead Information
        </h3>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Hash className="inline mr-1" size={14} /> Branch Code
          </p>
{/*          <select
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
          </select>*/}


            <AsyncSelect
  cacheOptions
  defaultOptions={branchCodeOption}
  name="branchcode"
  loadOptions={loadBranches}
  value={
    branchCodeOption.find((opt) => opt.value === formData.branchcode) || null
  }
  onChange={(selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      branchcode: selected ? selected.value : "",
    }));
  }}
  placeholder="Select or search branch"
/>


        </div>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Hash className="inline mr-1" size={14} /> Camapign Code
          </p>
          {/*<select
            name="campaign_code"
            value={formData.campaign_code}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="">Select Camapign</option>
            {campaignCodeOption?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>*/}


                     <AsyncSelect
  cacheOptions
  defaultOptions={campaignOptions} // must be [{ value, label }]
  name="campaign_code"
  loadOptions={loadCamps}
  onChange={(selected: Option | null) => {
    setFormData((prev) => ({
      ...prev,
      campaign_code: selected ? selected.value : "",
    }));
  }}
  value={
    campaignOptions.find((opt) => opt.value === formData.campaign_code) || null
  }
  placeholder="Select or search campaigns"
/>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <User className="inline mr-1" size={14} /> Lead Name
          </p>
          <input
            name="lead_name"
            value={formData.lead_name}
            onChange={handleChange}
            type="text"
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Phone className="inline mr-1" size={14} /> Phone
          </p>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            type="text"
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Mail className="inline mr-1" size={14} /> Email
          </p>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <CalendarCheck className="inline mr-1" size={14} /> Lead Date
          </p>
          <input
            name="lead_date"
            value={formData.lead_date}
            onChange={handleChange}
            type="date"
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          />
        </div>


{/*          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <User className="inline mr-1" size={14} /> Department
          </p>*/}
          {/*<select
            name="assignee_id"
            value={formData.assignee_id}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option key={formData.assignee_id} value={formData.assignee_id}>{formData.assignee_id} 
            </option>
            {employeeOption?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>*/}
 {/* <AsyncSelect
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


        </div>*/}


        {/*<div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <User className="inline mr-1" size={14} /> Assigned To
          </p>*/}
          {/*<select
            name="assignee_id"
            value={formData.assignee_id}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option key={formData.assignee_id} value={formData.assignee_id}>{formData.assignee_id} 
            </option>
            {employeeOption?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>*/}

    {/*        {isFetchingStaff ? (
    <div className="text-sm text-gray-500 mt-1">Loading staff...</div>
  ) : (
        <AsyncSelect
          cacheOptions
          defaultOptions={staffOptions}
          name="assignee_id"
          loadOptions={loadStaffs}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, assignee_id: selected ? selected.value : "" })
          }
          value={staffOptions.find((opt) => opt.value === formData.assignee_id) || null}
          isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search staff"
        />

  )}


        </div>*/}
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Tag className="inline mr-1" size={14} /> Communication Type
          </p>
          <select
            name="comm_type"
            value={formData.comm_type}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="email">Email</option>
            <option value="call">Phone Call</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="in-person">In-Person</option>
          </select>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Tag className="inline mr-1" size={14} /> Project Type
          </p>
          <select
            name="proj_type"
            value={formData.proj_type}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
            required
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
            <option value="land">Land</option>
          </select>
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
            <option value="Onboarding">On Boarding</option>
          </select>
        </div>
      </div>

      <div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
            <BookOpenText className="inline mr-2" /> Notes & Summary
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <textarea
              name="summary"
              value={formData.summary}
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
            {loading ? <ButtonLoader /> : "Update Lead"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLeadForm;

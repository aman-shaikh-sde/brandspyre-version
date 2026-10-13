import { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import {
  CalendarCheck,
  ClipboardList,
  Hash,
  Mail,
  MapPin,
  Phone,
  User,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import useBranchStore from "src/stores/useBranchStore";
import useLeadsStore from "src/stores/LeadsStore";


import AsyncSelect from "react-select/async";

const LeadClientForm = ({ lead, onSuccess, onCancel }) => {
  console.log("leadclientt", lead);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const permissions = useAuthStore((state) => state.permissions);
  // const userRole = permissions[0].role;
  const userRole = useAuthStore((state) => state.role);
  const branchCode = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);
  const branchCodeOption =
    userRole === "superadmin"
      ? branchCode
      : [{ value: branchcodeForNor, label: branchcodeForNor }];
  const campaignCodeOption = useLeadsStore(
    (state) => state.campaigncodeOptions
  );


  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentDesignations, setDepartmentDesignations] = useState<
    Record<string, string[]>
  >({});
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);


  const [formData, setFormData] = useState({
    branchcode: "",
    lead_id: "",
    client_name: "",
    company_name: "",
    primary_phone: "",
    email: "",
    office_address: "",
    website: "",
    industry_type: "commercial",
    comm_type: "email",
    status: "active",
    contacts: [
      {
        name: "",
        designation: "",
        phone: "",
        email: "",
      },
    ],
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        branchcode: lead.branchcode,
        lead_id: lead.id,
        client_name: lead.lead_name,
        primary_phone: lead.phone,
        email: lead.email,
        // company_name: formData.company_name,
        company_name: formData.company_name?.trim() === "" ? "N/A" : formData.company_name,
        office_address: formData.office_address,
        website: formData.website,
        industry_type: formData.industry_type,
        comm_type: formData.comm_type,
        status: formData.status,
        contacts: formData.contacts
      });
    }
  }, [lead]);

  const industryOptions = [
    { value: "commercial", label: "Commercial" },
    { value: "residential", label: "Residential" },
    { value: "industrial", label: "Industrial" },
    { value: "retail", label: "Retail" },
    { value: "hospitality", label: "Hospitality" },
  ];

  const communicationOptions = [
    { value: "email", label: "Email" },
    { value: "call", label: "Call" },
    { value: "mom", label: "Meeting" },
    { value: "all", label: "All" },
    { value: "none", label: "None" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "blacklisted", label: "Blacklisted" },
  ];


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
        setDepartments(deptData.departments || []);

        // Department options (names only)
        const deptNames = (deptData.departments || []).map((d: Department) => d.name).filter(Boolean);
        setDepartmentOptions(deptNames);

        // Build mapping { departmentName: [designation1, designation2] }
        const deptDesigs: Record<string, string[]> = {};
        (desigData.designations || []).forEach((item: Designation) => {
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




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value,
    };
    setFormData((prev) => ({
      ...prev,
      contacts: updatedContacts,
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          name: "",
          designation: "",
          phone: "",
          email: "",
        },
      ],
    }));
  };

  const removeContact = (index) => {
    if (formData.contacts.length === 1) return;
    const updatedContacts = formData.contacts.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      contacts: updatedContacts,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const clientData = {
      data: [
        {
          branchcode: formData.branchcode,
          lead_id: formData.lead_id,
          company_name: formData.company_name,
          client_name: formData.client_name,
          primary_phone: formData.primary_phone,
          email: formData.email,
          office_address: formData.office_address,
          website: formData.website,
          contacts: formData.contacts,
          // industry_type: formData.industry_type,
          // comm_type: formData.comm_type,

                     comm_type:
          formData.comm_type === "other" ? formData.customType : formData.comm_type,
          // industry_type:
          //   formData.industry_type === "other" ? formData.customTypepi : formData.industry_type,
          industry_type:
  formData.industry_type === "other" ? formData.customTypei : formData.industry_type,
          status: formData.status,
        },
      ],
    };
    console.log("clientdataaa", clientData);
    try {
      const response = await apiClient.post(
        `/client/overview/create`,
        clientData
      );
      console.log("clientresponseeeee", response.status);
      if (response.status === 201) {
        notify.success("New Client Add Successfully!");
        onCancel();
        onSuccess();
      } else {
        console.log("errror in create");
      }
    } catch (err) {
      const errMsg = err.response?.data?.data?.failed?.[0]?.error || err.response?.data?.message || "An error occurred";
      setError(errMsg);
      notify.error(errMsg, {
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




            const [commtypes, setCommtypes] = useState<string[]>([]);
                const [indtypes, setIndtypes] = useState<string[]>([]);


useEffect(() => {
  const fetchCommTypes = async () => {
    try {
      const res = await fetch(`/getindtype`, {
        headers: {
          Authorization: `Bearer ${token}`, // only if required
        },
      });
      const json = await res.json();

      if (json?.comm_types) {
        setCommtypes(Array.from(new Set(json.comm_types)));
        setIndtypes(Array.from(new Set(json.ind_types)));
      } else {
        setCommtypes([]);
        setIndtypes([]);
      }
    } catch (error) {
      console.error("Failed to load comm types:", error);
    }
  };

  fetchCommTypes();
}, [token]);












  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
<div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Client Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <User className="inline mr-1" size={14} /> Client Name
            </p>
            <input
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Client Name"
              required
            />
          </div>

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
              {branchCodeOption?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Hash className="inline mr-1" size={14} /> Company Name
            </p>
            <input
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Company Name"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <Phone className="inline mr-1" size={14} /> Primary Phone
            </p>
            <input
              name="primary_phone"
              value={formData.primary_phone}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Primary Phone"
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
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Industry Type
            </p>
            {/*<select
              name="industry_type"
              value={formData.industry_type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              {industryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>*/}


                                      <select
    name="industry_type"
    value={formData.industry_type}
    onChange={(e) => {
      const value = e.target.value;
      if (value === "other") {
        setFormData((prev) => ({ ...prev, industry_type: "other", customTypei: "" }));
      } else {
        setFormData((prev) => ({ ...prev, industry_type: value, customTypei: "" }));
      }
    }}
    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
    required
  >
    <option value="">Select type</option>
    {indtypes.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
    <option value="other">Other</option>
  </select>

  {/* Show custom input if "Other" selected */}
  {formData.industry_type === "other" && (
    <input
      type="text"
      name="customTypei"
      value={formData.customTypei || ""}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, customTypei: e.target.value }))
      }
      className="mt-2 w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none border-b border-gray-300 dark:border-gray-600"
      placeholder="Enter new type"
  
    />
  )}




          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <FileText className="inline mr-1" size={14} /> Website
            </p>
            <input
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Website URL"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Lead ID
            </p>
            <input
              name="lead_id"
              value={formData.lead_id}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              placeholder="Lead ID"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Address Information
        </h3>
        <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <MapPin className="inline mr-1" size={14} /> Office Address
          </p>
          <textarea
            name="office_address"
            value={formData.office_address}
            onChange={handleChange}
            className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none min-h-[80px]"
            placeholder="Office Address"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Contacts
        </h3>
        {formData.contacts.map((contact, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 relative"
          >
            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Contact Name
              </p>
              <input
                name="name"
                value={contact.name}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="text"
                placeholder="Contact Name"
                required
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <User className="inline mr-1" size={14} /> Designation
              </p>
              <input
                name="designation"
                value={contact.designation}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="text"
                placeholder="Designation"
                required
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Phone className="inline mr-1" size={14} /> Phone
              </p>
              <input
                name="phone"
                value={contact.phone}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="text"
                placeholder="Phone"
                required
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Mail className="inline mr-1" size={14} /> Email
              </p>
              <input
                name="email"
                value={contact.email}
                onChange={(e) => handleContactChange(index, e)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            {index > 0 && (
              <button
                type="button"
                onClick={() => removeContact(index)}
                className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addContact}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <Plus size={16} /> Add Another Contact
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Communication & Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/70 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <ClipboardList className="inline mr-1" size={14} /> Communication
              Type
            </p>
            {/*<select
              name="comm_type"
              value={formData.comm_type}
              onChange={handleChange}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              required
            >
              {communicationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>*/}

                                              <select
    name="comm_type"
    value={formData.comm_type}
    onChange={(e) => {
      const value = e.target.value;
      if (value === "other") {
        setFormData((prev) => ({ ...prev, comm_type: "other", customType: "" }));
      } else {
        setFormData((prev) => ({ ...prev, comm_type: value, customType: "" }));
      }
    }}
    className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
    required
  >
    <option value="">Select type</option>
    {commtypes.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ))}
    <option value="other">Other</option>
  </select>

  {/* Show custom input if "Other" selected */}
  {formData.comm_type === "other" && (
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
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <ButtonLoader /> : "Create Client"}
        </button>
      </div>
    </div>
  );
};

export default LeadClientForm;
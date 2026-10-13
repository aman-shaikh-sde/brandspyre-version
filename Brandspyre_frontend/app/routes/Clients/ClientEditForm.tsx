
import { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import {
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

const ClientEditForm = ({ client, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = useAuthStore((state) => state.accessToken);
  const branchCodeOption = useBranchStore((state) => state.branchCodeOptions);

  // Track original contacts to detect changes
  const [originalContacts, setOriginalContacts] = useState([]);
  const [formData, setFormData] = useState({
    branchcode: "",

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
    if (client) {
      const initialContacts = client.contacts || [];
      setOriginalContacts(initialContacts);
      setFormData({
        branchcode: client.branchcode || "",
        client_name: client.client_name || "",
        company_name: client.company_name || "",
        primary_phone: client.primary_phone || "",
        email: client.email || "",
        office_address: client.office_address || "",
        website: client.website || "",
        industry_type: client.industry_type || "commercial",
        comm_type: client.comm_type || "email",
        status: client.status || "active",
        contacts: initialContacts.map((contact) => ({
          ...contact,
          // Mark as existing and track original values
          type: "existing",
          originalName: contact.name,
          originalEmail: contact.email,
        })),
      });
    }
  }, [client]);

  // Options for dropdowns
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContacts = [...formData.contacts];

    const originalContact = originalContacts[index];
    const isChanged =
      (name === "name" && value !== originalContact?.name) ||
      (name === "email" && value !== originalContact?.email) ||
      (name === "designation" && value !== originalContact?.designation) ||
      (name === "phone" && value !== originalContact?.phone);

    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value,
      // Only mark as edit if it's actually changed from original
      type: isChanged ? "edit" : "existing",
    };

    setFormData((prev) => ({ ...prev, contacts: updatedContacts }));
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
          type: "add",
        },
      ],
    }));
  };

  const removeContact = (index) => {
    const contactToRemove = formData.contacts[index];
    let updatedContacts;

    if (contactToRemove.type === "add") {
      // If it's a newly added contact (not saved yet), just remove it
      updatedContacts = formData.contacts.filter((_, i) => i !== index);
    } else {
      // If it's an existing contact, mark it for removal
      updatedContacts = [...formData.contacts];
      updatedContacts[index] = {
        ...contactToRemove,
        type: "remove",
      };
    }

    setFormData((prev) => ({ ...prev, contacts: updatedContacts }));
  };

  const prepareContactsForSubmit = () => {
    const contactsPayload = [];

    formData.contacts.forEach((contact, index) => {
      // Skip unchanged existing contacts (they don't need to be sent)
      if (contact.type === "existing") return;

      // Handle removed contacts
      if (contact.type === "remove") {
        contactsPayload.push({
          type: "remove",
          index: originalContacts.findIndex(
            (orig) =>
              orig.name === contact.originalName &&
              orig.email === contact.originalEmail
          ),
        });
        return;
      }

      // Handle edited contacts
      if (contact.type === "edit") {
        const originalIndex = originalContacts.findIndex(
          (orig) =>
            orig.name === contact.originalName &&
            orig.email === contact.originalEmail
        );

        contactsPayload.push({
          type: "edit",
          index: originalIndex,
          name: contact.name,
          designation: contact.designation,
          phone: contact.phone,
          email: contact.email,
        });
        return;
      }

      // Handle new contacts
      if (contact.type === "add") {
        contactsPayload.push({
          type: "add",
          name: contact.name,
          designation: contact.designation,
          phone: contact.phone,
          email: contact.email,
        });
      }
    });

    return contactsPayload;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const editData = {
      data: {
        branchcode: formData.branchcode,
        client_code: client.client_code,
        company_name: formData.company_name,
        client_name: formData.client_name,
        primary_phone: formData.primary_phone,
        email: formData.email,
        office_address: formData.office_address,
        website: formData.website,
        contacts: prepareContactsForSubmit(),
        industry_type: formData.industry_type,
        comm_type: formData.comm_type,
        status: formData.status,
      },
    };

    console.log("Submitting data:", editData);

    try {
      const response = await apiClient.put(
        `/client/overview/edit`,
        editData
      );

      if (response.status === 201) {
        notify.success("Client updated successfully!");
        onSuccess();
        onCancel();
      } else {
        setError(response.data.message || "Failed to update client");
        notify.error(response.data.message || "Failed to update client");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      notify.error(err.response?.data?.message || "Error updating client");
    } finally {
      setLoading(false);
    }
  };

  // Render contact fields with appropriate styling based on their type
  const renderContactFields = (contact, index) => {
    const isRemoved = contact.type === "remove";

    return (
      <div
        key={index}
        className={`grid grid-cols-1 md:grid-cols-4 gap-4 relative ${
          isRemoved ? "opacity-50 bg-gray-100 dark:bg-gray-700" : ""
        }`}
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
            disabled={isRemoved}
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
            disabled={isRemoved}
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
            disabled={isRemoved}
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
            disabled={isRemoved}
          />
        </div>

        <button
          type="button"
          onClick={() => removeContact(index)}
          className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
        >
          <Trash2 size={16} />
        </button>

        {isRemoved && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
              Marked for removal
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 dark:bg-gray-800 bg-white p-6 rounded-lg">
{/* Client Information Section */}
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
              <Hash className="inline mr-1" size={14} /> Client Code
            </p>
            <input
              value={client?.client_code || ""}
              className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 focus:outline-none"
              type="text"
              readOnly
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
            <select
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
            </select>
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
        </div>
      </div>

      {/* Address Section */}
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

      {/* Contacts Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700">
          Contacts
        </h3>
        {formData.contacts.map((contact, index) =>
          renderContactFields(contact, index)
        )}

        <button
          type="button"
          onClick={addContact}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <Plus size={16} /> Add Another Contact
        </button>
      </div>

      {/* Communication & Status Section */}
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
            <select
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
            </select>
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
          {loading ? <ButtonLoader /> : "Update Client"}
        </button>
      </div>
    </div>
  );
};

export default ClientEditForm;

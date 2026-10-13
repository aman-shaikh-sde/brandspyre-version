import React, { useEffect, useState } from "react";
import { apiClient } from "src/services/apiClient";
import { BASE_URL } from "~/constants/api";
import { notify } from "~/services/notificationService";
import { ButtonLoader } from "src/component/Loaders/ButtonLoader";
import { useAuthStore } from "src/stores/authStore";
import useBranchStore from "src/stores/useBranchStore";
import {
  UsersRound,
  Globe,
  MapPin,
  Landmark,
  UserCheck,
  Sliders,
  Plus,
  Trash2,
  Building2,
  Mail,
  Phone,
  CreditCard,
  FileText
} from "lucide-react";

interface ClientAddFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ClientAddForm({ onSuccess, onCancel }: ClientAddFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "gst" | "address" | "finance" | "contacts" | "custom">("basic");
  
  const token = useAuthStore((state) => state.accessToken);
  const userRole = useAuthStore((state) => state.role);
  const branchCodeOptions = useBranchStore((state) => state.branchCodeOptions);
  const branchcodeForNor = useAuthStore((state) => state.branchcode);

  const [leadOptions, setLeadOptions] = useState<any[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  const [form, setForm] = useState({
    branchcode: userRole === "superadmin" ? "" : branchcodeForNor,
    lead_id: "",
    salutation: "",
    first_name: "",
    last_name: "",
    client_name: "",
    company_name: "",
    display_name: "",
    primary_phone: "",
    email: "",
    website: "",
    industry_type: "commercial",
    comm_type: "email",
    status: "active",
    gstin: "",
    pan_number: "",
    tax_number: "",
    billing_address: "",
    shipping_address: "",
    office_address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    credit_limit: 100000,
    payment_terms: "Net 30",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    contacts: [
      { name: "", designation: "", phone: "", email: "" }
    ]
  });

  useEffect(() => {
    fetchCustomFieldDefs();
  }, []);

  useEffect(() => {
    if (form.branchcode) {
      fetchLeadOptions(form.branchcode);
    }
  }, [form.branchcode]);

  const fetchCustomFieldDefs = async () => {
    try {
      const res = await apiClient.get(`/config/entities/CUSTOMER/fields`);
      if (res.data?.success) {
        const customDefs = (res.data.data || []).filter((f: any) => f.is_system === false || f.scope === 'ORGANIZATION');
        setCustomFieldDefs(customDefs);
      }
    } catch (err) {
      console.warn("Could not fetch customer custom field definitions:", err);
    }
  };

  const fetchLeadOptions = async (bCode: string) => {
    try {
      let res;
      try {
        res = await apiClient.get(`/lead/read?branchcode=${bCode}`);
      } catch {
        res = await apiClient.get(`/sales/lead/read?branchcode=${bCode}`);
      }
      const leads = res.data?.data || res.data || [];
      if (Array.isArray(leads)) {
        setLeadOptions(leads.map((l: any) => ({
          value: l._id || l.id,
          label: l.lead_name || l.name || "Unnamed Lead"
        })));
      }
    } catch {
      setLeadOptions([]);
    }
  };

  const handleContactChange = (index: number, field: string, val: string) => {
    const updated = [...form.contacts];
    updated[index] = { ...updated[index], [field]: val };
    setForm({ ...form, contacts: updated });
  };

  const handleAddContact = () => {
    setForm({
      ...form,
      contacts: [...form.contacts, { name: "", designation: "", phone: "", email: "" }]
    });
  };

  const handleRemoveContact = (index: number) => {
    if (form.contacts.length === 1) return;
    setForm({
      ...form,
      contacts: form.contacts.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedClientName = form.client_name || `${form.salutation} ${form.first_name} ${form.last_name}`.trim();
    if (!resolvedClientName) {
      notify.error("Client Name is required.");
      return;
    }
    if (!form.primary_phone) {
      notify.error("Primary Phone is required.");
      return;
    }

    setLoading(true);
    try {
      const clientData = {
        data: [
          {
            branchcode: form.branchcode || branchcodeForNor || "DEFAULT",
            lead_id: form.lead_id || undefined,
            client_name: resolvedClientName,
            company_name: form.company_name?.trim() || "N/A",
            primary_phone: form.primary_phone,
            email: form.email,
            office_address: form.office_address || form.billing_address,
            website: form.website,
            industry_type: form.industry_type,
            comm_type: form.comm_type,
            status: form.status,
            tax_number: form.gstin || form.tax_number,
            credit_limit: Number(form.credit_limit),
            payment_terms: form.payment_terms,
            contacts: form.contacts,
            custom_fields: {
              ...customFieldsData,
              account_number: form.account_number || customFieldsData['account_number'],
              bank_name: form.bank_name || customFieldsData['bank_name'],
              ifsc_code: form.ifsc_code || customFieldsData['ifsc_code']
            }
          }
        ]
      };

      const response = await apiClient.post(
        `/client/overview/create`,
        clientData
      );

      if (response.status === 201 || response.data?.message) {
        notify.success("New Customer / Client Added Successfully!");
        onSuccess();
        onCancel();
      }
    } catch (err: any) {
      notify.error(err.response?.data?.message || err.response?.data?.error || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs";

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* Enterprise Tab Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 overflow-x-auto text-xs font-semibold">
        {[
          { id: "basic", label: "Basic Details", icon: UsersRound },
          { id: "gst", label: "GST & Taxation", icon: Globe },
          { id: "address", label: "Addresses", icon: MapPin },
          { id: "finance", label: "Financial & Credit", icon: Landmark },
          { id: "contacts", label: "Portal & Contacts", icon: UserCheck },
          { id: "custom", label: "Custom Fields", icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? "bg-red-700 text-white font-bold shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* TAB 1: BASIC DETAILS */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">Primary Contact & Company Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Branch Code *</label>
                <select
                  required
                  value={form.branchcode}
                  onChange={(e) => setForm({ ...form, branchcode: e.target.value })}
                  className={inputStyle}
                >
                  <option value="">Select Branch</option>
                  {(branchCodeOptions || []).map((b: any) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className={inputStyle}
                  placeholder="e.g. Acme Global Inc"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Client / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  className={inputStyle}
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Primary Phone *</label>
                <input
                  type="text"
                  required
                  value={form.primary_phone}
                  onChange={(e) => setForm({ ...form, primary_phone: e.target.value })}
                  className={inputStyle}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Primary Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputStyle}
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Industry Type</label>
                <select
                  value={form.industry_type}
                  onChange={(e) => setForm({ ...form, industry_type: e.target.value })}
                  className={inputStyle}
                >
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                  <option value="industrial">Industrial</option>
                  <option value="retail">Retail</option>
                  <option value="hospitality">Hospitality</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Website URL</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className={inputStyle}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Associated Lead</label>
                <select
                  value={form.lead_id}
                  onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
                  className={inputStyle}
                >
                  <option value="">Select Lead (Optional)</option>
                  {leadOptions.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GST & TAXATION */}
        {activeTab === "gst" && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">Tax & Regulatory Compliance</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">GSTIN / Tax Registration Number</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                  className={`${inputStyle} uppercase font-mono`}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">PAN Number</label>
                <input
                  type="text"
                  value={form.pan_number}
                  onChange={(e) => setForm({ ...form, pan_number: e.target.value })}
                  className={`${inputStyle} uppercase font-mono`}
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADDRESSES */}
        {activeTab === "address" && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">Office & Billing Address</h4>
            
            <div>
              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Office / Billing Address</label>
              <textarea
                rows={3}
                value={form.office_address}
                onChange={(e) => setForm({ ...form, office_address: e.target.value, billing_address: e.target.value })}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                placeholder="Complete street address, building, floor..."
              />
            </div>
          </div>
        )}

        {/* TAB 4: FINANCIAL & CREDIT */}
        {activeTab === "finance" && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">Commercial Credit Terms & Banking</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.credit_limit}
                  onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })}
                  className={`${inputStyle} font-mono font-bold`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Default Payment Terms</label>
                <select
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  className={inputStyle}
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Bank Name</label>
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className={inputStyle}
                  placeholder="e.g. HDFC Bank"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Account Number</label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  className={`${inputStyle} font-mono`}
                  placeholder="e.g. 50100012345678"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">IFSC Code</label>
                <input
                  type="text"
                  value={form.ifsc_code}
                  onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })}
                  className={`${inputStyle} font-mono uppercase`}
                  placeholder="HDFC0001234"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PORTAL & CONTACTS */}
        {activeTab === "contacts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Contact Persons Directory</h4>
              <button
                type="button"
                onClick={handleAddContact}
                className="px-2.5 py-1 bg-red-50 text-red-700 dark:bg-red-950/40 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-100 cursor-pointer"
              >
                <Plus size={14} /> Add Contact Person
              </button>
            </div>

            {form.contacts.map((contact, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Contact #{idx + 1}</span>
                  {form.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(idx)}
                      className="text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={contact.name}
                    onChange={(e) => handleContactChange(idx, "name", e.target.value)}
                    className={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Designation"
                    value={contact.designation}
                    onChange={(e) => handleContactChange(idx, "designation", e.target.value)}
                    className={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(idx, "phone", e.target.value)}
                    className={inputStyle}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(idx, "email", e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: CUSTOM FIELDS */}
        {activeTab === "custom" && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">Organization Custom Fields</h4>
            
            {customFieldDefs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                No custom fields defined for Customer. You can add custom fields in Settings → Module Settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customFieldDefs.map((def) => (
                  <div key={def.field_code}>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {def.label} {def.required && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type={def.data_type === 'number' ? 'number' : def.data_type === 'date' ? 'date' : 'text'}
                      required={def.required}
                      placeholder={def.placeholder || `Enter ${def.label}...`}
                      value={customFieldsData[def.field_code] || (def.field_code === 'account_number' ? form.account_number : '')}
                      onChange={(e) => {
                        setCustomFieldsData({ ...customFieldsData, [def.field_code]: e.target.value });
                        if (def.field_code === 'account_number') {
                          setForm({ ...form, account_number: e.target.value });
                        }
                      }}
                      className={inputStyle}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form Action Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-md transition cursor-pointer text-xs flex items-center gap-1.5"
          >
            {loading ? <ButtonLoader /> : "Create Customer / Client Master"}
          </button>
        </div>
      </form>
    </div>
  );
}

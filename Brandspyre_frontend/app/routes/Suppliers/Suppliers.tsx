import React, { useState, useEffect } from "react";
import { apiClient } from "src/services/apiClient";
import { notify } from "~/services/notificationService";
import {
  UsersRound,
  Plus,
  Phone,
  Mail,
  Edit,
  Globe,
  MapPin,
  Landmark,
  UserCheck,
  Sliders,
  Building,
  CheckCircle2,
  Trash2
} from "lucide-react";
import ModuleGuard from "../guards/ModuleGuard";
import PageHeader from "src/component/ui/PageHeader";
import { Button } from "src/component/ui/Button";
import { CrmBadge } from "src/component/ui/CrmBadge";
import Modal from "src/component/Modal";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Jammu and Kashmir"
];

const INITIAL_VENDOR_STATE = {
  salutation: "",
  first_name: "",
  last_name: "",
  name: "", // Computed or direct vendor name
  supplier_code: "",
  company_name: "",
  display_name: "",
  vendor_language: "English",
  email: "",
  phone: "",
  work_phone: "",
  landline: "",
  website: "",
  department: "",
  designation: "",
  skype: "",
  remarks: "",

  // GST & Taxation
  gst_number: "",
  pan_number: "",
  gst_treatment: "Registered Regular",
  source_of_supply: "Delhi",
  msme_registered: false,
  tds_applicable: false,
  pan_verified: false,

  // Billing Address
  billing_address: {
    attention: "",
    country: "India",
    street1: "",
    street2: "",
    city: "",
    state: "",
    state_code: "",
    pincode: "",
    phone: "",
    fax: ""
  },

  // Shipping Address
  shipping_address: {
    same_as_billing: true,
    attention: "",
    country: "India",
    street1: "",
    street2: "",
    city: "",
    state: "",
    state_code: "",
    pincode: "",
    phone: "",
    fax: ""
  },

  // Financial & Banking
  financial_settings: {
    currency: "INR",
    accounts_payable_account: "Accounts Payable",
    payment_terms: "Net 30",
    opening_balance: 0,
    opening_balance_date: "",
    credit_limit: 0,
    default_tax_preference: "Taxable",
    default_expense_account: "Cost of Goods Sold"
  },
  banking_info: {
    account_holder_name: "",
    bank_name: "",
    bank_branch_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    swift_code: "",
    iban: "",
    upi_id: "",
    beneficiary_name: ""
  },

  // Portal & Contacts
  portal_access: false,
  contact_persons: [] as Array<{ name: string; email: string; phone: string; designation: string }>,

  // Custom Fields
  custom_fields: {
    vendor_rating: "5 Star",
    registration_expiry_date: "",
    preferred_shipper: ""
  }
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "gst" | "address" | "finance" | "portal" | "custom">("basic");
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);

  const [form, setForm] = useState(INITIAL_VENDOR_STATE);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/suppliers");
      if (res.data?.success) {
        setSuppliers(res.data.items || []);
      }
    } catch (err) {
      notify.error("Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFieldDefs = async () => {
    try {
      const res = await apiClient.get("/config/entities/SUPPLIER/fields");
      if (res.data?.success) {
        const customDefs = (res.data.data || []).filter((f: any) => f.is_system === false || f.scope === 'ORGANIZATION');
        setCustomFieldDefs(customDefs);
      }
    } catch (err) {
      console.warn("Could not fetch supplier custom field definitions:", err);
    }
  };

  useEffect(() => {
    loadSuppliers();
    fetchCustomFieldDefs();
  }, []);

  const handleOpenAddModal = () => {
    setForm(INITIAL_VENDOR_STATE);
    setIsEditing(false);
    setEditingId(null);
    setActiveTab("basic");
    setShowModal(true);
  };

  const handleOpenEditModal = (s: any) => {
    const d = s.details || {};
    setForm({
      salutation: d.salutation || "",
      first_name: d.first_name || "",
      last_name: d.last_name || "",
      name: s.name || "",
      supplier_code: s.supplier_code || "",
      company_name: s.company_name || "",
      display_name: d.display_name || s.name || "",
      vendor_language: d.vendor_language || "English",
      email: s.email || d.email || "",
      phone: s.phone || d.phone || "",
      work_phone: d.work_phone || "",
      landline: d.landline || "",
      website: d.website || "",
      department: d.department || "",
      designation: d.designation || "",
      skype: d.skype || "",
      remarks: d.remarks || "",

      gst_number: d.gst_number || s.tax_number || "",
      pan_number: d.pan_number || "",
      gst_treatment: d.gst_treatment || "Registered Regular",
      source_of_supply: d.source_of_supply || "Delhi",
      msme_registered: Boolean(d.msme_registered),
      tds_applicable: Boolean(d.tds_applicable),
      pan_verified: Boolean(d.pan_verified),

      billing_address: d.billing_address || { attention: "", country: "India", street1: s.address || "", street2: "", city: "", state: "", state_code: "", pincode: "", phone: "", fax: "" },
      shipping_address: d.shipping_address || { same_as_billing: true, attention: "", country: "India", street1: "", street2: "", city: "", state: "", state_code: "", pincode: "", phone: "", fax: "" },
      financial_settings: d.financial_settings || { currency: "INR", accounts_payable_account: "Accounts Payable", payment_terms: s.payment_terms || "Net 30", opening_balance: s.opening_balance || 0, opening_balance_date: "", credit_limit: s.credit_limit || 0, default_tax_preference: "Taxable", default_expense_account: "Cost of Goods Sold" },
      banking_info: d.banking_info || { account_holder_name: "", bank_name: "", bank_branch_name: "", account_number: "", confirm_account_number: "", ifsc_code: "", swift_code: "", iban: "", upi_id: "", beneficiary_name: "" },
      portal_access: Boolean(d.portal_access),
      contact_persons: d.contact_persons || [],
      custom_fields: d.custom_fields || { vendor_rating: "5 Star", registration_expiry_date: "", preferred_shipper: "" }
    });
    setIsEditing(true);
    setEditingId(s._id);
    setActiveTab("basic");
    setShowModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorName = form.company_name || form.display_name || `${form.first_name} ${form.last_name}`.trim() || form.name;
    if (!vendorName) {
      notify.error("Vendor Legal Name / Company Name is required.");
      return;
    }

    const payload = {
      ...form,
      name: vendorName,
      company_name: form.company_name || vendorName,
      tax_number: form.gst_number || form.pan_number || form.tax_number || ""
    };

    try {
      if (isEditing && editingId) {
        const res = await apiClient.put(`/suppliers/${editingId}`, payload);
        if (res.data?.success) {
          notify.success("Supplier Master updated successfully!");
          setShowModal(false);
          loadSuppliers();
        }
      } else {
        const res = await apiClient.post("/suppliers", payload);
        if (res.data?.success) {
          notify.success("Supplier Master created successfully!");
          setShowModal(false);
          loadSuppliers();
        }
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.error || "Failed to save supplier.");
    }
  };

  const addContactPerson = () => {
    setForm({
      ...form,
      contact_persons: [...form.contact_persons, { name: "", email: "", phone: "", designation: "" }]
    });
  };

  const removeContactPerson = (idx: number) => {
    const list = [...form.contact_persons];
    list.splice(idx, 1);
    setForm({ ...form, contact_persons: list });
  };

  return (
    <ModuleGuard requiredModule="PURCHASE">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Vendor & Supplier Master"
          description="Enterprise vendor profiles, GST compliance, banking ledgers, multiple addresses, and contact persons."
          primaryAction={{
            label: "New Vendor Master",
            onClick: handleOpenAddModal,
            icon: <Plus size={16} />,
          }}
        />

        {/* Supplier Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((s) => {
            const d = s.details || {};
            return (
              <div key={s._id} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">{s.name}</span>
                    {s.company_name && <span className="text-[11px] text-slate-500 font-medium">{s.company_name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{s.supplier_code}</span>
                    <button
                      onClick={() => handleOpenEditModal(s)}
                      title="Edit Vendor Master"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  {s.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-slate-400" /> {s.phone}</div>}
                  {s.email && <div className="flex items-center gap-2"><Mail size={12} className="text-slate-400" /> {s.email}</div>}
                  {(d.gst_number || s.tax_number) && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md w-max">
                      <Globe size={11} /> GST: {d.gst_number || s.tax_number}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">Current Ledger Balance:</span>
                  <span className="text-slate-900 dark:text-white font-mono">₹{s.current_balance || 0}</span>
                </div>
              </div>
            );
          })}
        </div>

        <Modal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? "Edit Vendor Master" : "New Vendor Master"}
        subtitle="Configure vendor company profile, GST compliance, addresses, and banking."
        maxWidth="4xl"
      >
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 overflow-x-auto text-xs font-semibold">
          {[
            { id: "basic", label: "Basic Details", icon: UsersRound },
            { id: "gst", label: "GST & Taxation", icon: Globe },
            { id: "address", label: "Addresses", icon: MapPin },
            { id: "finance", label: "Financial & Banking", icon: Landmark },
            { id: "portal", label: "Portal & Contacts", icon: UserCheck },
            { id: "custom", label: "Custom Fields", icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs ${
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

        <form onSubmit={handleSaveSupplier} className="space-y-4">
                
                {/* TAB 1: BASIC DETAILS */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1">Primary Contact & Company Information</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Salutation</label>
                        <select
                          value={form.salutation}
                          onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                        >
                          <option value="">None</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">First Name</label>
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="e.g. Rahul"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Last Name</label>
                        <input
                          type="text"
                          value={form.last_name}
                          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="e.g. Sharma"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Vendor Code *</label>
                        <input
                          type="text"
                          required
                          value={form.supplier_code}
                          onChange={(e) => setForm({ ...form, supplier_code: e.target.value })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 uppercase"
                          placeholder="e.g. VEND0001"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Vendor (Legal) Name *</label>
                        <input
                          type="text"
                          required
                          value={form.company_name}
                          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="e.g. Acme Corporation Pvt Ltd"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Display Name</label>
                        <input
                          type="text"
                          value={form.display_name}
                          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="Search / transaction print name"
                        />
                      </div>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1 pt-2">Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Primary Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="vendor@example.com"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Mobile Number</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Work Phone / Landline</label>
                        <input
                          type="text"
                          value={form.work_phone}
                          onChange={(e) => setForm({ ...form, work_phone: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="Work phone number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Website URL</label>
                        <input
                          type="url"
                          value={form.website}
                          onChange={(e) => setForm({ ...form, website: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Department</label>
                        <input
                          type="text"
                          value={form.department}
                          onChange={(e) => setForm({ ...form, department: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="e.g. Procurement"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Designation</label>
                        <input
                          type="text"
                          value={form.designation}
                          onChange={(e) => setForm({ ...form, designation: e.target.value })}
                          className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                          placeholder="e.g. Account Manager"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Remarks / Internal Description</label>
                      <textarea
                        rows={2}
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        className="w-full h-10 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all shadow-2xs"
                        placeholder="Internal notes about this vendor..."
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: GST & TAXATION */}
                {activeTab === "gst" && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1">GST Identification & Lookup</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">GST NUMBER (GSTIN)</label>
                        <input
                          type="text"
                          value={form.gst_number}
                          onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-mono"
                          placeholder="e.g. 07AAAAA0000A1Z5"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">PAN NUMBER</label>
                        <input
                          type="text"
                          value={form.pan_number}
                          onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-mono"
                          placeholder="10-CHARACTER PAN"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">GST TREATMENT</label>
                        <select
                          value={form.gst_treatment}
                          onChange={(e) => setForm({ ...form, gst_treatment: e.target.value })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        >
                          <option value="Registered Regular">Registered Regular</option>
                          <option value="Composition Scheme">Composition Scheme</option>
                          <option value="Unregistered Business">Unregistered Business</option>
                          <option value="Consumer">Consumer</option>
                          <option value="Overseas / Import">Overseas / Import</option>
                          <option value="SEZ Unit">SEZ Unit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">SOURCE OF SUPPLY (STATE)</label>
                        <select
                          value={form.source_of_supply}
                          onChange={(e) => setForm({ ...form, source_of_supply: e.target.value })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1 pt-2">Compliance & Tax Setup</h4>
                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={form.msme_registered}
                          onChange={(e) => setForm({ ...form, msme_registered: e.target.checked })}
                          className="rounded text-red-700"
                        />
                        MSME REGISTERED
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={form.tds_applicable}
                          onChange={(e) => setForm({ ...form, tds_applicable: e.target.checked })}
                          className="rounded text-red-700"
                        />
                        TDS APPLICABLE
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={form.pan_verified}
                          onChange={(e) => setForm({ ...form, pan_verified: e.target.checked })}
                          className="rounded text-red-700"
                        />
                        PAN VERIFIED
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 3: ADDRESSES */}
                {activeTab === "address" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Billing Address */}
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border">
                        <h4 className="font-extrabold text-xs text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin size={14} /> Billing Address
                        </h4>
                        <div>
                          <label className="block font-bold mb-1">Attention</label>
                          <input
                            type="text"
                            value={form.billing_address.attention}
                            onChange={(e) => setForm({ ...form, billing_address: { ...form.billing_address, attention: e.target.value } })}
                            className="w-full p-2 border rounded-lg dark:bg-slate-900"
                            placeholder="Contact Person Name"
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Street Address 1</label>
                          <input
                            type="text"
                            value={form.billing_address.street1}
                            onChange={(e) => setForm({ ...form, billing_address: { ...form.billing_address, street1: e.target.value } })}
                            className="w-full p-2 border rounded-lg dark:bg-slate-900"
                            placeholder="Building / Street address"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold mb-1">City</label>
                            <input
                              type="text"
                              value={form.billing_address.city}
                              onChange={(e) => setForm({ ...form, billing_address: { ...form.billing_address, city: e.target.value } })}
                              className="w-full p-2 border rounded-lg dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">State</label>
                            <select
                              value={form.billing_address.state}
                              onChange={(e) => setForm({ ...form, billing_address: { ...form.billing_address, state: e.target.value } })}
                              className="w-full p-2 border rounded-lg dark:bg-slate-900"
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold mb-1">Pincode</label>
                            <input
                              type="text"
                              value={form.billing_address.pincode}
                              onChange={(e) => setForm({ ...form, billing_address: { ...form.billing_address, pincode: e.target.value } })}
                              className="w-full p-2 border rounded-lg dark:bg-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">Phone</label>
                            <input
                              type="text"
                              value={form.billing_address.phone}
                              onChange={(e) => setForm({ ...form, billing_address: { ...form.billing_address, phone: e.target.value } })}
                              className="w-full p-2 border rounded-lg dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin size={14} /> Shipping Address
                          </h4>
                          <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.shipping_address.same_as_billing}
                              onChange={(e) => setForm({ ...form, shipping_address: { ...form.shipping_address, same_as_billing: e.target.checked } })}
                              className="rounded text-red-700"
                            />
                            Same as billing
                          </label>
                        </div>

                        {!form.shipping_address.same_as_billing && (
                          <>
                            <div>
                              <label className="block font-bold mb-1">Attention</label>
                              <input
                                type="text"
                                value={form.shipping_address.attention}
                                onChange={(e) => setForm({ ...form, shipping_address: { ...form.shipping_address, attention: e.target.value } })}
                                className="w-full p-2 border rounded-lg dark:bg-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block font-bold mb-1">Street Address 1</label>
                              <input
                                type="text"
                                value={form.shipping_address.street1}
                                onChange={(e) => setForm({ ...form, shipping_address: { ...form.shipping_address, street1: e.target.value } })}
                                className="w-full p-2 border rounded-lg dark:bg-slate-900"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block font-bold mb-1">City</label>
                                <input
                                  type="text"
                                  value={form.shipping_address.city}
                                  onChange={(e) => setForm({ ...form, shipping_address: { ...form.shipping_address, city: e.target.value } })}
                                  className="w-full p-2 border rounded-lg dark:bg-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block font-bold mb-1">State</label>
                                <select
                                  value={form.shipping_address.state}
                                  onChange={(e) => setForm({ ...form, shipping_address: { ...form.shipping_address, state: e.target.value } })}
                                  className="w-full p-2 border rounded-lg dark:bg-slate-900"
                                >
                                  <option value="">Select State</option>
                                  {INDIAN_STATES.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </>
                        )}
                        {form.shipping_address.same_as_billing && (
                          <div className="p-8 text-center text-slate-400 text-xs italic">
                            Shipping address is identical to Billing Address.
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 4: FINANCIAL & BANKING */}
                {activeTab === "finance" && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1">Financial Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Currency</label>
                        <select
                          value={form.financial_settings.currency}
                          onChange={(e) => setForm({ ...form, financial_settings: { ...form.financial_settings, currency: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Payment Terms</label>
                        <select
                          value={form.financial_settings.payment_terms}
                          onChange={(e) => setForm({ ...form, financial_settings: { ...form.financial_settings, payment_terms: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        >
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 45">Net 45</option>
                          <option value="Net 60">Net 60</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Opening Balance (₹)</label>
                        <input
                          type="number"
                          value={form.financial_settings.opening_balance}
                          onChange={(e) => setForm({ ...form, financial_settings: { ...form.financial_settings, opening_balance: Number(e.target.value) } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Credit Limit (₹)</label>
                        <input
                          type="number"
                          value={form.financial_settings.credit_limit}
                          onChange={(e) => setForm({ ...form, financial_settings: { ...form.financial_settings, credit_limit: Number(e.target.value) } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                          placeholder="e.g. 500000"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Opening Balance Date</label>
                        <input
                          type="date"
                          value={form.financial_settings.opening_balance_date}
                          onChange={(e) => setForm({ ...form, financial_settings: { ...form.financial_settings, opening_balance_date: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1 pt-2">Banking Information & RTGS/NEFT</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Account Holder Name</label>
                        <input
                          type="text"
                          value={form.banking_info.account_holder_name}
                          onChange={(e) => setForm({ ...form, banking_info: { ...form.banking_info, account_holder_name: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Bank Name</label>
                        <input
                          type="text"
                          value={form.banking_info.bank_name}
                          onChange={(e) => setForm({ ...form, banking_info: { ...form.banking_info, bank_name: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                          placeholder="e.g. State Bank of India"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Account Number</label>
                        <input
                          type="text"
                          value={form.banking_info.account_number}
                          onChange={(e) => setForm({ ...form, banking_info: { ...form.banking_info, account_number: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">IFSC Code</label>
                        <input
                          type="text"
                          value={form.banking_info.ifsc_code}
                          onChange={(e) => setForm({ ...form, banking_info: { ...form.banking_info, ifsc_code: e.target.value.toUpperCase() } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-mono uppercase"
                          placeholder="e.g. SBIN0000123"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">UPI ID</label>
                        <input
                          type="text"
                          value={form.banking_info.upi_id}
                          onChange={(e) => setForm({ ...form, banking_info: { ...form.banking_info, upi_id: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                          placeholder="vendor@upi"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">SWIFT / IBAN Code</label>
                        <input
                          type="text"
                          value={form.banking_info.swift_code}
                          onChange={(e) => setForm({ ...form, banking_info: { ...form.banking_info, swift_code: e.target.value.toUpperCase() } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: PORTAL & CONTACT PERSONS */}
                {activeTab === "portal" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Vendor Self-Service Portal Access</h4>
                        <p className="text-slate-500 text-[11px]">Allow this vendor to log in, view purchase orders, submit bills, and track payments.</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={form.portal_access}
                          onChange={(e) => setForm({ ...form, portal_access: e.target.checked })}
                          className="rounded text-red-700 scale-125"
                        />
                        Enable Portal Access
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-b pb-2 pt-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Additional Contact Persons</h4>
                      <button
                        type="button"
                        onClick={addContactPerson}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} /> Add Contact
                      </button>
                    </div>

                    {form.contact_persons.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                        No additional contacts defined. Click the button above to add key representatives.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {form.contact_persons.map((c, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border items-center">
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={c.name}
                                onChange={(e) => {
                                  const list = [...form.contact_persons];
                                  list[idx].name = e.target.value;
                                  setForm({ ...form, contact_persons: list });
                                }}
                                className="w-full p-2 border rounded-lg dark:bg-slate-900"
                                placeholder="Contact Name"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="email"
                                value={c.email}
                                onChange={(e) => {
                                  const list = [...form.contact_persons];
                                  list[idx].email = e.target.value;
                                  setForm({ ...form, contact_persons: list });
                                }}
                                className="w-full p-2 border rounded-lg dark:bg-slate-900"
                                placeholder="Email"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={c.phone}
                                onChange={(e) => {
                                  const list = [...form.contact_persons];
                                  list[idx].phone = e.target.value;
                                  setForm({ ...form, contact_persons: list });
                                }}
                                className="w-full p-2 border rounded-lg dark:bg-slate-900"
                                placeholder="Phone"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={c.designation}
                                onChange={(e) => {
                                  const list = [...form.contact_persons];
                                  list[idx].designation = e.target.value;
                                  setForm({ ...form, contact_persons: list });
                                }}
                                className="w-full p-2 border rounded-lg dark:bg-slate-900"
                                placeholder="Role/Designation"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeContactPerson(idx)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: CUSTOM FIELDS */}
                {activeTab === "custom" && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-1">Configurable Custom Fields</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Vendor Rating</label>
                        <select
                          value={form.custom_fields.vendor_rating}
                          onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, vendor_rating: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        >
                          <option value="5 Star">5 Star (Preferred Enterprise)</option>
                          <option value="4 Star">4 Star (Verified Standard)</option>
                          <option value="3 Star">3 Star (Secondary Supplier)</option>
                          <option value="Probationary">Probationary / Under Review</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Registration Expiry Date</label>
                        <input
                          type="date"
                          value={form.custom_fields.registration_expiry_date}
                          onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, registration_expiry_date: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Preferred Shipper / Logistics Partner</label>
                        <input
                          type="text"
                          value={form.custom_fields.preferred_shipper}
                          onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, preferred_shipper: e.target.value } })}
                          className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700"
                          placeholder="e.g. BlueDart / DHL Enterprise"
                        />
                      </div>
                    </div>

                    {customFieldDefs.length > 0 && (
                      <div className="pt-4 border-t space-y-3">
                        <h5 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Organization Dynamic Custom Fields</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {customFieldDefs.map((def: any) => (
                            <div key={def.field_code}>
                              <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                                {def.label} {def.required && <span className="text-red-600">*</span>}
                              </label>
                              <input
                                type={def.data_type === 'number' ? 'number' : def.data_type === 'date' ? 'date' : 'text'}
                                required={def.required}
                                placeholder={def.placeholder || `Enter ${def.label}...`}
                                value={form.custom_fields?.[def.field_code] || ''}
                                onChange={(e) => setForm({ ...form, custom_fields: { ...form.custom_fields, [def.field_code]: e.target.value } })}
                                className="w-full p-2 border rounded-xl dark:bg-slate-900 dark:border-slate-700 text-xs font-semibold"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Action Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                  >
                    {isEditing ? "Update Vendor Master" : "Create Vendor Master"}
                  </Button>
                </div>

              </form>
      </Modal>
      </div>
    </ModuleGuard>
  );
}

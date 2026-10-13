import React, { useState, useEffect } from 'react';
import apiClient from "src/services/apiClient";
import { notify } from '~/services/notificationService';
import { X, Send, Lock, DollarSign, Building2, MapPin, Sparkles, Layers } from 'lucide-react';

interface CreateReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateReferralModal({ isOpen, onClose, onSuccess }: CreateReferralModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: 'TECHNOLOGY',
    location: '',
    serviceCategories: '',
    estimatedDealValue: '',
    currency: 'INR',
    leadQuality: 'WARM',
    referralType: 'EXCLUSIVE',
    referralFee: '',
    commissionType: 'FIXED',
    commissionValue: '',
    visibility: 'NETWORK_WIDE',
    contactUnlockPolicy: 'UPON_APPROVAL',
    // Contact Info
    contactName: '',
    contactCompany: '',
    contactPhone: '',
    contactEmail: '',
    contactNotes: ''
  });

  const [crmLeads, setCrmLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCrmLeads();
    }
  }, [isOpen]);

  const fetchCrmLeads = async () => {
    try {
      const res = await apiClient.get('/lead/read');
      if (res.data?.data || Array.isArray(res.data)) {
        setCrmLeads(res.data.data || res.data);
      }
    } catch (err) {
      console.warn('Could not fetch CRM leads:', err);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;
    const lead = crmLeads.find(l => l._id === leadId || l.id === leadId);
    if (lead) {
      setFormData(prev => ({
        ...prev,
        title: lead.title || `${lead.name || lead.company || 'Client'} Opportunity`,
        description: lead.notes || lead.description || `Requirement for ${lead.name || lead.company || 'client'}`,
        industry: lead.industry || 'SERVICES',
        location: lead.city || lead.location || 'India',
        estimatedDealValue: String(lead.value || lead.deal_value || 100000),
        contactName: lead.name || lead.contact_name || '',
        contactCompany: lead.company || lead.company_name || '',
        contactPhone: lead.phone || lead.phonenumber || '',
        contactEmail: lead.email || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.industry || !formData.location) {
      notify.error('Please fill in all required opportunity fields.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        industry: formData.industry,
        location: formData.location,
        serviceCategories: formData.serviceCategories ? formData.serviceCategories.split(',').map(s => s.trim()) : [],
        estimatedDealValue: Number(formData.estimatedDealValue) || 0,
        currency: formData.currency,
        leadQuality: formData.leadQuality,
        referralType: formData.referralType,
        referralFee: Number(formData.referralFee) || 0,
        commissionType: formData.commissionType,
        commissionValue: Number(formData.commissionValue) || 0,
        visibility: formData.visibility,
        contactUnlockPolicy: formData.contactUnlockPolicy,
        leadId: selectedLeadId || undefined,
        contactInfo: {
          name: formData.contactName,
          company_name: formData.contactCompany,
          phone: formData.contactPhone,
          email: formData.contactEmail,
          notes: formData.contactNotes
        }
      };

      await apiClient.post('/referrals', payload);

      notify.success('Referral Opportunity published to marketplace!');
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err?.response?.data?.error || 'Failed to create referral.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-extrabold text-[10px] uppercase tracking-wider">
              Referral Network
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
              Publish Business Opportunity
            </h2>
            <p className="text-xs text-slate-500">
              Share a qualified opportunity with partner organizations or the network
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Optional: Pick from CRM Lead */}
          {crmLeads.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-2">
              <label className="block font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-red-600" /> Convert Existing CRM Lead (Optional)
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleSelectLead(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">Select a private CRM lead to auto-fill...</option>
                {crmLeads.map((l: any) => (
                  <option key={l._id || l.id} value={l._id || l.id}>
                    {l.title || l.name || l.company} — ₹{(l.value || l.deal_value || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 1: Opportunity Overview */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Opportunity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opportunity Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manufacturing ERP & Inventory Implementation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Industry Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="SERVICES">Business Services</option>
                  <option value="RETAIL">Retail & Commerce</option>
                  <option value="HEALTHCARE">Healthcare & Pharma</option>
                  <option value="REAL_ESTATE">Real Estate & Construction</option>
                  <option value="IT_SOFTWARE">IT & Software</option>
                  <option value="LOGISTICS">Logistics & Supply Chain</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Location / Region <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune, Maharashtra"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Deal Value (₹) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="500000"
                  value={formData.estimatedDealValue}
                  onChange={(e) => setFormData({ ...formData, estimatedDealValue: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Quality Assessment
                </label>
                <select
                  value={formData.leadQuality}
                  onChange={(e) => setFormData({ ...formData, leadQuality: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                >
                  <option value="HOT">High Priority (Hot)</option>
                  <option value="WARM">Medium Priority (Warm)</option>
                  <option value="COLD">Low Priority (Cold)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Opportunity Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe scope, requirements, budget, and key buyer criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Commission & Settlement Structure */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-600" /> 2. Commission & Fee Model
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Commission Model
                </label>
                <select
                  value={formData.commissionType}
                  onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="FIXED">Fixed Referral Fee (₹)</option>
                  <option value="PERCENTAGE">Revenue Share (%)</option>
                  <option value="PER_QUALIFIED">Pay per Qualified Lead (₹)</option>
                  <option value="PAY_ON_CONVERSION">Pay Only On Deal Conversion</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Referral Fee / Commission Amount
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={formData.referralFee}
                  onChange={(e) => setFormData({ ...formData, referralFee: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact Protection (Server-Side Masked) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock size={14} className="text-amber-600" /> 3. Protected Contact Details
              </h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Lock size={12} /> Hidden from marketplace until approved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune Industrial Tech"
                  value={formData.contactCompany}
                  onChange={(e) => setFormData({ ...formData, contactCompany: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="rajesh@company.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>{loading ? 'Publishing...' : 'Publish Opportunity to Network'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
import * as LucideIcons from 'lucide-react';

interface TenantFormData {
  name: string;
  domain: string;
  adminEmail: string;
  adminPassword: string;
  businessDetails: {
    business_type_id: number | null;
    company_name: string;
    industry: string;
    company_size: string;
    website: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    tax_id: string;
    registration_number: string;
    custom_fields: any;
  };
}

interface BusinessType {
  id: number;
  name: string;
  description: string;
  default_fields: any;
}

export default function TenantRegistrationEnhanced() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    domain: "",
    adminEmail: "",
    adminPassword: "",
    businessDetails: {
      business_type_id: null,
      company_name: "",
      industry: "",
      company_size: "",
      website: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
      tax_id: "",
      registration_number: "",
      custom_fields: {}
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  const fetchBusinessTypes = async () => {
    try {
      const response = await fetch(`${BASE_URL}/business/business-types`);
      const result = await response.json();
      if (result.success || result.data) {
        setBusinessTypes(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching business types:", error);
    }
  };

  const handleBusinessTypeChange = (typeId: number) => {
    const selected = businessTypes.find(bt => bt.id === typeId);
    setSelectedBusinessType(selected || null);
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        business_type_id: typeId,
        custom_fields: selected?.default_fields || {}
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Store registration data and redirect to plan selection
      localStorage.setItem('tenantRegistrationData', JSON.stringify(formData));
      navigate("/tenant-plans");
    } catch (error) {
      console.error("Registration error:", error);
      notify.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessDetailChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        [field]: value
      }
    }));
  };

  const renderDynamicFields = () => {
    if (!selectedBusinessType || !selectedBusinessType.default_fields?.fields) {
      return null;
    }

    return selectedBusinessType.default_fields.fields.map((field: any, index: number) => (
      <div key={index} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
        </label>
        {field.type === 'select' && (
          <select
            value={formData.businessDetails.custom_fields[field.label] || ''}
            onChange={(e) => {
              const newCustomFields = { ...formData.businessDetails.custom_fields };
              newCustomFields[field.label] = e.target.value;
              setFormData(prev => ({
                ...prev,
                businessDetails: {
                  ...prev.businessDetails,
                  custom_fields: newCustomFields
                }
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select an option</option>
            {field.options.map((option: string, optIndex: number) => (
              <option key={optIndex} value={option}>{option}</option>
            ))}
          </select>
        )}
        {field.type === 'multiselect' && (
          <div className="space-y-2">
            {field.options.map((option: string, optIndex: number) => (
              <label key={optIndex} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData.businessDetails.custom_fields[field.label] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = formData.businessDetails.custom_fields[field.label] || [];
                    let newValues;
                    if (e.target.checked) {
                      newValues = [...currentValues, option];
                    } else {
                      newValues = currentValues.filter((v: string) => v !== option);
                    }
                    const newCustomFields = { ...formData.businessDetails.custom_fields };
                    newCustomFields[field.label] = newValues;
                    setFormData(prev => ({
                      ...prev,
                      businessDetails: {
                        ...prev.businessDetails,
                        custom_fields: newCustomFields
                      }
                    }));
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        )}
        {field.type === 'number' && (
          <input
            type="number"
            value={formData.businessDetails.custom_fields[field.label] || ''}
            onChange={(e) => {
              const newCustomFields = { ...formData.businessDetails.custom_fields };
              newCustomFields[field.label] = e.target.value;
              setFormData(prev => ({
                ...prev,
                businessDetails: {
                  ...prev.businessDetails,
                  custom_fields: newCustomFields
                }
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        {field.type === 'text' && (
          <input
            type="text"
            value={formData.businessDetails.custom_fields[field.label] || ''}
            onChange={(e) => {
              const newCustomFields = { ...formData.businessDetails.custom_fields };
              newCustomFields[field.label] = e.target.value;
              setFormData(prev => ({
                ...prev,
                businessDetails: {
                  ...prev.businessDetails,
                  custom_fields: newCustomFields
                }
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-2">Register Your Organization</h2>
        <p className="text-center text-gray-600 mb-8">
          Create your SaaS CRM organization and start managing your team
        </p>
        
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Organization</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Business Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Plan</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter organization name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain *
                  </label>
                  <input
                    type="text"
                    placeholder="your-org.brandspyre.com"
                    value={formData.domain}
                    onChange={(e) => handleInputChange("domain", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Enter secure password"
                    value={formData.adminPassword}
                    onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium"
                >
                  Next: Business Details →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Business Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type *
                </label>
                <select
                  value={formData.businessDetails.business_type_id || ''}
                  onChange={(e) => handleBusinessTypeChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="Legal company name"
                    value={formData.businessDetails.company_name}
                    onChange={(e) => handleBusinessDetailChange("company_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Technology, Healthcare"
                    value={formData.businessDetails.industry}
                    onChange={(e) => handleBusinessDetailChange("industry", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    value={formData.businessDetails.company_size}
                    onChange={(e) => handleBusinessDetailChange("company_size", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={formData.businessDetails.website}
                    onChange={(e) => handleBusinessDetailChange("website", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.businessDetails.phone}
                    onChange={(e) => handleBusinessDetailChange("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    placeholder="Tax identification number"
                    value={formData.businessDetails.tax_id}
                    onChange={(e) => handleBusinessDetailChange("tax_id", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  value={formData.businessDetails.address}
                  onChange={(e) => handleBusinessDetailChange("address", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.businessDetails.city}
                    onChange={(e) => handleBusinessDetailChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="State/Province"
                    value={formData.businessDetails.state}
                    onChange={(e) => handleBusinessDetailChange("state", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={formData.businessDetails.postal_code}
                    onChange={(e) => handleBusinessDetailChange("postal_code", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {renderDynamicFields()}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium"
                >
                  Next: Select Plan →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Review & Continue</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <span className="font-medium text-gray-700">Organization:</span>
                  <p className="text-gray-900">{formData.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Domain:</span>
                  <p className="text-gray-900">{formData.domain}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Admin Email:</span>
                  <p className="text-gray-900">{formData.adminEmail}</p>
                </div>
                {selectedBusinessType && (
                  <div>
                    <span className="font-medium text-gray-700">Business Type:</span>
                    <p className="text-gray-900">{selectedBusinessType.name}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium"
                >
                  Continue to Plan Selection →
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

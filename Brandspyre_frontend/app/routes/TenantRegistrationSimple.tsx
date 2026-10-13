import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
interface TenantFormData {
  name: string;
  domain: string;
  adminEmail: string;
  adminPassword: string;
  subscriptionPlan: number;
}

const subscriptionPlans = [
  { id: 1, name: "Basic", price: "$9.99/month", description: "5 users, 3 branches, basic features" },
  { id: 2, name: "Professional", price: "$29.99/month", description: "20 users, 10 branches, advanced features" },
  { id: 3, name: "Enterprise", price: "$99.99/month", description: "100 users, 50 branches, full features" }
];

export default function TenantRegistrationSimple() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    domain: "",
    adminEmail: "",
    adminPassword: "",
    subscriptionPlan: 1
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/tenants/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        notify.success("Organization registered successfully!");
        navigate("/login");
      } else {
        notify.error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      notify.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TenantFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Register Your Organization</h2>
        <p className="text-center text-gray-600 mb-8">
          Create your SaaS CRM organization and start managing your team
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
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
                    Domain
                  </label>
                  <input
                    type="text"
                    placeholder="your-org.example.com"
                    value={formData.domain}
                    onChange={(e) => handleInputChange("domain", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Admin Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Admin Account</h3>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email
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
                    Admin Password
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
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4">Subscription Plan</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Choose Your Plan
              </label>
              <select 
                value={formData.subscriptionPlan} 
                onChange={(e) => handleInputChange("subscriptionPlan", parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a subscription plan</option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium">Selected Plan Features:</p>
              <p className="mt-1">
                {subscriptionPlans.find(p => p.id === formData.subscriptionPlan)?.description}
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register Organization"}
          </button>
        </form>
      </div>
    </div>
  );
}

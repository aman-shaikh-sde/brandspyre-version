import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
import { IoIosArrowRoundForward } from "react-icons/io";

interface TenantFormData {
  name: string;
  domain: string;
  adminEmail: string;
  adminPassword: string;
  subscriptionPlan: number;
}

const FloatingInput = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  label,
  required = false,
  disabled = false,
}: {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value.length > 0;
  const shouldFloatLabel = isFocused || hasValue;

  return (
    <div className="relative mt-6">
      <input
        id={id}
        ref={inputRef}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 peer"
      />
      <label
        htmlFor={id}
        className={`absolute left-3 transition-all duration-200 pointer-events-none ${
          shouldFloatLabel
            ? "top-0 text-xs text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-1"
            : "top-3.5 text-base text-gray-500 dark:text-gray-400"
        }`}
      >
        {label}
      </label>
    </div>
  );
};

export default function TenantRegistrationThemed() {
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
        navigate("/tenant-plans");
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
    <div className="grid grid-cols-1 sm:grid-cols-2 h-screen w-full bg-gray-100 dark:bg-gray-100 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div>
            <p className="mt-4 text-gray-500">Registering...</p>
          </div>
        </div>
      )}

      <div className="hidden sm:block">
        <div className="w-[600px] h-[400px] object-cover mt-[100px] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-700 dark:text-red-600 mb-4">Register Your Organization</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Create your SaaS CRM organization</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-transparent flex flex-col justify-center">
        <form
          className="max-w-[400px] w-full mx-auto bg-white dark:bg-transparent p-4"
          onSubmit={handleSubmit}
        >
          <h2 className="text-transparent text-3xl font-bold text-center py-3 bg-gradient-to-r from-red-700 to-red-600 bg-clip-text">
            Organization Registration
          </h2>
          
          <div className="flex flex-col gap-6">
            <FloatingInput
              id="orgName"
              name="orgName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              label="Organization Name"
              required
              disabled={isLoading}
            />

            <FloatingInput
              id="domain"
              name="domain"
              type="text"
              value={formData.domain}
              onChange={(e) => handleInputChange("domain", e.target.value)}
              label="Domain"
              required
              disabled={isLoading}
            />

            <FloatingInput
              id="adminEmail"
              name="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => handleInputChange("adminEmail", e.target.value)}
              label="Admin Email"
              required
              disabled={isLoading}
            />

            <FloatingInput
              id="adminPassword"
              name="adminPassword"
              type="password"
              value={formData.adminPassword}
              onChange={(e) => handleInputChange("adminPassword", e.target.value)}
              label="Admin Password"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full my-5 py-3 text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Continue to Plans <IoIosArrowRoundForward className="inline" size={25} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

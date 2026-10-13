import React, { useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
import { IoIosArrowRoundForward } from "react-icons/io";
import { FaCheck } from "react-icons/fa";

interface Plan {
  id: number;
  name: string;
  price: string;
  description: string;
  features: string[];
  users: number;
  branches: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 1,
    name: "Free",
    price: "$0/month",
    description: "Perfect for getting started with BRANDSPYRE",
    features: [
      "3 Users",
      "1 Branch",
      "Basic CRM Features",
      "Community Support",
      "1GB Storage",
      "Basic Projects"
    ],
    users: 3,
    branches: 1
  },
  {
    id: 2,
    name: "Basic",
    price: "$29.99/month",
    description: "Perfect for small teams getting started",
    features: [
      "5 Users",
      "3 Branches",
      "Basic CRM Features",
      "Email Support",
      "10GB Storage",
      "Basic Projects"
    ],
    users: 5,
    branches: 3
  },
  {
    id: 3,
    name: "Professional",
    price: "$79.99/month",
    description: "Great for growing businesses",
    features: [
      "20 Users",
      "10 Branches",
      "Advanced CRM Features",
      "Priority Email Support",
      "50GB Storage",
      "API Access",
      "Custom Reports",
      "Advanced Projects"
    ],
    users: 20,
    branches: 10,
    popular: true
  },
  {
    id: 4,
    name: "Enterprise",
    price: "$199.99/month",
    description: "Complete solution for large organizations",
    features: [
      "100 Users",
      "50 Branches",
      "All CRM Features",
      "24/7 Phone Support",
      "500GB Storage",
      "Advanced API Access",
      "Custom Integrations",
      "Dedicated Account Manager",
      "SLA Guarantee",
      "Unlimited Projects"
    ],
    users: 100,
    branches: 50
  }
];

export default function TenantPlans() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanSelect = async (planId: number) => {
    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      const planCode = planId === 1 ? 'free' : planId === 2 ? 'starter' : planId === 3 ? 'professional' : 'enterprise';

      // For paid plans, navigate to /payment with the selected plan
      if (planCode !== 'free') {
        const registrationData = localStorage.getItem('tenantRegistrationData') || sessionStorage.getItem('pendingRegistration');
        if (registrationData) {
          sessionStorage.setItem('pendingRegistration', registrationData);
        }
        navigate(`/payment?plan=${planCode}&billing=monthly`);
        return;
      }

      // Free / Trial registration directly
      const registrationData = localStorage.getItem('tenantRegistrationData') || sessionStorage.getItem('pendingRegistration');
      if (!registrationData) {
        notify.error("Please complete registration first");
        navigate("/tenant-registration");
        return;
      }

      const data = JSON.parse(registrationData);
      const response = await fetch(`${BASE_URL}/saas/auth/register-wizard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          subscriptionPlan: 'trial'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        notify.success("Organization registered successfully! Redirecting to login...");
        localStorage.removeItem('tenantRegistrationData');
        sessionStorage.removeItem('pendingRegistration');
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        notify.error(result.error || result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      notify.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRegistration = () => {
    navigate("/tenant-registration");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-red-700 dark:text-red-600 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Select the perfect plan for your organization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                plan.popular
                  ? "ring-2 ring-red-500 ring-offset-4"
                  : "border border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-red-700 dark:text-red-600">
                    {plan.price}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" size={16} />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={isLoading}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular
                    ? "bg-red-700 hover:bg-red-800 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isLoading && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    Select {plan.name} <IoIosArrowRoundForward className="inline" size={20} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleBackToRegistration}
            className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
}

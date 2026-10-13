import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { BASE_URL } from "~/constants/api";
import { Button } from "../../../src/component/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../src/component/ui/card";
import { Input } from "../../../src/component/ui/input";
import { Label } from "../../../src/component/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../src/component/ui/select";

interface Tenant {
  id: number;
  name: string;
  domain: string;
  status: string;
  subscription_plan: {
    id: number;
    name: string;
    price: string;
    features: Record<string, boolean>;
  };
  created_at: string;
}

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await fetch(`${BASE_URL}/tenants`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setTenants(result.data);
      } else {
        notify.error("Failed to load tenants");
      }
    } catch (error) {
      console.error("Error loading tenants:", error);
      notify.error("Failed to load tenants");
    }
  };

  const handleApproveSubscription = async (tenantId: number, subscriptionPlanId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/tenants/${tenantId}/subscription/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          subscriptionPlanId,
          status: "active"
        }),
      });

      const result = await response.json();
      if (result.success) {
        notify.success("Subscription approved successfully!");
        loadTenants(); // Refresh the list
      } else {
        notify.error(result.message || "Failed to approve subscription");
      }
    } catch (error) {
      console.error("Error approving subscription:", error);
      notify.error("Failed to approve subscription");
    }
  };

  const handleSuspendTenant = async (tenantId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/tenants/${tenantId}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          reason: "Administrative suspension"
        }),
      });

      const result = await response.json();
      if (result.success) {
        notify.success("Tenant suspended successfully!");
        loadTenants(); // Refresh the list
      } else {
        notify.error(result.message || "Failed to suspend tenant");
      }
    } catch (error) {
      console.error("Error suspending tenant:", error);
      notify.error("Failed to suspend tenant");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tenant Management Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant List */}
          <Card>
            <CardHeader>
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>Manage all organizations and their subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tenants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No tenants found</div>
              ) : (
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{tenant.name}</h3>
                          <p className="text-sm text-gray-600">Domain: {tenant.domain}</p>
                          <p className="text-sm text-gray-600">Status: 
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                              tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tenant.status}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Plan: {tenant.subscription_plan?.name} ({tenant.subscription_plan?.price})
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          {tenant.status === 'pending' && (
                            <Button
                              onClick={() => handleApproveSubscription(tenant.id, tenant.subscription_plan?.id || 1)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleSuspendTenant(tenant.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Suspend
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate("/tenant-registration")}
                className="w-full"
              >
                Register New Tenant
              </Button>
              
              <Button
                onClick={() => navigate("/settings")}
                className="w-full"
                variant="outline"
              >
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

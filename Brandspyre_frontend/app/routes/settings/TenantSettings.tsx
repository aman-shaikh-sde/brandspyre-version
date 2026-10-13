import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "~/services/notificationService";
import { apiClient } from "../../../src/services/apiClient";
import { Button } from "../../../src/component/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../src/component/ui/card";
import { Input } from "../../../src/component/ui/input";
import { Label } from "../../../src/component/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../src/component/ui/select";

interface TenantSettings {
  id: number;
  name: string;
  domain: string;
  max_users: number;
  max_branches: number;
  subscription_plan_id: number;
  subscription_status: string;
  features: Record<string, boolean>;
}

export default function TenantSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiClient.get("/saas/tenant/info");
      if (res.data?.success && res.data?.data) {
        setSettings(res.data.data);
      } else if (res.data) {
        setSettings(res.data);
      } else {
        notify.error("Failed to load tenant settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      notify.error("Failed to load settings");
    }
  };

  const handleUpdateSettings = async (field: keyof TenantSettings, value: any) => {
    if (!settings) return;

    try {
      const res = await apiClient.put("/saas/tenant/settings", {
        [field]: value
      });

      if (res.data?.success || res.status === 200) {
        setSettings(prev => ({ ...prev, [field]: value } as any));
        notify.success("Settings updated successfully!");
      } else {
        notify.error(res.data?.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      notify.error("Failed to update settings");
    }
  };

  const handleUpgradeSubscription = async () => {
    if (!settings) return;

    try {
      const res = await apiClient.post("/saas/subscription/upgrade", {
        subscriptionPlanId: 2
      });

      if (res.data?.success || res.status === 200) {
        notify.success("Subscription upgrade request submitted!");
        loadSettings();
      } else {
        notify.error(res.data?.message || "Failed to submit upgrade request");
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      notify.error("Failed to upgrade subscription");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tenant Settings</h1>
        
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !settings ? (
          <div className="text-center py-8 text-gray-500">Settings not available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Configure your organization details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleUpdateSettings("name", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={settings.domain}
                    onChange={(e) => handleUpdateSettings("domain", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={settings.max_users}
                    onChange={(e) => handleUpdateSettings("max_users", parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="max_branches">Max Branches</Label>
                  <Input
                    id="max_branches"
                    type="number"
                    value={settings.max_branches}
                    onChange={(e) => handleUpdateSettings("max_branches", parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Subscription Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Settings</CardTitle>
                <CardDescription>Manage subscription plans and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subscription_plan_id">Current Plan</Label>
                  <Select value={String(settings.subscription_plan_id)} onValueChange={(value) => handleUpdateSettings("subscription_plan_id", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subscription plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Basic - $9.99/month</SelectItem>
                      <SelectItem value="2">Professional - $29.99/month</SelectItem>
                      <SelectItem value="3">Enterprise - $99.99/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subscription_status">Subscription Status</Label>
                  <Input
                    id="subscription_status"
                    value={settings.subscription_status}
                    onChange={(e) => handleUpdateSettings("subscription_status", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Available Features</Label>
                  <div className="space-y-2 text-sm text-gray-600">
                    {Object.entries(settings.features || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleUpdateSettings("features", {
                            ...settings.features,
                            [key]: e.target.checked
                          })}
                          className="mr-2"
                        />
                        <span>{key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleUpgradeSubscription}
                  className="w-full mt-4"
                >
                  Upgrade Subscription Plan
                </Button>
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
                  onClick={() => navigate("/admin/organizations")}
                  className="w-full"
                >
                  Manage Tenants
                </Button>
                
                <Button
                  onClick={() => navigate("/tenant-registration")}
                  className="w-full"
                  variant="outline"
                >
                  Register New Tenant
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "src/services/apiClient";
import { useAuthStore } from "src/stores/authStore";
import { BrandLogo } from "~/components/public/BrandLogo";

import { BASE_URL } from "~/constants/api";

interface Workspace {
  tenantId: string;
  organizationName: string;
  tenantCode: string;
  subdomain: string;
  role: string;
  isOwner: boolean;
  status: string;
}

const BASE_SAAS_URL = `${BASE_URL}/saas/auth`;
const ONBOARDING_URL = `${BASE_URL}/saas/onboarding/status`;

const roleBadgeColor = (role: string) => {
  const r = role?.toLowerCase();
  if (r === "admin" || r === "org_owner") return "bg-red-100 text-red-700 border border-red-200";
  if (r?.includes("manager")) return "bg-blue-100 text-blue-700 border border-blue-200";
  return "bg-gray-100 text-gray-600 border border-gray-200";
};

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function WorkspaceSelector() {
  const navigate = useNavigate();
  const { accessToken, setAuthData, setOnboardingComplete } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }
    loadWorkspaces();
  }, [accessToken]);

  const loadWorkspaces = async () => {
    try {
      const res = await apiClient.get(`/saas/auth/workspaces`);
      const ws: Workspace[] = res.data?.data || [];
      setWorkspaces(ws);
      if (ws.length === 1) {
        await selectWorkspace(ws[0], accessToken!);
      }
    } catch (err: any) {
      setError("Failed to load your workspaces. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectWorkspace = async (ws: Workspace, token: string) => {
    setSwitching(ws.tenantId);
    try {
      const switchRes = await apiClient.post(
        `/saas/auth/switch-workspace`,
        { tenantId: ws.tenantId }
      );
      const { accessToken: newToken, activeWorkspace } = switchRes.data;

      setAuthData({
        accessToken: newToken,
        role: activeWorkspace?.role,
        branchcode: activeWorkspace?.branchcode,
        tenantId: activeWorkspace?.tenantId,
        staff_id: null,
        isActive: true,
        permissions: null,
      });
      // Token is kept strictly in memory via useAuthStore

      const onbRes = await apiClient.get(`/saas/onboarding/status`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      const completion = onbRes.data?.data?.completion_percentage ?? 100;
      const complete = completion >= 100;
      setOnboardingComplete(complete);
      navigate(complete ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err: any) {
      setError("Failed to switch workspace. Please try again.");
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 h-screen w-full bg-gray-100 dark:bg-gray-100">
        <div className="hidden sm:flex items-center justify-center">
          <img className="w-[500px] object-contain" src={alminoLogo} alt="Brandspyre" />
        </div>
        <div className="bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-700" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 h-screen w-full bg-gray-100 dark:bg-gray-100">
      {/* Left illustration */}
      <div className="hidden sm:flex flex-col items-center justify-center p-8">
        <img className="w-[500px] object-contain" src={alminoLogo} alt="Brandspyre" />
      </div>

      {/* Right form panel */}
      <div className="bg-white dark:bg-gray-900 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-[480px] w-full mx-auto p-6 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <BrandLogo size="lg" subtitle="Unified Business OS" layout="stacked" />
          </div>

          <h2 className="text-transparent text-2xl font-bold text-center mb-1 gradient-text">
            Choose Your Workspace
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            Select the organization you want to work in
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Workspace list */}
          <div className="flex flex-col gap-3">
            {workspaces.map((ws) => (
              <button
                key={ws.tenantId}
                onClick={() => selectWorkspace(ws, accessToken!)}
                disabled={!!switching}
                className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  switching === ws.tenantId
                    ? "border-red-700 bg-red-50 dark:bg-red-900/10 opacity-80 cursor-wait"
                    : "border-gray-200 dark:border-gray-700 hover:border-red-700 hover:bg-red-50/30 dark:hover:bg-red-900/5 bg-white dark:bg-gray-800"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-700 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-base">{getInitials(ws.organizationName)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{ws.organizationName}</p>
                  <p className="text-gray-400 text-xs font-mono mt-0.5">{ws.tenantCode}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleBadgeColor(ws.role)}`}>
                      {ws.role?.replace(/_/g, " ")}
                    </span>
                    {ws.isOwner && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        Owner
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-xs ${ws.status === "active" ? "text-green-600" : "text-yellow-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ws.status === "active" ? "bg-green-500" : "bg-yellow-500"}`} />
                      {ws.status}
                    </span>
                  </div>
                </div>

                {/* Arrow / spinner */}
                <div className="flex-shrink-0 text-gray-300">
                  {switching === ws.tenantId ? (
                    <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Not seeing your organization?{" "}
              <span
                className="text-red-700 hover:text-red-800 font-semibold cursor-pointer transition-colors"
                onClick={() => navigate("/org-register")}
              >
                Register a new one
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

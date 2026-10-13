import React from "react";
import { Navigate } from "react-router";

/**
 * Tenant Dashboard Redirect
 * Redirects legacy /tenant-dashboard route to canonical /admin/organizations.
 */
export default function TenantDashboardRedirect() {
  return <Navigate to="/admin/organizations" replace />;
}

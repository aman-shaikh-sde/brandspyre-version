import { Navigate } from "react-router";

/**
 * Legacy SuperAdminDashboard route (/admin/saas)
 * Automatically redirects to the canonical PlatformAdminDashboard (/admin/dashboard).
 */
export default function SuperAdminDashboard() {
  return <Navigate to="/admin/dashboard" replace />;
}

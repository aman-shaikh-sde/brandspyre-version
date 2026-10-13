/**
 * Centralized Dashboard Destination and Role Routing Helpers
 */

import { isPlatformAdminRole } from "./roleUtils";
export { isPlatformAdminRole };

export function getDefaultDashboardPath(role?: string | null): string {
  if (isPlatformAdminRole(role)) {
    return "/admin/dashboard";
  }
  return "/dashboard";
}

export function getDashboardLabel(role?: string | null): string {
  if (isPlatformAdminRole(role)) {
    return "Admin Dashboard";
  }
  return "Dashboard";
}

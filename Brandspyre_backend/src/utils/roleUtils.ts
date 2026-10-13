/**
 * Backend Canonical Role Definitions & Normalization Utility
 * Mirrors frontend normalization to ensure 100% parity across layers.
 */

export enum CanonicalRole {
  PLATFORM_ADMIN = "platform_admin",
  OWNER = "owner",
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
}

const PLATFORM_ADMIN_VARIANTS = new Set([
  "superadmin",
  "super admin",
  "platform_superadmin",
  "platform-superadmin",
  "master_super_admin",
  "master-super-admin",
  "platform_admin",
  "platform admin",
]);

const OWNER_VARIANTS = new Set([
  "owner",
  "tenant_owner",
  "organization_owner",
]);

const ADMIN_VARIANTS = new Set([
  "admin",
  "administrator",
  "tenant_admin",
  "tenant admin",
  "org_admin",
]);

const MANAGER_VARIANTS = new Set([
  "manager",
  "team leader",
  "team_leader",
  "team lead",
  "team_lead",
  "lead",
  "supervisor",
]);

const EMPLOYEE_VARIANTS = new Set([
  "employee",
  "staff",
  "user",
  "member",
  "developer",
  "worker",
  "associate",
]);

export function normalizeRole(rawRole?: string | null): CanonicalRole {
  if (!rawRole) return CanonicalRole.EMPLOYEE;
  const cleaned = rawRole.toLowerCase().trim();

  if (PLATFORM_ADMIN_VARIANTS.has(cleaned)) {
    return CanonicalRole.PLATFORM_ADMIN;
  }
  if (OWNER_VARIANTS.has(cleaned)) {
    return CanonicalRole.OWNER;
  }
  if (ADMIN_VARIANTS.has(cleaned)) {
    return CanonicalRole.ADMIN;
  }
  if (MANAGER_VARIANTS.has(cleaned)) {
    return CanonicalRole.MANAGER;
  }
  if (EMPLOYEE_VARIANTS.has(cleaned)) {
    return CanonicalRole.EMPLOYEE;
  }

  return CanonicalRole.EMPLOYEE;
}

export function isPlatformAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return normalizeRole(role) === CanonicalRole.PLATFORM_ADMIN;
}

export function isTenantAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const canonical = normalizeRole(role);
  return canonical === CanonicalRole.ADMIN || canonical === CanonicalRole.OWNER;
}

export function isManagerOrAbove(role?: string | null): boolean {
  if (!role) return false;
  const canonical = normalizeRole(role);
  return (
    canonical === CanonicalRole.PLATFORM_ADMIN ||
    canonical === CanonicalRole.OWNER ||
    canonical === CanonicalRole.ADMIN ||
    canonical === CanonicalRole.MANAGER
  );
}

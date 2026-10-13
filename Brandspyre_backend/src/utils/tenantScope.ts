import mongoose from "mongoose";
import { Request } from "express";

/**
 * Returns a Mongoose filter object ensuring strict tenant isolation.
 * For Platform SuperAdmins without a target tenant, returns empty filter allowing platform oversight.
 * For all tenant users, throws an error if tenant context is missing or invalid.
 */
export const getTenantFilter = (req: Request): Record<string, any> => {
  const securityContext = req.securityContext;

  if (securityContext?.isPlatformAdmin && !securityContext.tenantId) {
    return {};
  }

  const tenantId =
    securityContext?.tenantId ||
    (req.tenant?.id ? String(req.tenant.id) : undefined) ||
    req.user?.tenantId;

  if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
    throw new Error("UNAUTHORIZED_TENANT_ACCESS: Missing or invalid tenant isolation context.");
  }

  return {
    tenant_id: new mongoose.Types.ObjectId(tenantId)
  };
};

/**
 * Merges existing query filters with tenant isolation constraints.
 */
export const applyTenantScope = <T extends Record<string, any>>(
  filter: T,
  req: Request
): T & { tenant_id?: mongoose.Types.ObjectId } => {
  const tenantFilter = getTenantFilter(req);
  return { ...filter, ...tenantFilter };
};

export default {
  getTenantFilter,
  applyTenantScope
};

import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Tenant, UserTenant } from "../db/ModelSceham/saasSchema";
import { Branch } from "../db/ModelSceham/branchSchema";

import { 
  CanonicalRole, 
  normalizeRole, 
  isPlatformAdminRole, 
  isTenantAdminRole, 
  isManagerOrAbove 
} from "../utils/roleUtils";

export { 
  CanonicalRole, 
  normalizeRole, 
  isPlatformAdminRole, 
  isTenantAdminRole, 
  isManagerOrAbove 
};

export enum PlatformRole {
  SUPERADMIN = "superadmin",
  PLATFORM_SUPERADMIN = "platform_superadmin",
  MASTER_SUPER_ADMIN = "master_super_admin",
  PLATFORM_ADMIN = "platform_admin"
}

export enum TenantRole {
  OWNER = "owner",
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee"
}

export interface SecurityContext {
  userId: string;
  userRole: string;
  isPlatformAdmin: boolean;
  tenantId: string | null;
  branchCode: string | null;
  membershipId: string | null;
  scope: "platform" | "tenant";
  permissions?: string[];
  dataScope?: "all" | "branch" | "team" | "individual" | "platform";
}


declare global {
  namespace Express {
    interface Request {
      user?: any;
      securityContext?: any;
      tenant?: any;
      dataScope?: any;
    }
  }
}

export interface SecurityContextOptions {
  optional?: boolean;
  requireTenant?: boolean;
}

/**
 * Canonical Security Context Middleware
 * Enforces verified tenant isolation, role canonicalization, and branch safety.
 */
export const securityContextMiddleware = (options: SecurityContextOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      // Handle unauthenticated requests
      if (!user || !user.userId) {
        if (options.optional || (req as any).isOptionalAuth) {
          req.securityContext = undefined;
          return next();
        }
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Authentication is required to access this resource."
        });
        return;
      }

      let rawRole = (user.userRole || "").toLowerCase().trim();
      const isPlatformAdmin = isPlatformAdminRole(rawRole);
      const userIdStr = String(user.userId);

      let canonicalTenantId: string | null = null;
      let membershipId: string | null = user.membershipId || null;
      let branchCode: string | null = user.brcode || null;

      if (isPlatformAdmin) {
        // Platform Admins: Header tenant-id is allowed ONLY for explicit multi-tenant switching
        const headerTenant = (req.headers["x-tenant-id"] || req.headers["tenant-id"]) as string | undefined;
        const candidateTenant = headerTenant || user.tenantId;

        if (candidateTenant && mongoose.Types.ObjectId.isValid(candidateTenant)) {
          const tenantDoc: any = await Tenant.findById(candidateTenant).lean();
          if (tenantDoc) {
            canonicalTenantId = String(tenantDoc._id);
            req.tenant = {
              id: tenantDoc._id as mongoose.Types.ObjectId,
              name: tenantDoc.name || tenantDoc.company_name || null,
              domain: tenantDoc.domain || null,
              subscription_plan: tenantDoc.subscription_plan || null
            };
          }
        }

        // Branch validation for Platform Admin:
        // When switching tenants, NEVER carry over user.brcode from prior tenant.
        let validatedBranchCode: string | null = "ALL";
        const explicitBranch = (req.headers["x-branch-code"] || req.query.branch_code || req.query.branchcode) as string | undefined;

        if (canonicalTenantId) {
          // If a specific branch is explicitly requested for this tenant:
          if (explicitBranch && explicitBranch !== "ALL" && explicitBranch !== "all") {
            const validBranch = await Branch.findOne({
              tenant_id: new mongoose.Types.ObjectId(canonicalTenantId),
              branchcode: explicitBranch,
              status: "active"
            }).lean();

            if (validBranch) {
              validatedBranchCode = explicitBranch;
            } else {
              // Explicit branch does not belong to selected tenant - fallback safely to ALL
              validatedBranchCode = "ALL";
            }
          } else {
            // No explicit branch or explicit ALL - default to ALL
            validatedBranchCode = "ALL";
          }
        } else {
          // Global platform scope (no tenant selected)
          validatedBranchCode = explicitBranch || user.brcode || "ALL";
        }

        req.securityContext = {
          userId: userIdStr,
          userRole: rawRole,
          isPlatformAdmin: true,
          tenantId: canonicalTenantId,
          branchCode: validatedBranchCode,
          membershipId: null,
          scope: canonicalTenantId ? "tenant" : "platform",
          dataScope: "platform"
        };

        if (req.user) {
          req.user.userRole = rawRole;
          req.user.tenantId = canonicalTenantId;
          req.user.brcode = validatedBranchCode;
        }

        return next();
      }

      // Normal Tenant Users:
      // SECURITY RULE: Never trust x-tenant-id header from non-platform users!
      // Tenant ID must strictly come from the authenticated JWT token or UserTenant database record.
      let resolvedTenantId = user.tenantId;

      if (!resolvedTenantId) {
        // Fallback: lookup in UserTenant
        if (mongoose.Types.ObjectId.isValid(userIdStr)) {
          const ut = await UserTenant.findOne({
            user_id: new mongoose.Types.ObjectId(userIdStr),
            is_active: true
          }).sort({ created_at: -1 });

          if (ut) {
            resolvedTenantId = String(ut.tenant_id);
            membershipId = String(ut._id);
          }
        }
      }

      if (!resolvedTenantId) {
        if (options.optional) {
          req.securityContext = undefined;
          return next();
        }
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: "No organization associated with this user."
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(resolvedTenantId)) {
        res.status(400).json({
          success: false,
          error: "Invalid Organization Identifier"
        });
        return;
      }

      // Verify the Tenant is active
      const tenantDoc: any = await Tenant.findOne({
        _id: new mongoose.Types.ObjectId(resolvedTenantId),
        status: "active"
      }).lean();

      if (!tenantDoc) {
        if (options.optional || (req as any).isOptionalAuth) {
          req.securityContext = undefined;
          return next();
        }
        res.status(403).json({
          success: false,
          error: "Organization Inactive",
          message: "Your organization account is inactive, suspended, or does not exist."
        });
        return;
      }

      // Verify User-Tenant membership is active
      let userTenant: any = null;
      if (mongoose.Types.ObjectId.isValid(userIdStr)) {
        userTenant = await UserTenant.findOne({
          user_id: new mongoose.Types.ObjectId(userIdStr),
          tenant_id: new mongoose.Types.ObjectId(resolvedTenantId),
          is_active: true
        }).lean();

        if (!userTenant) {
          if (options.optional || (req as any).isOptionalAuth) {
            req.securityContext = undefined;
            return next();
          }
          res.status(403).json({
            success: false,
            error: "Access Denied",
            message: "User membership in this organization is inactive or revoked."
          });
          return;
        }

        membershipId = String(userTenant._id);
        if (userTenant.role) {
          rawRole = String(userTenant.role).toLowerCase().trim();
        }
        if (!branchCode && userTenant.default_branch_code) {
          branchCode = userTenant.default_branch_code;
        }
      }

      // Branch authorization check for tenant users
      const requestedBranch = (req.headers["x-branch-code"] || req.query.branchcode || req.query.branch_code || req.body?.branchcode || req.body?.branch_code) as string | undefined;

      const isTenantAdmin = isTenantAdminRole(rawRole);
      const authorizedBranch = userTenant?.default_branch_code || branchCode || null;

      if (!isTenantAdmin) {
        // Regular employees/managers are strictly restricted to their assigned branch
        if (requestedBranch && requestedBranch !== "all" && requestedBranch !== "ALL") {
          if (!authorizedBranch || requestedBranch.toUpperCase() !== authorizedBranch.toUpperCase()) {
            res.status(403).json({
              success: false,
              error: "forbidden_branch",
              message: "You are not authorized to access or operate on this branch."
            });
            return;
          }
        } else if (requestedBranch === "all" || requestedBranch === "ALL") {
          res.status(403).json({
            success: false,
            error: "forbidden_branch",
            message: "You are not authorized for cross-branch access."
          });
          return;
        }
        branchCode = authorizedBranch;
      } else {
        // Tenant admins can access any branch of their tenant, or ALL
        if (requestedBranch && requestedBranch !== "all" && requestedBranch !== "ALL") {
          const validBranch = await Branch.findOne({
            tenant_id: new mongoose.Types.ObjectId(resolvedTenantId),
            branchcode: requestedBranch,
            status: "active"
          }).lean();

          if (!validBranch) {
            res.status(404).json({
              success: false,
              error: "branch_not_found",
              message: "The requested branch does not exist in your organization."
            });
            return;
          }
          branchCode = requestedBranch;
        } else if (requestedBranch === "all" || requestedBranch === "ALL") {
          branchCode = "ALL";
        }
      }

      // Validate authorized branch assignment against this tenant (never arbitrarily select first branch)
      if (branchCode && branchCode !== "ALL" && resolvedTenantId) {
        const validBranch = await Branch.findOne({
          tenant_id: new mongoose.Types.ObjectId(resolvedTenantId),
          branchcode: branchCode,
          status: "active"
        }).lean();
        if (!validBranch) {
          // Unassigned or unauthorized branch code — do NOT fall back to arbitrary branch
          branchCode = null;
        }
      }

      canonicalTenantId = String(tenantDoc._id);

      // Populate canonical security context
      req.securityContext = {
        userId: userIdStr,
        userRole: rawRole,
        isPlatformAdmin: false,
        tenantId: canonicalTenantId,
        branchCode: branchCode || null,
        membershipId,
        scope: "tenant",
        dataScope: isTenantAdminRole(rawRole) ? "all" : "branch"
      };

      // Ensure req.tenant and req.user are fully backwards-compatible
      req.tenant = {
        id: tenantDoc._id as mongoose.Types.ObjectId,
        name: tenantDoc.name || tenantDoc.company_name || null,
        domain: tenantDoc.domain || null,
        subscription_plan: tenantDoc.subscription_plan || null
      };

      if (req.user) {
        req.user.userRole = rawRole;
        req.user.tenantId = canonicalTenantId;
        req.user.brcode = branchCode || null;
        req.user.membershipId = membershipId;
      }

      next();
    } catch (err) {
      console.error("[SecurityContext] Middleware error:", err);
      res.status(500).json({
        success: false,
        error: "Security Context Error",
        message: "Failed to evaluate security context."
      });
    }
  };
};

export default securityContextMiddleware;

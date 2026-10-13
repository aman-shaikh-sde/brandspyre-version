import { Request, Response, NextFunction } from "express";
import { Tenant, UserTenant, SubscriptionPlan, TenantSubscription } from "../db/ModelSceham/saasSchema";
import mongoose from "mongoose";
import { securityContextMiddleware } from "./securityContext";
import { isPlatformAdminRole } from "../utils/roleUtils";

// ============================================================
// SECURITY: Canonical Tenant Isolation & Authorization Middleware
// Delegates to canonical securityContextMiddleware to ensure:
//   1. Platform superadmins have cross-tenant or master context
//   2. Tenant and UserTenant active memberships are strictly verified in real-time
//   3. Role and branch authorizations are authoritative
// ============================================================
export const tenantAuth = (options?: { optional?: boolean }) => {
  return securityContextMiddleware({
    optional: options?.optional,
    requireTenant: !options?.optional,
  });
};

// Tenant role-based access control
export const checkTenantRole = (requiredRoles: string[]) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Allow platform super admins and tenant admins to bypass role checks
      const userRole = (req.user?.userRole || req.user?.role || '').toLowerCase();
      const isPlatformAdmin = isPlatformAdminRole(userRole);
      
      if (isPlatformAdmin || userRole === 'admin') {
        req.userRole = 'admin';
        next();
        return;
      }

      const userId = req.user?.id || req.user?.userId;
      const tenantId = req.tenant?.id;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const userTenant = await UserTenant.findOne({
        user_id: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId,
        tenant_id: tenantId
      });

      if (!userTenant) {
        res.status(403).json({
          success: false,
          message: "Access denied to this tenant"
        });
        return;
      }

      const tenantUserRole = userTenant.role;

      if (!requiredRoles.includes(tenantUserRole)) {
        res.status(403).json({
          success: false,
          message: "Insufficient permissions"
        });
        return;
      }

      req.userRole = tenantUserRole;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
};

// Subscription-based feature access control
export const checkSubscription = (requiredFeatures: string[]) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req.user?.userRole || req.user?.role || '').toLowerCase();
      const isPlatformAdmin = isPlatformAdminRole(userRole);

      // Platform admins bypass subscription feature checks
      if (isPlatformAdmin) {
        next();
        return;
      }

      const tenantId = req.tenant?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: "Authentication required"
        });
        return;
      }

      const subscription = await TenantSubscription.aggregate([
        { $match: { tenant_id: tenantId, status: 'active' } },
        {
          $lookup: {
            from: 'subscriptionplans',
            localField: 'plan_id',
            foreignField: '_id',
            as: 'plan'
          }
        },
        { $unwind: '$plan' }
      ]);

      if (subscription.length === 0) {
        res.status(403).json({
          success: false,
          message: "No active subscription found"
        });
        return;
      }

      const subscriptionFeatures = subscription[0].plan.features || {};

      // Check if required features are available
      const hasRequiredFeatures = requiredFeatures.every(feature => {
        return subscriptionFeatures[feature] === true;
      });

      if (!hasRequiredFeatures) {
        res.status(403).json({
          success: false,
          message: "Feature not available in current subscription plan"
        });
        return;
      }

      req.subscriptionFeatures = subscriptionFeatures;
      next();
    } catch (error) {
      console.error("Subscription check error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
};

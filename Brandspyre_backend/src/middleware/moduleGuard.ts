import { Request, Response, NextFunction } from 'express';
import OrganizationEntitlementService from '../services/saas/OrganizationEntitlementService';
import { isPlatformAdminRole } from './securityContext';

/**
 * Middleware requiring a specific organization module to be enabled.
 * Evaluates tenant context & organization entitlements.
 * Bypasses for platform_superadmin users.
 */
export const requireModule = (moduleCode: string) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.userRole || req.user?.role;
      // Platform superadmins bypass module checks
      if (isPlatformAdminRole(userRole)) {
        return next();
      }

      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant context required for module access validation.',
          code: 'TENANT_REQUIRED'
        });
        return;
      }

      const isEnabled = await OrganizationEntitlementService.isModuleEnabled(tenantId.toString(), moduleCode);
      if (!isEnabled) {
        res.status(403).json({
          success: false,
          error: `Module '${moduleCode.toUpperCase()}' is not enabled for your organization.`,
          code: 'MODULE_NOT_ENABLED',
          module: moduleCode.toUpperCase()
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`Module guard error for module '${moduleCode}':`, error);
      res.status(500).json({
        success: false,
        error: 'Internal server error checking module access.'
      });
    }
  };
};

/**
 * Middleware requiring a specific granular feature to be enabled for the organization.
 */
export const requireFeature = (featureCode: string) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.userRole || req.user?.role;
      if (isPlatformAdminRole(userRole)) {
        return next();
      }

      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant context required for feature access validation.',
          code: 'TENANT_REQUIRED'
        });
        return;
      }

      const isEnabled = await OrganizationEntitlementService.isFeatureEnabled(tenantId.toString(), featureCode);
      if (!isEnabled) {
        res.status(403).json({
          success: false,
          error: `Feature '${featureCode.toUpperCase()}' is not enabled for your organization.`,
          code: 'FEATURE_NOT_ENABLED',
          feature: featureCode.toUpperCase()
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`Feature guard error for feature '${featureCode}':`, error);
      res.status(500).json({
        success: false,
        error: 'Internal server error checking feature access.'
      });
    }
  };
};

export default {
  requireModule,
  requireFeature
};

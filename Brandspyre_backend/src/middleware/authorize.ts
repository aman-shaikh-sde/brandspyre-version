import { Request, Response, NextFunction } from 'express';
import { isPlatformAdminRole } from './securityContext';
import { AuditLog } from '../db/ModelSceham/saasSchema';
import RBACService from '../services/saas/RBACService';
import FeatureFlagService from '../services/saas/FeatureFlagService';
import mongoose from 'mongoose';

export interface AuthorizeOptions {
  moduleKey?: string;
  requireOwner?: boolean;
}

/**
 * Enterprise Authorization Middleware
 * Evaluates Permission Code, Data Scope, Feature Flags, and Platform Super Admin Bypass
 */
export const authorizePermission = (permissionCode: string, options: AuthorizeOptions = {}) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required. Please sign in.'
        });
        return;
      }

      // Step 1: Platform Super Admin Bypass Check
      // Platform Super Admin bypasses ALL tenant validation, subscription checks, feature flags, and permissions
      if (user.scope === 'platform' || isPlatformAdminRole(user.userRole || user.role)) {
        req.dataScope = 'platform';

        // Audit log platform superadmin access if targeting a tenant or protected permission
        const targetTenant = req.tenant?.id || req.query?.tenant_id || req.body?.tenant_id;
        if (targetTenant) {
          AuditLog.create({
            tenant_id: mongoose.isValidObjectId(targetTenant) ? new mongoose.Types.ObjectId(targetTenant) : undefined,
            user_id: mongoose.isValidObjectId(user.userId) ? new mongoose.Types.ObjectId(user.userId) : undefined,
            action: 'PLATFORM_CROSS_TENANT_ACCESS',
            entity: permissionCode,
            details: {
              path: req.originalUrl || req.path,
              method: req.method,
              userRole: user.userRole || user.role,
              targetTenant: String(targetTenant)
            },
            ip: req.ip || req.socket?.remoteAddress
          }).catch(err => console.warn('AuditLog error:', err.message));
        }

        next();
        return;
      }

      // Ensure tenant context is resolved for tenant users
      const tenantId = req.tenant?.id || user.tenantId;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant context required for authorization.'
        });
        return;
      }

      // Step 2: Validate Subscription Feature Flag if moduleKey specified or derived from code
      const moduleKey = options.moduleKey || permissionCode.split('.')[0];
      if (moduleKey) {
        const isEnabled = await FeatureFlagService.isModuleEnabled(tenantId, moduleKey);
        if (!isEnabled) {
          res.status(403).json({
            success: false,
            error: `Access Denied: Module '${moduleKey.toUpperCase()}' is disabled on your organization's subscription plan.`,
            code: 'FEATURE_DISABLED'
          });
          return;
        }
      }

      // Step 3: Evaluate Permission Code and Data Scope via RBACService
      const authResult = await RBACService.evaluatePermission(user.userId, tenantId, permissionCode);

      if (!authResult.granted) {
        res.status(403).json({
          success: false,
          error: `Access Denied: Insufficient permission to perform action '${permissionCode}'.`,
          code: 'PERMISSION_DENIED',
          details: authResult.reason
        });
        return;
      }

      // Attach resolved data scope to request object for controller query filtering
      req.dataScope = authResult.data_scope;
      next();
    } catch (error) {
      console.error(`Authorization error for code '${permissionCode}':`, error);
      res.status(500).json({
        success: false,
        error: 'Internal authorization error'
      });
    }
  };
};

export default authorizePermission;

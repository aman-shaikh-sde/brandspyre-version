import { Request, Response, NextFunction } from 'express';
import { Tenant, TenantSubscription, SubscriptionPlan } from '../db/ModelSceham/saasSchema';
import SubscriptionService from '../services/saas/SubscriptionService';
import FeatureLimitService, { FeatureMetric } from '../services/saas/FeatureLimitService';
import { isPlatformAdminRole } from './securityContext';

/**
   * Middleware requiring active, trial, or grace subscription.
   * Blocks access if subscription is expired, suspended, cancelled, or missing.
   */
export const requireActiveSubscription = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user?.userRole || req.user?.role;
    // Platform superadmins bypass tenant subscription checks
    if (isPlatformAdminRole(userRole)) {
      return next();
    }

    // SECURITY: Tenant ID from JWT/session ONLY — headers are NEVER trusted for non-platform users
    const tenantId = req.tenant?.id || req.user?.tenantId;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant context required' });
      return;
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant || tenant.status === 'suspended' || tenant.status === 'deleted') {
      res.status(403).json({
        error: 'ORGANIZATION_SUSPENDED',
        message: 'Organization workspace is suspended or unavailable.'
      });
      return;
    }

    const status = await SubscriptionService.evaluateSubscriptionStatus(tenantId.toString());

    if (status === 'expired' || status === 'suspended' || status === 'cancelled') {
      res.status(403).json({
        error: `SUBSCRIPTION_${status.toUpperCase()}`,
        message: `Access denied. Organization subscription status is ${status}.`,
        status
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Subscription guard error:', error);
    res.status(500).json({ error: 'Internal server error validating subscription' });
  }
};

/**
 * Middleware enforcing granular module access (e.g., 'hrms', 'payroll', 'inventory', 'accounting', 'analytics')
 */
export const requireModuleAccess = (moduleKey: string) => {
  return async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = req.user?.userRole || req.user?.role;
      if (isPlatformAdminRole(userRole)) {
        return next();
      }

      // SECURITY: Tenant ID from JWT/session ONLY — headers are NEVER trusted for non-platform users
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        res.status(400).json({ error: 'Tenant context required' });
        return;
      }

      const moduleCheck = await FeatureLimitService.checkModuleAccess(tenantId.toString(), moduleKey);
      if (!moduleCheck.allowed) {
        res.status(403).json({
          error: 'MODULE_NOT_ENABLED',
          message: moduleCheck.message,
          module: moduleKey
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Module guard error:', error);
      res.status(500).json({ error: 'Internal server error checking module access' });
    }
  };
};

/**
 * Middleware enforcing quantitative feature limits (e.g., max users, max leads, max projects)
 */
export const requireFeatureLimit = (metric: FeatureMetric) => {
  return FeatureLimitService.middleware(metric);
};
